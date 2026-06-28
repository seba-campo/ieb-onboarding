export interface CreateOnboardingDTO {
  // El cliente puede pasar una lista de strings con los pasos opcionales que desea omitir o activar
  optionalSteps?: string[];
}

export interface OnboardingResponseDTO {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'FAILED' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  currentStep: number;
  attempts: number;
  nextAttemptAt: Date;
  config: {
    optionalSteps: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
