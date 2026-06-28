import { db } from './db';
import { OnboardingResponseDTO } from '../dtos/onboarding.dto';

export const onboardingRepository = {
  async create(optionalSteps: string[]): Promise<OnboardingResponseDTO> {
    const config = { optionalSteps };
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
};
