import { db } from '../repository/db';
import { stepProcessor } from '../service/stepProcessor.service';

export class OnboardingWorker {
  private isRunning: boolean = false;
  private intervalMs: number = 1000;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[⚙️ Worker]: Motor de procesamiento concurrente inicializado.');
    this.loop();
  }

  private async loop() {
    while (this.isRunning) {
      try {
        await this.processNextJob();
      } catch (error) {
        console.error('[⚙️ Worker Error]: Error crítico en el ciclo de consumo:', error);
      }
      await new Promise((res) => setTimeout(res, this.intervalMs));
    }
  }

  private async processNextJob() {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

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
        return;
      }

      const job = rows[0];
      await client.query('COMMIT');

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

      const isManual: boolean = job.config?.isManual === true;

      if (isManual) {
        await this.handleAwaitingInput(job.id, job.currentStep);
        return;
      }

      const optionalSteps: string[] = job.config.optionalSteps || [];
      const currentStepName = stepNames[job.currentStep];

      if (optionalSteps.includes(currentStepName)) {
        await this.handleStepSuccess(job.id, job.currentStep, 0, 'SKIPPED');
        return;
      }

      const result = await stepProcessor.executeStep(job.currentStep, job.id);

      if (result.success) {
        await this.handleStepSuccess(job.id, job.currentStep, result.duration, 'SUCCESS');
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
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleStepSuccess(
    id: string,
    currentStep: number,
    duration: number,
    statusLog: string
  ) {
    const isLastStep = currentStep === 8;
    const nextStatus = isLastStep ? 'COMPLETED' : 'PENDING';
    const nextStep = isLastStep ? currentStep : currentStep + 1;

    const query = `
      UPDATE onboardings 
      SET status = $1, current_step = $2, attempts = 0, next_attempt_at = NOW(), updated_at = NOW()
      WHERE id = $3;
    `;
    await db.query(query, [nextStatus, nextStep, id]);

    const stepName = this.getStepName(currentStep);
    const logQuery = `
      INSERT INTO onboarding_logs (onboarding_id, step_name, status, duration_ms)
      VALUES ($1, $2, 'SUCCESS', $3);
    `;
    await db.query(logQuery, [id, stepName, duration]);
  }

  private async handleAwaitingInput(id: string, currentStep: number) {
    await db.query(
      `UPDATE onboardings SET status = 'PAUSED', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    const stepName = this.getStepName(currentStep);
    console.log(`[⏸️ Worker]: Onboarding ${id} pausado en paso ${stepName} — esperando input del usuario.`);
  }

  private async handleStepFailure(
    id: string,
    currentStep: number,
    currentAttempts: number,
    duration: number,
    error: string
  ) {
    const newAttempts = currentAttempts + 1;

    // Configuración de Backoff Exponencial en segundos: 2^attempts * 10 segundos
    const backoffSeconds = Math.pow(2, newAttempts) * 10;

    // 1. Actualizar el estado maestro a FAILED y setear el próximo intento en el futuro
    const query = `
      UPDATE onboardings 
      SET status = 'FAILED', attempts = $1, next_attempt_at = NOW() + ($2 || ' second')::interval, updated_at = NOW()
      WHERE id = $3;
    `;
    await db.query(query, [newAttempts, backoffSeconds, id]);

    // 2. Insertar el log de falla pasando el string resuelto desde TS
    const stepName = this.getStepName(currentStep);
    const logQuery = `
      INSERT INTO onboarding_logs (onboarding_id, step_name, status, duration_ms, error_message)
      VALUES ($1, $2, 'FAIL', $3, $4);
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
