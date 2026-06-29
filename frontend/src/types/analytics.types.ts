export interface FunnelStep {
  step_name: string;
  count: number;
}

export interface ErrorRateStep {
  step_name: string;
  error_rate_pct: number;
}

export interface AvgTimeStep {
  step_name: string;
  avg_duration_ms: number;
}

export type OnboardingStatus = 'PENDING' | 'PROCESSING' | 'FAILED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface OnboardingRecord {
  id: string;
  status: OnboardingStatus;
  currentStep: number;
  attempts: number;
  config: { optionalSteps: string[]; isManual?: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface ActiveOnboarding {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'FAILED' | 'PAUSED';
  currentStep: number;
  attempts: number;
  config: { optionalSteps: string[]; isManual?: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  activeCount: number;
  activeOnboardings: ActiveOnboarding[];
  funnel: FunnelStep[];
  errorRates: ErrorRateStep[];
  averageTimes: AvgTimeStep[];
}
