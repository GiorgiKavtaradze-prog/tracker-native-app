/**
 * Domain business rules / invariants.
 *
 * These are pure predicates that keep the domain internally consistent. They
 * return a {@link Result} so violation flows through the typed error channel
 * instead of silent `false` values. The application use-cases call these before
 * mutating state.
 */
import { BusinessRuleViolation, ValidationError } from "./domain-error";
import { ok, type Result } from "./result";
import type { SetLog, WorkoutTarget } from "./entities";

export const MAX_REPS_PER_SET = 100;
export const MAX_SETS_PER_EXERCISE = 40;
export const MIN_REST_SECONDS = 0;
export const MAX_REST_SECONDS = 600;
export const MAX_WORKOUT_NAME_LENGTH = 120;

/** Validates a single logged set against physical/business constraints. */
export function validateSetLog(set: SetLog): Result<SetLog, ValidationError> {
  const messages: string[] = [];

  if (!set.exerciseId || set.exerciseId.trim().length === 0) {
    messages.push("exerciseId is required");
  }
  if (!Number.isInteger(set.setNumber) || set.setNumber < 1) {
    messages.push("setNumber must be a positive integer");
  }
  if (
    !Number.isInteger(set.reps) ||
    set.reps < 1 ||
    set.reps > MAX_REPS_PER_SET
  ) {
    messages.push(`reps must be an integer between 1 and ${MAX_REPS_PER_SET}`);
  }
  if (set.weight !== null && (!Number.isFinite(set.weight) || set.weight < 0)) {
    messages.push("weight must be a non-negative number or null");
  }

  if (messages.length > 0) {
    return {
      ok: false,
      error: new ValidationError(`Invalid set log: ${messages.join("; ")}`, {
        set,
      }),
    };
  }
  return ok(set);
}

/** Validates a workout target (prescribed sets/reps/rest). */
export function validateWorkoutTarget(
  target: WorkoutTarget,
): Result<WorkoutTarget, ValidationError> {
  const messages: string[] = [];

  if (!target.exerciseId || target.exerciseId.trim().length === 0) {
    messages.push("exerciseId is required");
  }
  if (
    !Number.isInteger(target.sets) ||
    target.sets < 1 ||
    target.sets > MAX_SETS_PER_EXERCISE
  ) {
    messages.push(
      `sets must be an integer between 1 and ${MAX_SETS_PER_EXERCISE}`,
    );
  }
  if (
    !Number.isInteger(target.reps) ||
    target.reps < 1 ||
    target.reps > MAX_REPS_PER_SET
  ) {
    messages.push(`reps must be an integer between 1 and ${MAX_REPS_PER_SET}`);
  }
  if (
    target.restSeconds < MIN_REST_SECONDS ||
    target.restSeconds > MAX_REST_SECONDS
  ) {
    messages.push(
      `restSeconds must be between ${MIN_REST_SECONDS} and ${MAX_REST_SECONDS}`,
    );
  }

  if (messages.length > 0) {
    return {
      ok: false,
      error: new ValidationError(
        `Invalid workout target: ${messages.join("; ")}`,
      ),
    };
  }
  return ok(target);
}

/** Validates a workout template name. */
export function validateWorkoutName(
  name: string,
): Result<string, ValidationError> {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_WORKOUT_NAME_LENGTH) {
    return {
      ok: false,
      error: new ValidationError(
        `Workout name must be 1-${MAX_WORKOUT_NAME_LENGTH} characters`,
      ),
    };
  }
  return ok(trimmed);
}

/** Verifies a session can be completed (has sets and consistent timestamps). */
export function assertSessionCompletable(params: {
  setCount: number;
  startedAt: Date;
  completedAt: Date;
}): Result<void, BusinessRuleViolation> {
  if (params.setCount <= 0) {
    return {
      ok: false,
      error: new BusinessRuleViolation(
        "Cannot complete a session with no logged sets",
      ),
    };
  }
  if (params.completedAt.getTime() < params.startedAt.getTime()) {
    return {
      ok: false,
      error: new BusinessRuleViolation("completedAt cannot precede startedAt"),
    };
  }
  return ok(undefined);
}
