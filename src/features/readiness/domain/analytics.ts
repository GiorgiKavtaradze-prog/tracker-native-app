import type {
  DailyLoadPoint,
  RiskAssessment,
  RiskLevel,
  TriggerSignal,
  TrendReport,
} from "./models";

const EPSILON = 1e-9;

function sumLastDays(
  points: readonly DailyLoadPoint[],
  days: number,
): number {
  return points.slice(-days).reduce((sum, point) => sum + point.load, 0);
}

export function computeTrend(
  dailyLoads: readonly DailyLoadPoint[],
): TrendReport {
  const values = dailyLoads.map((point) => point.load);
  const n = values.length;

  if (n === 0) {
    return { direction: "steady", slopePerDay: 0, weekOverWeekDeltaPct: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const xMean = (n - 1) / 2;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (i - xMean) * (values[i]! - mean);
    denominator += (i - xMean) ** 2;
  }
  const slope = denominator > EPSILON ? numerator / denominator : 0;
  const slopePct = mean > EPSILON ? (slope / mean) * 100 : 0;

  const direction =
    slopePct > 2 ? "rising" : slopePct < -2 ? "falling" : "steady";

  const lastWeek = sumLastDays(dailyLoads, 7);
  const priorWeek = sumLastDays(
    dailyLoads.map((point) => point),
    14,
  ) - lastWeek;
  const weekOverWeekDeltaPct =
    priorWeek > EPSILON
      ? ((lastWeek - priorWeek) / priorWeek) * 100
      : lastWeek > EPSILON
        ? 100
        : 0;

  return {
    direction,
    slopePerDay: Math.round(slope * 1000) / 1000,
    weekOverWeekDeltaPct: Math.round(weekOverWeekDeltaPct * 10) / 10,
  };
}

const SEVERITY_WEIGHT = { critical: 30, warning: 16, info: 6 } as const;

const ACTION_PLANS = {
  low: "Progress normally — add volume or intensity gradually.",
  moderate: "Hold volume steady and cap progression at ~10% this week.",
  high: "Reduce training volume by 20–30% and prioritise sleep.",
  severe: "Take a full deload week — 4–7 days at half load.",
} as const satisfies Record<RiskLevel, string>;

export function classifyRiskLevel(index: number): RiskLevel {
  if (index < 20) return "low";
  if (index < 45) return "moderate";
  if (index < 70) return "high";
  return "severe";
}

export function computeRiskIndex(
  signals: readonly TriggerSignal[],
  freshnessScore: number,
): number {
  const signalLoad = signals.reduce(
    (sum, signal) => sum + SEVERITY_WEIGHT[signal.severity],
    0,
  );
  const fatiguePenalty = (100 - freshnessScore) / 5;
  return Math.round(Math.min(Math.max(signalLoad + fatiguePenalty, 0), 100));
}

export function assessRisk(
  signals: readonly TriggerSignal[],
  freshnessScore: number,
): RiskAssessment {
  const index = computeRiskIndex(signals, freshnessScore);
  const level = classifyRiskLevel(index);
  return { index, level, actionPlan: ACTION_PLANS[level] };
}
