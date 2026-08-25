import type { CompletedSession } from "@/core";

export const ACHIEVEMENT_CATEGORIES = [
  "starting",
  "consistency",
  "volume",
  "strength",
] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export interface MetricContext {
  readonly sessions: readonly CompletedSession[];
}

export type MetricCalculator = (context: MetricContext) => number;

export interface MetricsSnapshot {
  readonly values: ReadonlyMap<string, number>;
}

export interface MilestoneFilter {
  readonly categories?: readonly AchievementCategory[];
  readonly codes?: readonly string[];
}

export interface MilestoneDefinition {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly icon: string;
  readonly metricKey: string;
  readonly target: number;
}

export interface AchievementUnlock {
  readonly code: string;
  readonly title: string;
  readonly category: AchievementCategory;
  readonly unlockedAt: Date;
  readonly currentValue: number;
  readonly target: number;
}

export interface MilestoneProgress {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly icon: string;
  readonly metricKey: string;
  readonly target: number;
  readonly current: number;
  readonly ratio: number;
  readonly unlocked: boolean;
  readonly unlockedAt: Date | null;
}

export function createMetricsSnapshot(
  values: Iterable<readonly [string, number]>,
): MetricsSnapshot {
  return { values: new Map(values) };
}

export function readMetric(snapshot: MetricsSnapshot, key: string): number {
  return snapshot.values.get(key) ?? 0;
}

export function snapshotToRecord(
  snapshot: MetricsSnapshot,
): Record<string, number> {
  const record: Record<string, number> = {};
  for (const [key, value] of snapshot.values) record[key] = value;
  return record;
}

export function defineMilestones(
  ...groups: ReadonlyArray<readonly MilestoneDefinition[]>
): readonly MilestoneDefinition[] {
  const merged: MilestoneDefinition[] = [];
  for (const group of groups) merged.push(...group);
  return merged;
}

export const DEFAULT_MILESTONES: readonly MilestoneDefinition[] = [
  {
    code: "first-workout",
    title: "First Rep",
    description: "Complete your very first workout session.",
    category: "starting",
    icon: "🎯",
    metricKey: "total-sessions",
    target: 1,
  },
  {
    code: "sessions-10",
    title: "Getting Consistent",
    description: "Log 10 completed workout sessions.",
    category: "consistency",
    icon: "🗓️",
    metricKey: "total-sessions",
    target: 10,
  },
  {
    code: "sessions-50",
    title: "Fifty Strong",
    description: "Log 50 completed workout sessions.",
    category: "consistency",
    icon: "🔥",
    metricKey: "total-sessions",
    target: 50,
  },
  {
    code: "sets-1000",
    title: "Rep Machine",
    description: "Log 1,000 cumulative sets.",
    category: "consistency",
    icon: "🔁",
    metricKey: "total-sets",
    target: 1000,
  },
  {
    code: "streak-7",
    title: "Week Warrior",
    description: "Train on 7 consecutive days.",
    category: "consistency",
    icon: "📅",
    metricKey: "best-streak",
    target: 7,
  },
  {
    code: "tonnage-10k",
    title: "Heavy Hitter",
    description: "Accumulate 10,000 kg of total training volume.",
    category: "volume",
    icon: "🏋️",
    metricKey: "total-volume-kg",
    target: 10_000,
  },
  {
    code: "tonnage-100k",
    title: "Six Figures of Iron",
    description: "Accumulate 100,000 kg of total training volume.",
    category: "volume",
    icon: "💪",
    metricKey: "total-volume-kg",
    target: 100_000,
  },
  {
    code: "lift-heavy",
    title: "Barbell Initiation",
    description: "Perform at least one set with a non-zero weight.",
    category: "strength",
    icon: "🏆",
    metricKey: "weighted-lifts",
    target: 1,
  },
  {
    code: "five-lifts",
    title: "Well Rounded",
    description: "Lift with a non-zero weight across 5 distinct exercises.",
    category: "strength",
    icon: "🗿",
    metricKey: "weighted-lifts",
    target: 5,
  },
];
