import { db } from '../repository/db';
import { stepProcessor } from '../service/stepProcessor.service';

export class OnboardingWorker {
  private isRunning: boolean = false;
  private intervalMs: number = 100; // Tiempo de escaneo entre pasos
  private activeTasksCount: number = 0;
  private MAX_CONCURRENCY: number = 25; // Slots paralelos de procesamiento

  public async start() {
    if (this.isRunning) return;

    // Recover rows stuck in PROCESSING from a previous server crash (e.g. tsx restart mid-flight).
    // Without this, rows locked in PROCESSING are never picked up again since the loop only queries PENDING/FAILED.
    const { rowCount } = await db.query(`
      UPDATE onboardings
      SET status = 'FAILED', next_attempt_at = NOW(), updated_at = NOW()
      WHERE status = 'PROCESSING'
    `);
    if (rowCount && rowCount > 0) {
      console.log(`[⚙️ Worker]: ${rowCount} fila(s) en estado PROCESSING recuperadas → FAILED para reintento.`);
    }

    this.isRunning = true;
    console.log('[⚙️ Worker]: Motor de procesamiento concurrente inicializado.');
    this.loop();
  }

  private async loop() {
    while (this.isRunning) {
      // Si ya llegamos al límite de tareas paralelas, pausamos el bucle un instante
      if (this.activeTasksCount >= this.MAX_CONCURRENCY) {
        await new Promise((res) => setTimeout(res, 50));
        continue;
      }

      try {
        // Intentamos tomar un trabajo. Devuelve 'true' si encontró uno y arrancó la tarea.
        const jobStarted = await this.processNextJob();

        // Si no había tareas disponibles en Neon, le damos un respiro al bucle
        if (!jobStarted) {
          await new Promise((res) => setTimeout(res, this.intervalMs));
        }

        // Si encontró trabajo, el loop vuelve a girar INMEDIATAMENTE sin esperar los delays
        // del mock, buscando llenar el próximo slot libre de concurrencia.
      } catch (error) {
        console.error('[⚙️ Worker Error]: Falló el ciclo de consumo:', error);
        await new Promise((res) => setTimeout(res, this.intervalMs));
      }
    }
  }

  private async processNextJob(): Promise<boolean> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Selección y bloqueo atómico con SKIP LOCKED
      const selectQuery = `
        UPDATE onboardings SET status = 'PROCESSING', updated_at = NOW()
        WHERE id = (
          SELECT id FROM onboardings
          WHERE status IN ('PENDING', 'FAILED')
            AND next_attempt_at <= NOW()
          ORDER BY created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        ) RETURNING id, status, current_step as "currentStep", attempts, config;
      `;

      const { rows } = await client.query(selectQuery);

      if (rows.length === 0) {
        await client.query('COMMIT');
        return false; // No hay tareas listas en este segundo
      }

      const job = rows[0];
      await client.query('COMMIT'); // ¡CRÍTICO! Liberamos el bloqueo global de fila rápido. La fila ya quedó reservada en 'PROCESSING'.

      // Ocupamos un slot de concurrencia e iniciamos el procesamiento asíncronamente (SIN AWAIT)
      this.activeTasksCount++;
      this.runTaskBackground(job);

      return true; // Tarea iniciada con éxito
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release(); // Devolver la conexión de control al pooler de Neon
    }
  }

  private async runTaskBackground(job: any): Promise<void> {
    try {
      const stepNames: Record<number, string> = {
        1: 'identity_verification',
        2: 'email_confirmation',
        3: 'phone_verification',
        4: 'document_upload',
        5: 'selfie_check',
        6: 'risk_scoring',
        7: 'account_creation',
        8: 'welcome_kit',
      };

      const optionalSteps: string[] = job.config.optionalSteps || [];
      const currentStepName = stepNames[job.currentStep];

      // Verificación de paso opcional
      if (optionalSteps.includes(currentStepName)) {
        await this.handleStepSuccess(job.id, job.currentStep, 0, 'SKIPPED');
        return;
      }

      // En modo manual cada paso requiere input explícito del usuario — pausar y esperar
      if (job.config?.isManual === true) {
        await this.handleAwaitingInput(job.id, job.currentStep);
        return;
      }

      // El retardo del mock ocurre acá adentro, bloqueando este hilo virtual, no el bucle principal
      const result = await stepProcessor.executeStep(job.currentStep, job.id);

      if (result.success) {
        await this.handleStepSuccess(job.id, job.currentStep, result.duration, 'SUCCESS', result.mockData || {});
      } else {
        await this.handleStepFailure(
          job.id,
          job.currentStep,
          job.attempts,
          result.duration,
          result.error || 'FAIL'
        );
      }
    } catch (error) {
      console.error(`[🚨 Task Exception] Error procesando Onboarding ${job.id}:`, error);
    } finally {
      // Pase lo que pase, al terminar (éxito o falla), liberamos el slot de concurrencia
      this.activeTasksCount--;
    }
  }

  private async handleAwaitingInput(id: string, currentStep: number) {
    await db.query(`UPDATE onboardings SET status = 'PAUSED', updated_at = NOW() WHERE id = $1`, [
      id,
    ]);

    const stepName = this.getStepName(currentStep);
    console.log(
      `[⏸️ Worker]: Onboarding ${id} pausado en paso ${stepName} — esperando input del usuario.`
    );
  }

  private async handleStepSuccess(
    id: string,
    currentStep: number,
    duration: number,
    _statusLog: string,
    mockData: Record<string, any> = {}
  ) {
    const isLastStep = currentStep === 8;
    const nextStatus = isLastStep ? 'COMPLETED' : 'PENDING';
    const nextStep = isLastStep ? currentStep : currentStep + 1;

    const query = `
      UPDATE onboardings
      SET status = $1, current_step = $2, attempts = 0,
          next_attempt_at = NOW(), updated_at = NOW(),
          payload = payload || $3::jsonb
      WHERE id = $4;
    `;
    await db.query(query, [nextStatus, nextStep, JSON.stringify(mockData), id]);

    const stepName = this.getStepName(currentStep);
    const logQuery = `
      INSERT INTO onboarding_logs (onboarding_id, step_name, status, duration_ms) VALUES ($1, $2, 'SUCCESS', $3);
    `;
    await db.query(logQuery, [id, stepName, duration]);
  }

  private async handleStepFailure(
    id: string,
    currentStep: number,
    currentAttempts: number,
    duration: number,
    error: string
  ) {
    const newAttempts = currentAttempts + 1;
    const backoffSeconds = Math.pow(2, newAttempts) * 10;

    const query = `
      UPDATE onboardings SET status = 'FAILED', attempts = $1, next_attempt_at = NOW() + ($2 || ' second')::interval, updated_at = NOW() WHERE id = $3;
    `;
    await db.query(query, [newAttempts, backoffSeconds, id]);

    const stepName = this.getStepName(currentStep);
    const logQuery = `
      INSERT INTO onboarding_logs (onboarding_id, step_name, status, duration_ms, error_message) VALUES ($1, $2, 'FAIL', $3, $4);
    `;
    await db.query(logQuery, [id, stepName, duration, error]);
  }

  private getStepName(stepNumber: number): string {
    const stepNames: Record<number, string> = {
      1: 'identity_verification',
      2: 'email_confirmation',
      3: 'phone_verification',
      4: 'document_upload',
      5: 'selfie_check',
      6: 'risk_scoring',
      7: 'account_creation',
      8: 'welcome_kit',
    };
    return stepNames[stepNumber] || 'unknown_step';
  }
}

export const onboardingWorker = new OnboardingWorker();
