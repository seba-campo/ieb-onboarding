export interface CreateOnboardingDTO {
  optionalSteps?: string[];
  isManual?: boolean;
}

export interface AdvanceStepDTO {
  payload: Record<string, string>;
}

export interface OnboardingResponseDTO {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'FAILED' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  currentStep: number;
  attempts: number;
  nextAttemptAt: Date;
  config: {
    optionalSteps: string[];
    isManual?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
