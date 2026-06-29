export interface StepResult {
  success: boolean;
  duration: number;
  error?: string;
  mockData?: Record<string, any>;
}

export const stepProcessor = {
  async executeStep(stepNumber: number, _onboardingId: string): Promise<StepResult> {
    const startTime = Date.now();
    const timeoutMs = 5000;

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

    const currentStepName = stepNames[stepNumber];

    return new Promise(async (resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          duration: Date.now() - startTime,
          error: `TIMEOUT_EXCEEDED: El paso ${currentStepName} superó el límite de ${timeoutMs}ms.`,
        });
      }, timeoutMs);

      try {
        const mockLatency = Math.floor(Math.random() * 800) + 400;
        await new Promise((res) => setTimeout(res, mockLatency));

        const shouldFail = Math.random() < 0.05;
        if (shouldFail) {
          throw new Error(
            `PROVIDER_DOWN: Error de respuesta en el servicio de ${currentStepName}.`
          );
        }

        const mockData = stepProcessor.generateMockDataForStep(stepNumber);

        clearTimeout(timeoutId);
        resolve({ success: true, duration: Date.now() - startTime, mockData });
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

  generateMockDataForStep(step: number): Record<string, any> {
    const firstNames = ['Mariano', 'Florencia', 'Lucas', 'Agustina', 'Bautista'];
    const lastNames = ['Rodriguez', 'Gomez', 'Fernandez', 'Macri', 'Scaloni'];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    switch (step) {
      case 1:
        return {
          identity: {
            firstName: pick(firstNames),
            lastName: pick(lastNames),
            dni: Math.floor(10000000 + Math.random() * 90000000).toString(),
            gender: Math.random() < 0.5 ? 'M' : 'F',
            renaperValidated: true,
          },
        };
      case 2:
        return {
          email: {
            address: `user_${Math.floor(Math.random() * 9000) + 1000}@iebchallenge.com.ar`,
            codeVerified: true,
          },
        };
      case 3:
        return {
          phone: {
            countryCode: '+54',
            number: `11${Math.floor(10000000 + Math.random() * 90000000)}`,
            smsOtpSuccess: true,
          },
        };
      case 4:
        return {
          documents: {
            frontUrl: 'https://cdn.ieb.com/docs/front_mock.jpg',
            backUrl: 'https://cdn.ieb.com/docs/back_mock.jpg',
            ocrConfidence: parseFloat((95 + Math.random() * 4).toFixed(1)),
          },
        };
      case 5:
        return {
          biometrics: {
            livenessCheck: 'PASSED',
            facialMatchScore: parseFloat((90 + Math.random() * 9).toFixed(1)),
          },
        };
      case 6: {
        const score = Math.floor(Math.random() * 101); // 0–100 as per challenge spec
        return {
          creditScoring: {
            score,
            category: score >= 70 ? 'LOW_RISK' : score >= 40 ? 'MEDIUM_RISK' : 'HIGH_RISK',
            maxApprovedLimit: score * 50000,
          },
        };
      }
      case 7:
        return {
          bankAccount: {
            cvu: `00000031000${Math.floor(10000000000 + Math.random() * 90000000000)}`,
            accountType: 'ARS_SAVINGS_ACCOUNT',
            active: true,
          },
        };
      case 8:
        return {
          welcomeKit: {
            emailSent: true,
            cardDispatched: true,
            trackingId: `IEB-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        };
      default:
        return {};
    }
  },
};
