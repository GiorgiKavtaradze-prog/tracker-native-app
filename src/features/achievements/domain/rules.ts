import {
  readMetric,
  type AchievementUnlock,
  type MetricsSnapshot,
  type MilestoneDefinition,
  type MilestoneFilter,
  type MilestoneProgress,
} from "./models";

export function selectMilestones(
  definitions: readonly MilestoneDefinition[],
  filter?: MilestoneFilter,
): readonly MilestoneDefinition[] {
  if (!filter) return definitions;

  const categories = new Set(filter.categories ?? []);
  const codes = new Set(filter.codes ?? []);
  if (categories.size === 0 && codes.size === 0) return definitions;

  return definitions.filter(
    (definition) =>
      (categories.size === 0 || categories.has(definition.category)) &&
      (codes.size === 0 || codes.has(definition.code)),
  );
}

export function milestoneRatio(
  definition: MilestoneDefinition,
  snapshot: MetricsSnapshot,
): number {
  const value = readMetric(snapshot, definition.metricKey);
  if (definition.target <= 0) return value > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, value / definition.target));
}

export function isMilestoneUnlocked(
  definition: MilestoneDefinition,
  snapshot: MetricsSnapshot,
): boolean {
  return readMetric(snapshot, definition.metricKey) >= definition.target;
}

export function toUnlock(
  definition: MilestoneDefinition,
  snapshot: MetricsSnapshot,
  unlockedAt: Date,
): AchievementUnlock {
  return {
    code: definition.code,
    title: definition.title,
    category: definition.category,
    unlockedAt,
    currentValue: readMetric(snapshot, definition.metricKey),
    target: definition.target,
  };
}

export function filterFreshUnlocks(
  definitions: readonly MilestoneDefinition[],
  snapshot: MetricsSnapshot,
  existingCodes: ReadonlySet<string>,
  now: Date,
): AchievementUnlock[] {
  return definitions
    .filter((d) => isMilestoneUnlocked(d, snapshot) && !existingCodes.has(d.code))
    .map((d) => toUnlock(d, snapshot, now));
}

export function evaluateMilestones(
  definitions: readonly MilestoneDefinition[],
  snapshot: MetricsSnapshot,
  unlockedAtByCode: ReadonlyMap<string, Date>,
): MilestoneProgress[] {
  return definitions.map((definition) => {
    const unlocked = isMilestoneUnlocked(definition, snapshot);
    return {
      code: definition.code,
      title: definition.title,
      description: definition.description,
      category: definition.category,
      icon: definition.icon,
      metricKey: definition.metricKey,
      target: definition.target,
      current: readMetric(snapshot, definition.metricKey),
      ratio: milestoneRatio(definition, snapshot),
      unlocked,
      unlockedAt: unlockedAtByCode.get(definition.code) ?? null,
    };
  });
}

