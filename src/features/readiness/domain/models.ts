export const EWMA_LOAD_ZONES = [
  "undertraining",
  "optimal",
  "elevated",
  "danger",
] as const;
export type EwmaLoadZone = (typeof EWMA_LOAD_ZONES)[number];

export const READINESS_ZONES = [
  "recovering",
  "maintaining",
  "fresh",
  "primed",
] as const;
export type ReadinessZone = (typeof READINESS_ZONES)[number];

export const TRIGGER_SEVERITIES = ["info", "warning", "critical"] as const;
export type TriggerSeverity = (typeof TRIGGER_SEVERITIES)[number];

export interface LoadEstimationInput {
  readonly totalVolumeKg: number;
  readonly durationSeconds: number;
  readonly setCount: number;
}

export type LoadEstimator = (input: LoadEstimationInput) => number;

export interface DailyLoadPoint {
  readonly date: string;
  readonly load: number;
  readonly sessionCount: number;
}

export interface MonotonyReport {
  readonly meanDailyLoad: number;
  readonly stdDevDailyLoad: number;
  readonly monotony: number;
}

export interface StrainReport extends MonotonyReport {
  readonly weeklyLoad: number;
  readonly strain: number;
}

export interface EwmaLoadRatio {
  readonly acute: number;
  readonly chronic: number;
  readonly ratio: number;
  readonly zone: EwmaLoadZone;
}

export interface FreshnessScore {
  readonly fitnessLoad: number;
  readonly fatigueLoad: number;
  readonly rawDelta: number;
  readonly score: number;
  readonly zone: ReadinessZone;
}

export interface TriggerSignal {
  readonly code: string;
  readonly severity: TriggerSeverity;
  readonly title: string;
  readonly message: string;
}

export interface ReadinessReport {
  readonly generatedAt: Date;
  readonly windowDays: number;
  readonly dailyLoads: readonly DailyLoadPoint[];
  readonly week: StrainReport;
  readonly ewma: EwmaLoadRatio;
  readonly freshness: FreshnessScore;
  readonly signals: readonly TriggerSignal[];
  readonly recommendation: string;
  readonly trend: TrendReport;
  readonly risk: RiskAssessment;
}

export interface TriggerContext {
  readonly week: StrainReport;
  readonly ewma: EwmaLoadRatio;
  readonly freshness: FreshnessScore;
  readonly sessionsThisWeek: number;
  readonly priorWeeklySessions: readonly number[];
}

export const DEFAULT_LOAD_ESTIMATOR: LoadEstimator = ({
  totalVolumeKg,
  durationSeconds,
}) => durationSeconds / 600 + totalVolumeKg / 1_000;

export const TREND_DIRECTIONS = ["rising", "steady", "falling"] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

export interface TrendReport {
  readonly direction: TrendDirection;
  readonly slopePerDay: number;
  readonly weekOverWeekDeltaPct: number;
}

export const RISK_LEVELS = ["low", "moderate", "high", "severe"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface RiskAssessment {
  readonly index: number;
  readonly level: RiskLevel;
  readonly actionPlan: string;
}

export interface EwmaBounds {
  readonly elevated: number;
  readonly danger: number;
}
