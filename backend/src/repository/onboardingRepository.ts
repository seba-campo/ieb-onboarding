import { db } from './db';
import { OnboardingResponseDTO } from '../dtos/onboarding.dto';

const STEP_NAMES: Record<number, string> = {
  1: 'identity_verification',
  2: 'email_confirmation',
  3: 'phone_verification',
  4: 'document_upload',
  5: 'selfie_check',
  6: 'risk_scoring',
  7: 'account_creation',
  8: 'welcome_kit',
};

export const onboardingRepository = {
  async create(optionalSteps: string[], isManual: boolean): Promise<OnboardingResponseDTO> {
    const config = { optionalSteps, isManual };
    const queryText = `
      INSERT INTO onboardings (config)
      VALUES ($1)
      RETURNING id, status, current_step as "currentStep", attempts, next_attempt_at as "nextAttemptAt", config, created_at as "createdAt", updated_at as "updatedAt";
    `;
    const { rows } = await db.query(queryText, [JSON.stringify(config)]);
    return rows[0];
  },

  async findById(id: string): Promise<OnboardingResponseDTO | null> {
    const queryText = `
      SELECT id, status, current_step as "currentStep", attempts, next_attempt_at as "nextAttemptAt", config, created_at as "createdAt", updated_at as "updatedAt"
      FROM onboardings WHERE id = $1;
    `;
    const { rows } = await db.query(queryText, [id]);
    return rows[0] || null;
  },

  async findAll(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<OnboardingResponseDTO[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const values: any[] = [limit, offset];
    let whereClause = '';
    if (options?.status) {
      values.push(options.status);
      whereClause = `WHERE status = $${values.length}`;
    }
    const queryText = `
      SELECT id, status, current_step AS "currentStep", attempts,
        next_attempt_at AS "nextAttemptAt", config,
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM onboardings
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const { rows } = await db.query(queryText, values);
    return rows;
  },

  async updateStatus(id: string, status: 'PAUSED' | 'PENDING' | 'CANCELLED'): Promise<void> {
    await db.query(
      `UPDATE onboardings SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
  },

  async advanceStep(
    id: string,
    payload: Record<string, string>
  ): Promise<OnboardingResponseDTO | null> {
    const onboarding = await this.findById(id);
    if (!onboarding) return null;

    const { currentStep } = onboarding;
    const isLastStep = currentStep === 8;
    const nextStatus = isLastStep ? 'COMPLETED' : 'PENDING';
    const nextStep = isLastStep ? currentStep : currentStep + 1;
    const stepName = STEP_NAMES[currentStep] || 'unknown_step';

    // Duración real = tiempo que estuvo en PAUSED (desde updated_at)
    const durationQuery = `SELECT EXTRACT(EPOCH FROM (NOW() - updated_at)) * 1000 AS duration_ms FROM onboardings WHERE id = $1`;
    const { rows: durationRows } = await db.query(durationQuery, [id]);
    const durationMs = Math.round(Number(durationRows[0]?.duration_ms) || 0);

    await db.query(
      `INSERT INTO onboarding_logs (onboarding_id, step_name, status, duration_ms, error_message) VALUES ($1, $2, 'SUCCESS', $3, $4)`,
      [id, stepName, durationMs, JSON.stringify(payload)]
    );

    await db.query(
      `UPDATE onboardings SET status = $1, current_step = $2, attempts = 0, next_attempt_at = NOW(), updated_at = NOW() WHERE id = $3`,
      [nextStatus, nextStep, id]
    );

    return this.findById(id);
  },
};
