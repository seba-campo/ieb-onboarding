export type OnboardingStatus =
  'PENDING' | 'PROCESSING' | 'FAILED' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

export interface OnboardingConfig {
  optionalSteps: string[];
  isManual?: boolean;
}

export interface OnboardingResponse {
  id: string;
  status: OnboardingStatus;
  currentStep: number;
  attempts: number;
  nextAttemptAt: string; // ISO string devuelto por el JSON de la API
  config: OnboardingConfig;
  createdAt: string;
  updatedAt: string;
}
