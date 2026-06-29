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
  nextAttemptAt: string;
  config: OnboardingConfig;
  payload: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
