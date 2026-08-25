/**
 * Domain mathematics for training load — pure, side-effect-free computations of
 * volume/tonnage, per-exercise breakdowns, one-rep-max estimation and personal
 * best detection. These are intentionally deterministic and unit-testable.
 */
import type { CompletedSession, PersonalBest, SetLog } from "./entities";

/** Tonnage (kg × reps) of a single set; bodyweight/unknown sets count as 0. */
export function setTonnageKg(set: SetLog): number {
  const weight = set.weight ?? 0;
  if (weight <= 0 || set.reps <= 0) return 0;
  return weight * set.reps;
}

/** Total training volume (tonnage) for a collection of sets. */
export function computeVolumeKg(sets: SetLog[]): number {
  return sets.reduce((sum, set) => sum + setTonnageKg(set), 0);
}

/** Number of logged sets. */
export function computeSetCount(sets: SetLog[]): number {
  return sets.length;
}

/** Groups sets by exercise id, preserving first-encounter order. */
export function groupSetsByExercise(sets: SetLog[]): Map<string, SetLog[]> {
  const grouped = new Map<string, SetLog[]>();
  for (const set of sets) {
    const bucket = grouped.get(set.exerciseId);
    if (bucket) bucket.push(set);
    else grouped.set(set.exerciseId, [set]);
  }
  return grouped;
}

/** Per-exercise training volume (kg), keyed by exercise id. */
export function volumeByExercise(sets: SetLog[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const [exerciseId, exerciseSets] of groupSetsByExercise(sets)) {
    result.set(exerciseId, computeVolumeKg(exerciseSets));
  }
  return result;
}

/**
 * Estimates a one-rep-max using the Epley formula.
 * Returns `null` when the inputs are not physically meaningful.
 */
export function estimateOneRepMaxKg(
  weightKg: number,
  reps: number,
): number | null {
  if (weightKg <= 0 || reps < 1 || !Number.isFinite(weightKg)) return null;
  if (reps === 1) return Math.round(weightKg * 2) / 2;
  return Math.round(weightKg * (1 + reps / 30) * 2) / 2;
}

/**
 * Detects whether `attempt` beats `current`. A new best is declared when the
 * lifted weight is strictly greater, or the weight is equal with more reps
 * (weight takes precedence over reps by default).
 */
export function detectNewPersonalBest(
  current: PersonalBest | null,
  attempt: { exerciseId: string; weightKg: number; reps: number; at: Date },
): PersonalBest {
  const existing =
    current &&
    current.exerciseId === attempt.exerciseId &&
    (attempt.weightKg > current.bestWeightKg ||
      (attempt.weightKg === current.bestWeightKg &&
        attempt.reps > current.bestReps));

  if (existing) {
    return {
      ...current!,
      bestWeightKg: attempt.weightKg,
      bestReps: attempt.reps,
      achievedAt: attempt.at,
    };
  }

  return (
    current ?? {
      exerciseId: attempt.exerciseId,
      bestWeightKg: attempt.weightKg,
      bestReps: attempt.reps,
      achievedAt: attempt.at,
    }
  );
}

/** Shape of a single point on the training-load timeline. */
export interface LoadPoint {
  date: Date;
  volumeKg: number;
  setCount: number;
}

/** Builds a chronological training-load timeline from completed sessions. */
export function buildVolumeTimeline(sessions: CompletedSession[]): LoadPoint[] {
  return [...sessions]
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
    .map((session) => ({
      date: session.completedAt,
      volumeKg: session.totalVolumeKg,
      setCount: session.setCount,
    }));
}

/** Sums training volume over a window of completed sessions (e.g. last 7 days). */
export function sumVolumeInWindow(
  sessions: CompletedSession[],
  from: Date,
  to: Date,
): number {
  return sessions
    .filter(
      (session) => session.completedAt >= from && session.completedAt <= to,
    )
    .reduce((sum, session) => sum + session.totalVolumeKg, 0);
}
