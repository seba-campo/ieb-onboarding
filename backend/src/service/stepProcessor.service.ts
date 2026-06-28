import { db } from '../repository/db';

export const stepProcessor = {
  /**
   * Simula el procesamiento de un paso con un timeout configurable y probabilidad de fallo.
   */
  async executeStep(
    stepNumber: number,
    onboardingId: string
  ): Promise<{ success: boolean; duration: number; error?: string }> {
    const startTime = Date.now();

    // Obtener configuración o usar defaults (Timeout de 5000ms por defecto)
    const timeoutMs = 5000;

    // Mapeo estricto de los 8 pasos requeridos por el negocio
    const stepNames: Record<number, string> = {
      1: 'identity_verification', // RENAPER
      2: 'email_confirmation',
      3: 'phone_verification',
      4: 'document_upload',
      5: 'selfie_check',
      6: 'risk_scoring',
      7: 'account_creation',
      8: 'welcome_kit',
    };

    const currentStepName = stepNames[stepNumber];

    return new Promise(async (resolve) => {
      // Configurar el mecanismo de Timeout atómico para el paso
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          duration: Date.now() - startTime,
          error: `TIMEOUT_EXCEEDED: El paso ${currentStepName} superó el límite de ${timeoutMs}ms.`,
        });
      }, timeoutMs);

      try {
        // Simulación de latencia de red variable (entre 500ms y 1500ms)
        const mockLatency = Math.floor(Math.random() * 1000) + 500;
        await new Promise((res) => setTimeout(res, mockLatency));

        // Inyección de fallas aleatorias controladas (20% de probabilidad de error)
        // Excepto en pasos críticos si se prefiere, pero útil para estresar el backoff
        const shouldFail = Math.random() < 0.2;

        if (shouldFail) {
          throw new Error(
            `CONNECTION_ERROR: Falló la respuesta del proveedor externo en ${currentStepName}.`
          );
        }

        clearTimeout(timeoutId);
        resolve({
          success: true,
          duration: Date.now() - startTime,
        });
      } catch (err: any) {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          duration: Date.now() - startTime,
          error: err.message || 'UNKNOWN_ERROR',
        });
      }
    });
  },
};
