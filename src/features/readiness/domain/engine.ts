import type { CompletedSession } from "@/core";
import {
  DEFAULT_LOAD_ESTIMATOR,
  type DailyLoadPoint,
  type EwmaBounds,
  type EwmaLoadRatio,
  type EwmaLoadZone,
  type FreshnessScore,
  type LoadEstimator,
  type MonotonyReport,
  type ReadinessReport,
  type ReadinessZone,
  type StrainReport,
} from "./models";

export const MONOTONY_CAP = 5;
const MS_PER_DAY = 86_400_000;
const EPSILON = 1e-9;

export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildDailyLoads(
  sessions: readonly CompletedSession[],
  windowDays: number,
  now: Date,
  estimator: LoadEstimator = DEFAULT_LOAD_ESTIMATOR,
): DailyLoadPoint[] {
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const loads = new Map<string, { load: number; sessions: number }>();
  for (let i = windowDays - 1; i >= 0; i -= 1) {
    const dayStart = todayUtc - i * MS_PER_DAY;
    const key = new Date(dayStart).toISOString().slice(0, 10);
    loads.set(key, { load: 0, sessions: 0 });
  }

  for (const session of sessions) {
    if (session.completedAt.getTime() > now.getTime()) continue;
    const key = toDayKey(session.completedAt);
    const bucket = loads.get(key);
    if (!bucket) continue;
    bucket.load += estimator({
      totalVolumeKg: session.totalVolumeKg,
      durationSeconds: session.durationSeconds,
      setCount: session.setCount,
    });
    bucket.sessions += 1;
  }

  return [...loads].map(([date, value]) => ({
    date,
    load: round(value.load, 2),
    sessionCount: value.sessions,
  }));
}

export function stdDev(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeMonotony(
  dailyLoads: readonly DailyLoadPoint[],
): MonotonyReport {
  const tail = dailyLoads.slice(-7).map((point) => point.load);
  const mean = tail.reduce((sum, v) => sum + v, 0) / Math.max(tail.length, 1);
  const deviation = stdDev(tail);

  let monotony = 0;
  if (mean > EPSILON && deviation < EPSILON) {
    monotony = MONOTONY_CAP;
  } else if (deviation >= EPSILON) {
    monotony = Math.min(mean / deviation, MONOTONY_CAP);
  }

  return {
    meanDailyLoad: round(mean, 2),
    stdDevDailyLoad: round(deviation, 2),
    monotony: round(monotony, 2),
  };
}

export function computeStrain(
  dailyLoads: readonly DailyLoadPoint[],
): StrainReport {
  const { meanDailyLoad, stdDevDailyLoad, monotony } =
    computeMonotony(dailyLoads);
  const weeklyLoad = round(
    dailyLoads.slice(-7).reduce((sum, point) => sum + point.load, 0),
    2,
  );
  return {
    meanDailyLoad,
    stdDevDailyLoad,
    monotony,
    weeklyLoad,
    strain: round(weeklyLoad * monotony, 2),
  };
}

export function ewma(values: readonly number[], spanDays: number): number {
  if (values.length === 0) return 0;
  const lambda = 2 / (spanDays + 1);
  let acc = values[0]!;
  for (let i = 1; i < values.length; i += 1) {
    acc = lambda * values[i]! + (1 - lambda) * acc;
  }
  return acc;
}

export function classifyEwmaZone(
  ratio: number,
  bounds: EwmaBounds = { elevated: 1.3, danger: 1.5 },
): EwmaLoadZone {
  if (ratio < 0.8) return "undertraining";
  if (ratio <= bounds.elevated) return "optimal";
  if (ratio <= bounds.danger) return "elevated";
  return "danger";
}

export function computeEwmaRatio(
  dailyLoads: readonly DailyLoadPoint[],
  acuteDays = 7,
  chronicDays = 28,
  bounds: EwmaBounds = { elevated: 1.3, danger: 1.5 },
): EwmaLoadRatio {
  const series = dailyLoads.map((point) => point.load);
  const acute = ewma(series, acuteDays);
  const chronic = ewma(series, chronicDays);

  if (chronic < EPSILON) {
    const ratio = acute < EPSILON ? 1 : MONOTONY_CAP;
    return {
      acute: round(acute, 2),
      chronic: round(chronic, 2),
      ratio,
      zone: classifyEwmaZone(ratio, bounds),
    };
  }

  const ratio = acute / chronic;
  return {
    acute: round(acute, 2),
    chronic: round(chronic, 2),
    ratio: round(ratio, 2),
    zone: classifyEwmaZone(ratio, bounds),
  };
}

export function classifyReadinessZone(score: number): ReadinessZone {
  if (score >= 80) return "primed";
  if (score >= 60) return "fresh";
  if (score >= 40) return "maintaining";
  return "recovering";
}

export function computeFreshness(
  dailyLoads: readonly DailyLoadPoint[],
  acuteDays = 7,
  chronicDays = 28,
): FreshnessScore {
  const series = dailyLoads.map((point) => point.load);

  const meanOver = (days: number): number => {
    const tail = series.slice(-days);
    return tail.reduce((sum, v) => sum + v, 0) / Math.max(tail.length, 1);
  };

  const fitnessLoad = meanOver(chronicDays);
  const fatigueLoad = meanOver(acuteDays);
  const rawDelta = fitnessLoad - fatigueLoad;

  let score: number;
  if (fitnessLoad < EPSILON && fatigueLoad < EPSILON) {
    score = 50;
  } else if (fitnessLoad < EPSILON) {
    score = 0;
  } else {
    const ratio = fatigueLoad / fitnessLoad;
    score = clamp(100 - (ratio - 0.8) * 125, 0, 100);
  }

  return {
    fitnessLoad: round(fitnessLoad, 2),
    fatigueLoad: round(fatigueLoad, 2),
    rawDelta: round(rawDelta, 2),
    score: Math.round(score),
    zone: classifyReadinessZone(Math.round(score)),
  };
}

export function countWeeklySessions(
  sessions: readonly CompletedSession[],
  weeksBack: number,
  now: Date,
): number[] {
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const counts = new Array<number>(weeksBack).fill(0);

  for (const session of sessions) {
    const elapsedDays = Math.floor(
      (todayUtc - session.completedAt.getTime()) / MS_PER_DAY,
    );
    if (elapsedDays < 0) continue;
    const weekIndex = Math.floor(elapsedDays / 7);
    if (weekIndex < weeksBack) counts[weekIndex] += 1;
  }

  return counts;
}

export function synthesiseRecommendation(
  signals: readonly { severity: string; message: string }[],
): string {
  const critical = signals.find((signal) => signal.severity === "critical");
  if (critical) return critical.message;

  const warning = signals.find((signal) => signal.severity === "warning");
  if (warning) return warning.message;

  const info = signals.find((signal) => signal.severity === "info");
  if (info) return info.message;

  return "Load management looks healthy — hold course and keep progressing.";
}

export function assembleReport(input: {
  generatedAt: Date;
  windowDays: number;
  dailyLoads: readonly DailyLoadPoint[];
  week: StrainReport;
  ewma: EwmaLoadRatio;
  freshness: FreshnessScore;
  signals: readonly ReadinessReport["signals"][number][];
  trend: ReadinessReport["trend"];
  risk: ReadinessReport["risk"];
}): ReadinessReport {
  return {
    generatedAt: input.generatedAt,
    windowDays: input.windowDays,
    dailyLoads: input.dailyLoads,
    week: input.week,
    ewma: input.ewma,
    freshness: input.freshness,
    signals: [...input.signals],
    recommendation: synthesiseRecommendation(input.signals),
    trend: input.trend,
    risk: input.risk,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
