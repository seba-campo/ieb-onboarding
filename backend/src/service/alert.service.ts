import { alertRepository } from '../repository/alertRepository';
import { configRepository } from '../repository/configRepository';

// Valores por defecto — usados si la clave no existe en system_configs
export const ALERT_THRESHOLDS = {
  LOW_CONVERSION_RATE: 0.7,
  HIGH_STEP_ERROR_RATE_PCT: 20,
  STUCK_MIN_COUNT: 1,
  ERROR_SPIKE_COUNT: 50,
  COOLDOWN_MS: 30 * 60 * 1000,
  CONVERSION_MIN_SAMPLE: 10,
};

async function loadThresholds(): Promise<typeof ALERT_THRESHOLDS> {
  const cfg = await configRepository.getAllConfigs();
  return {
    LOW_CONVERSION_RATE:      Number(cfg['LOW_CONVERSION_RATE']      ?? ALERT_THRESHOLDS.LOW_CONVERSION_RATE),
    HIGH_STEP_ERROR_RATE_PCT: Number(cfg['HIGH_STEP_ERROR_RATE_PCT']  ?? ALERT_THRESHOLDS.HIGH_STEP_ERROR_RATE_PCT),
    STUCK_MIN_COUNT:          Number(cfg['STUCK_MIN_COUNT']           ?? ALERT_THRESHOLDS.STUCK_MIN_COUNT),
    ERROR_SPIKE_COUNT:        Number(cfg['ERROR_SPIKE_COUNT']         ?? ALERT_THRESHOLDS.ERROR_SPIKE_COUNT),
    COOLDOWN_MS:              Number(cfg['COOLDOWN_MS']               ?? ALERT_THRESHOLDS.COOLDOWN_MS),
    CONVERSION_MIN_SAMPLE:    Number(cfg['CONVERSION_MIN_SAMPLE']     ?? ALERT_THRESHOLDS.CONVERSION_MIN_SAMPLE),
  };
}

class AlertService {
  private readonly cooldowns = new Map<string, number>();
  private readonly webhookUrl = process.env.SLACK_WEBHOOK_URL;

  private isCoolingDown(key: string, cooldownMs: number): boolean {
    const last = this.cooldowns.get(key) ?? 0;
    return Date.now() - last < cooldownMs;
  }

  private markSent(key: string): void {
    this.cooldowns.set(key, Date.now());
  }

  private async sendToSlack(key: string, cooldownMs: number, blocks: object[]): Promise<void> {
    if (!this.webhookUrl) return;
    if (this.isCoolingDown(key, cooldownMs)) {
      console.log(`[🔔 Alert] Suprimida por cooldown: ${key}`);
      return;
    }

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      if (!res.ok) {
        console.error(`[🚨 Alert] Slack respondió con status ${res.status}`);
        return;
      }
      this.markSent(key);
      console.log(`[🔔 Alert] Enviada a Slack: ${key}`);
    } catch (err) {
      console.error('[🚨 Alert] Error al invocar Slack Webhook:', err);
    }
  }

  private buildBlocks(emoji: string, title: string, lines: string[]): object[] {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${title}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: lines.map((l) => `• ${l}`).join('\n') },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `_IEB Onboarding Engine · ${ts} UTC_` }],
      },
    ];
  }

  async checkAll(): Promise<void> {
    try {
      const [thresholds, conversion, stepErrors, stuckCount, recentErrors] = await Promise.all([
        loadThresholds(),
        alertRepository.getConversionRate(),
        alertRepository.getStepErrorRates(),
        alertRepository.getStuckCount(),
        alertRepository.getRecentErrorCount(),
      ]);

      // 1. Baja conversión global
      if (
        conversion.total >= thresholds.CONVERSION_MIN_SAMPLE &&
        conversion.rate < thresholds.LOW_CONVERSION_RATE
      ) {
        const pct = Math.round(conversion.rate * 100);
        await this.sendToSlack(
          'low_conversion',
          thresholds.COOLDOWN_MS,
          this.buildBlocks('📉', 'Baja tasa de conversión detectada', [
            `Conversión actual: *${pct}%* (umbral: ${Math.round(thresholds.LOW_CONVERSION_RATE * 100)}%)`,
            `Completados: ${conversion.completed} de ${conversion.total} en la última hora`,
            'Revisar pasos con alta tasa de fallo y onboardings en estado FAILED.',
          ])
        );
      }

      // 2. Alta tasa de error por paso
      for (const step of stepErrors) {
        if (step.error_rate_pct > thresholds.HIGH_STEP_ERROR_RATE_PCT) {
          await this.sendToSlack(
            `high_step_failure:${step.step_name}`,
            thresholds.COOLDOWN_MS,
            this.buildBlocks('⚠️', `Alta tasa de error en paso: ${step.step_name}`, [
              `Tasa de fallo: *${step.error_rate_pct}%* (umbral: ${thresholds.HIGH_STEP_ERROR_RATE_PCT}%)`,
              `Intentos registrados (última hora): ${step.total_attempts}`,
              `Paso afectado: \`${step.step_name}\``,
            ])
          );
        }
      }

      // 3. Onboardings estancados
      if (stuckCount >= thresholds.STUCK_MIN_COUNT) {
        await this.sendToSlack(
          'stuck_onboarding',
          thresholds.COOLDOWN_MS,
          this.buildBlocks('🧱', 'Onboardings estancados detectados', [
            `*${stuckCount}* onboarding(s) llevan más de 30 min sin avanzar.`,
            'Estado: PENDING o PROCESSING con next_attempt_at vencido.',
            'Verificar logs del worker y estado del pool de conexiones en Neon.',
          ])
        );
      }

      // 4. Spike de errores
      if (recentErrors > thresholds.ERROR_SPIKE_COUNT) {
        await this.sendToSlack(
          'error_spike',
          thresholds.COOLDOWN_MS,
          this.buildBlocks('🔴', 'Spike de errores detectado', [
            `*${recentErrors}* fallos en los últimos 5 minutos (umbral: ${thresholds.ERROR_SPIKE_COUNT}).`,
            'Posible degradación de proveedor externo o problema en el pooler de Neon.',
            'Revisar logs del worker de forma inmediata.',
          ])
        );
      }
    } catch (err) {
      console.error('[🚨 Alert] Error ejecutando checkAll():', err);
    }
  }
}

export const alertService = new AlertService();
