import { db } from './db';

export interface ConversionStats {
  completed: number;
  total: number;
  rate: number;
}

export interface StepErrorRate {
  step_name: string;
  error_rate_pct: number;
  total_attempts: number;
}

export const alertRepository = {
  async getConversionRate(): Promise<ConversionStats> {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'COMPLETED')  AS completed,
        COUNT(*) FILTER (WHERE status <> 'CANCELLED') AS total
      FROM onboardings
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    const completed = parseInt(rows[0].completed, 10);
    const total = parseInt(rows[0].total, 10);
    const rate = total > 0 ? completed / total : 1;
    return { completed, total, rate };
  },

  async getStepErrorRates(): Promise<StepErrorRate[]> {
    const { rows } = await db.query(`
      SELECT
        step_name,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'FAIL') * 100.0) / NULLIF(COUNT(*), 0), 2
        ) AS error_rate_pct,
        COUNT(*) AS total_attempts
      FROM onboarding_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY step_name
      HAVING COUNT(*) >= 5
      ORDER BY error_rate_pct DESC
    `);
    return rows.map((r) => ({
      step_name: r.step_name,
      error_rate_pct: parseFloat(r.error_rate_pct),
      total_attempts: parseInt(r.total_attempts, 10),
    }));
  },

  // Onboardings en PENDING/PROCESSING con next_attempt_at vencido hace más de 30 min
  async getStuckCount(): Promise<number> {
    const { rows } = await db.query(`
      SELECT COUNT(*) AS stuck_count
      FROM onboardings
      WHERE status IN ('PENDING', 'PROCESSING')
        AND updated_at < NOW() - INTERVAL '30 minutes'
        AND next_attempt_at <= NOW()
    `);
    return parseInt(rows[0].stuck_count, 10);
  },

  async getRecentErrorCount(): Promise<number> {
    const { rows } = await db.query(`
      SELECT COUNT(*) AS recent_errors
      FROM onboarding_logs
      WHERE status = 'FAIL'
        AND created_at > NOW() - INTERVAL '5 minutes'
    `);
    return parseInt(rows[0].recent_errors, 10);
  },
};
