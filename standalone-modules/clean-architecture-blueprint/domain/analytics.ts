import type { ExerciseId } from "../shared/brand";
import { roundToDecimals, sumOf } from "../shared/numbers";
import type { ExerciseBlueprint, MuscleGroup } from "./exercise-catalog";
import type { TrainingSession } from "./training-session";

export const MILLISECONDS_PER_DAY = 86_400_000;

export interface WeeklyVolumePoint {
  readonly weekStartedOnIso: string;
  readonly volumeByMuscle: Readonly<Partial<Record<MuscleGroup, number>>>;
  readonly totalKg: number;
}

export interface LoadTrajectoryVerdict {
  readonly label: "deloading" | "steady" | "escalating";
  readonly deltaRpe: number;
}

export interface PersonalBestEntry {
  readonly exerciseId: ExerciseId;
  readonly bestEstimatedOneRepMaxKg: number;
}

const isoWeekStartOf = (instant: Date): string => {
  const utcMidnight = Date.UTC(
    instant.getUTCFullYear(),
    instant.getUTCMonth(),
    instant.getUTCDate(),
  );
  const weekdayOffset = (new Date(utcMidnight).getUTCDay() + 6) % 7;
  return new Date(utcMidnight - weekdayOffset * MILLISECONDS_PER_DAY)
    .toISOString()
    .slice(0, 10);
};

const dayKeyOf = (instant: Date): string => instant.toISOString().slice(0, 10);

export const weeklyVolumeTimeline = (
  sessions: readonly TrainingSession[],
  directory: ReadonlyMap<ExerciseId, ExerciseBlueprint>,
  horizonWeeks: number,
): readonly WeeklyVolumePoint[] => {
  const buckets = new Map<string, Map<MuscleGroup, number>>();
  for (const session of sessions) {
    if (!session.isCompleted) continue;
    const weekKey = isoWeekStartOf(session.completedAt ?? session.startedAt);
    const bucket = buckets.get(weekKey) ?? new Map<MuscleGroup, number>();
    for (const [exerciseId, volume] of session.volumeByExercise()) {
      const blueprint = directory.get(exerciseId);
      if (!blueprint) continue;
      const engagedMuscles: readonly MuscleGroup[] = [
        blueprint.primary,
        ...blueprint.secondary,
      ];
      const share = volume / engagedMuscles.length;
      for (const muscle of engagedMuscles) {
        bucket.set(
          muscle,
          roundToDecimals((bucket.get(muscle) ?? 0) + share, 2),
        );
      }
    }
    buckets.set(weekKey, bucket);
  }
  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-horizonWeeks)
    .map(([weekStartedOnIso, volumes]) => ({
      weekStartedOnIso,
      volumeByMuscle: Object.fromEntries(volumes) as Partial<
        Record<MuscleGroup, number>
      >,
      totalKg: roundToDecimals(sumOf([...volumes.values()]), 2),
    }));
};

export const activeDayStreak = (
  sessions: readonly TrainingSession[],
  reference: Date,
): number => {
  const trainedDays = new Set(
    sessions
      .filter((session) => session.isCompleted)
      .map((session) => dayKeyOf(session.completedAt ?? session.startedAt)),
  );
  let streak = 0;
  let cursor = reference.getTime();
  if (!trainedDays.has(dayKeyOf(new Date(cursor)))) {
    cursor -= MILLISECONDS_PER_DAY;
  }
  while (trainedDays.has(dayKeyOf(new Date(cursor)))) {
    streak += 1;
    cursor -= MILLISECONDS_PER_DAY;
  }
  return streak;
};

export const loadTrajectory = (
  recentAverageRpe: readonly (number | null)[],
): LoadTrajectoryVerdict | null => {
  const readings = recentAverageRpe.filter(
    (reading): reading is number => reading !== null,
  );
  if (readings.length < 2) return null;
  const earliest = readings[0];
  const latest = readings[readings.length - 1];
  const deltaRpe = roundToDecimals(latest - earliest, 1);
  const label =
    deltaRpe > 0.75 ? "escalating" : deltaRpe < -0.75 ? "deloading" : "steady";
  return { label, deltaRpe };
};

export const personalBests = (
  sessions: readonly TrainingSession[],
): readonly PersonalBestEntry[] => {
  const leaders = new Map<ExerciseId, number>();
  for (const session of sessions) {
    if (!session.isCompleted) continue;
    for (const exerciseId of session.exerciseIds()) {
      const candidate = session.bestEstimatedOneRepMaxKg(exerciseId);
      if (candidate !== null && candidate > (leaders.get(exerciseId) ?? 0)) {
        leaders.set(exerciseId, candidate);
      }
    }
  }
  return [...leaders.entries()]
    .map(([exerciseId, bestEstimatedOneRepMaxKg]) => ({
      exerciseId,
      bestEstimatedOneRepMaxKg,
    }))
    .sort(
      (left, right) =>
        right.bestEstimatedOneRepMaxKg - left.bestEstimatedOneRepMaxKg,
    );
};

export const priorPersonalBests = (
  sessions: readonly TrainingSession[],
): ReadonlyMap<ExerciseId, number> =>
  new Map(
    personalBests(sessions).map((entry) => [
      entry.exerciseId,
      entry.bestEstimatedOneRepMaxKg,
    ]),
  );
