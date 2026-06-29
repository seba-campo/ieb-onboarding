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

export interface DashboardMetrics {
  activeCount: number;
  funnel: FunnelStep[];
  errorRates: ErrorRateStep[];
  averageTimes: AvgTimeStep[];
}
