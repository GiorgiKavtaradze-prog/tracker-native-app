/**
 * Training-session use case: start, record sets, and complete a workout session.
 *
 * Sessions are persisted only when completed (the schema has no in-progress row —
 * live state lives client-side, e.g. the workout-draft context). `start` returns
 * a client-side draft and `complete` performs the single write with all sets.
 */
import { NotFoundError, ValidationError } from "@/core/domain-error";
import {
  assertSessionCompletable,
  tryAsync,
  validateSetLog,
  type CompletedSession,
  type Result,
  type SetLog,
  type WorkoutSession,
} from "@/core";
import { computeSetCount, computeVolumeKg } from "@/core/metrics";
import {
  completeSessionSchema,
  setLogSchema,
  startSessionSchema,
} from "@/application/dto";
import { formatZodError } from "@/application/use-cases/helpers";
import type { AppPorts } from "@/application/ports";

export class TrainingSessionService {
  constructor(private readonly deps: AppPorts) {}

  /**
   * Opens a training session against a workout the user owns. Returns a client
   * draft (not persisted) — the live-in-progress snapshot used by the UI.
   */
  async open(userId: string, input: unknown): Promise<Result<WorkoutSession>> {
    const parsed = startSessionSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: new ValidationError(formatZodError(parsed.error)),
      };

    const workout = await this.deps.workouts.findById(parsed.data.workoutId);
    if (!workout || workout.userId !== userId) {
      return { ok: false, error: new NotFoundError("Workout not found") };
    }

    return {
      ok: true,
      value: {
        id: this.deps.ids.generate("session"),
        userId,
        workoutId: workout.id,
        status: "in-progress",
        startedAt: this.deps.clock.now(),
        completedAt: null,
        durationSeconds: null,
        sets: [],
      },
    };
  }

  /** Validates and normalises a single set for inclusion in the live draft. */
  async recordSet(rawSet: unknown): Promise<Result<SetLog>> {
    const parsed = setLogSchema.safeParse(rawSet);
    if (!parsed.success)
      return {
        ok: false,
        error: new ValidationError(formatZodError(parsed.error)),
      };

    return validateSetLog({
      exerciseId: parsed.data.exerciseId,
      setNumber: parsed.data.setNumber,
      reps: parsed.data.reps,
      weight: parsed.data.weight ?? null,
    });
  }

  /** Validates & persists a completed session, returning the derived aggregate. */
  async complete(
    userId: string,
    input: unknown,
  ): Promise<Result<CompletedSession>> {
    const parsed = completeSessionSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: new ValidationError(formatZodError(parsed.error)),
      };

    const sets = parsed.data.sets.map((set) => ({
      exerciseId: set.exerciseId,
      setNumber: set.setNumber,
      reps: set.reps,
      weight: set.weight ?? null,
    }));
    for (const set of sets) {
      const checked = validateSetLog(set);
      if (!checked.ok) return { ok: false, error: checked.error };
    }

    const ruleCheck = assertSessionCompletable({
      setCount: sets.length,
      startedAt: parsed.data.startedAt,
      completedAt: parsed.data.completedAt,
    });
    if (!ruleCheck.ok) return { ok: false, error: ruleCheck.error };

    const workout = await this.deps.workouts.findById(parsed.data.workoutId);
    if (!workout || workout.userId !== userId) {
      return {
        ok: false,
        error: new NotFoundError("Session workout not found"),
      };
    }

    return tryAsync(async () => {
      await this.deps.sessions.saveCompleted({
        userId,
        workoutId: workout.id,
        startedAt: parsed.data.startedAt,
        completedAt: parsed.data.completedAt,
        durationSeconds: parsed.data.durationSeconds,
        sets,
      });

      const completed: CompletedSession = {
        id: this.deps.ids.generate("session"),
        workoutId: workout.id,
        workoutName: workout.name,
        image: workout.image,
        startedAt: parsed.data.startedAt,
        completedAt: parsed.data.completedAt,
        durationSeconds: parsed.data.durationSeconds,
        exerciseCount: new Set(sets.map((set) => set.exerciseId)).size,
        setCount: computeSetCount(sets),
        totalVolumeKg: computeVolumeKg(sets),
        sets,
      };
      this.deps.logger.info("session.completed", {
        userId,
        volumeKg: completed.totalVolumeKg,
      });
      return completed;
    });
  }

  /** Reads the completed-session history (read model). */
  async history(userId: string): Promise<Result<CompletedSession[]>> {
    return tryAsync(() => this.deps.progress.listCompletedSessions(userId));
  }
}
