import type { CompletedSession } from "@/core";
import {
  createMetricsSnapshot,
  type MetricCalculator,
  type MetricContext,
  type MetricsSnapshot,
} from "./models";

const ONE_DAY_MS = 86_400_000;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function dayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function bestConsecutiveDayRun(dates: readonly Date[]): number {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates.map(dayKey))].sort();
  let best = 0;
  let current = 0;
  let previous: number | null = null;

  for (const key of unique) {
    const timestamp = Date.parse(`${key}T00:00:00.000Z`);
    current =
      previous !== null && timestamp - previous === ONE_DAY_MS
        ? current + 1
        : 1;
    if (current > best) best = current;
    previous = timestamp;
  }

  return best;
}

function totalVolumeKg(sessions: readonly CompletedSession[]): number {
  return round2(
    sessions.reduce((sum, session) => sum + session.totalVolumeKg, 0),
  );
}

function weightedLifts(sessions: readonly CompletedSession[]): number {
  const exercises = new Set<string>();
  for (const session of sessions) {
    for (const set of session.sets) {
      if ((set.weight ?? 0) > 0) exercises.add(set.exerciseId);
    }
  }
  return exercises.size;
}

export const DEFAULT_METRIC_CALCULATORS: Readonly<
  Record<string, MetricCalculator>
> = {
  "total-sessions": ({ sessions }) => sessions.length,
  "total-volume-kg": ({ sessions }) => totalVolumeKg(sessions),
  "total-sets": ({ sessions }) =>
    sessions.reduce((sum, session) => sum + session.setCount, 0),
  "best-streak": ({ sessions }) =>
    bestConsecutiveDayRun(sessions.map((session) => session.completedAt)),
  "weighted-lifts": ({ sessions }) => weightedLifts(sessions),
};

export function mergeCalculators(
  overrides: Record<string, MetricCalculator>,
  base: Readonly<Record<string, MetricCalculator>> = DEFAULT_METRIC_CALCULATORS,
): Readonly<Record<string, MetricCalculator>> {
  return { ...base, ...overrides };
}

export function computeMetrics(
  context: MetricContext,
  calculators: Readonly<
    Record<string, MetricCalculator>
  > = DEFAULT_METRIC_CALCULATORS,
): MetricsSnapshot {
  const entries: (readonly [string, number])[] = [];
  for (const [key, calculate] of Object.entries(calculators)) {
    entries.push([key, calculate(context)] as const);
  }
  return createMetricsSnapshot(entries);
}
