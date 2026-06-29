import { db } from './db';

export interface DashboardMetrics {
  activeCount: number;
  activeOnboardings: {
    id: string;
    status: string;
    currentStep: number;
    attempts: number;
    config: { optionalSteps: string[]; isManual?: boolean };
    createdAt: string;
    updatedAt: string;
  }[];
  funnel: { step_name: string; count: number }[];
  errorRates: { step_name: string; error_rate_pct: number }[];
  averageTimes: { step_name: string; avg_duration_ms: number; total_avg_ms: number };
}

export const analyticsRepository = {
  /**
   * Ejecuta consultas en paralelo para extraer la foto analítica actual del sistema.
   */
  async getDashboardMetrics(): Promise<any> {
    // 1. Contador de onboardings activos (PENDING, PROCESSING, FAILED, PAUSED)
    const activeQuery = `
      SELECT COUNT(*) as "activeCount"
      FROM onboardings
      WHERE status IN ('PENDING', 'PROCESSING', 'FAILED', 'PAUSED');
    `;

    // 1b. Lista individual de onboardings activos para la tabla del dashboard
    const activeOnboardingsQuery = `
      SELECT
        id,
        status,
        current_step AS "currentStep",
        attempts,
        config,
        created_at   AS "createdAt",
        updated_at   AS "updatedAt"
      FROM onboardings
      WHERE status IN ('PENDING', 'PROCESSING', 'FAILED', 'PAUSED')
      ORDER BY created_at ASC
      LIMIT 100;
    `;

    // 2. Funnel de conversión: Cuántos usuarios únicos alcanzaron con éxito cada paso
    const funnelQuery = `
      SELECT step_name, COUNT(DISTINCT onboarding_id) as "count"
      FROM onboarding_logs
      WHERE status = 'SUCCESS'
      GROUP BY step_name
      ORDER BY MIN(created_at) ASC;
    `;

    // 3. Tasa de error por paso (Fallos / Total de intentos del paso)
    const errorRateQuery = `
      SELECT
        step_name,
        ROUND((COUNT(CASE WHEN status = 'FAIL' THEN 1 END) * 100.0) / COUNT(*), 2) as "error_rate_pct"
      FROM onboarding_logs
      GROUP BY step_name
      ORDER BY CASE step_name
        WHEN 'identity_verification' THEN 1
        WHEN 'email_confirmation'    THEN 2
        WHEN 'phone_verification'    THEN 3
        WHEN 'document_upload'       THEN 4
        WHEN 'selfie_check'          THEN 5
        WHEN 'risk_scoring'          THEN 6
        WHEN 'account_creation'      THEN 7
        WHEN 'welcome_kit'           THEN 8
        ELSE 9
      END;
    `;

    // 4. Tiempo promedio por paso y total global de los completados
    const avgTimeQuery = `
      SELECT
        step_name,
        ROUND(AVG(duration_ms), 0) as "avg_duration_ms"
      FROM onboarding_logs
      WHERE status = 'SUCCESS'
      GROUP BY step_name
      ORDER BY CASE step_name
        WHEN 'identity_verification' THEN 1
        WHEN 'email_confirmation'    THEN 2
        WHEN 'phone_verification'    THEN 3
        WHEN 'document_upload'       THEN 4
        WHEN 'selfie_check'          THEN 5
        WHEN 'risk_scoring'          THEN 6
        WHEN 'account_creation'      THEN 7
        WHEN 'welcome_kit'           THEN 8
        ELSE 9
      END;
    `;

    // se ejecuta todas las consultas en paralelo para optimizar el uso del pooler de Neon
    const [activeRes, activeOnboardingsRes, funnelRes, errorRes, avgRes] = await Promise.all([
      db.query(activeQuery),
      db.query(activeOnboardingsQuery),
      db.query(funnelQuery),
      db.query(errorRateQuery),
      db.query(avgTimeQuery),
    ]);

    return {
      activeCount: parseInt(activeRes.rows[0].activeCount, 10),
      activeOnboardings: activeOnboardingsRes.rows,
      funnel: funnelRes.rows,
      errorRates: errorRes.rows,
      averageTimes: avgRes.rows,
    };
  },
};
