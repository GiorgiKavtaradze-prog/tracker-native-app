/**
 * Workout-management use case: create and list workout templates. It verifies
 * that every prescribed exercise exists before persistence and validates domain
 * invariants, so a malformed/unknown workout never reaches the database.
 */
import { NotFoundError, ValidationError } from "@/core/domain-error";
import {
  ok,
  tryAsync,
  validateWorkoutName,
  type Result,
  type WorkoutTemplate,
} from "@/core";
import { upsertWorkoutSchema } from "@/application/dto";
import { formatZodError } from "@/application/use-cases/helpers";
import type { AppPorts } from "@/application/ports";

export class WorkoutManagementService {
  constructor(private readonly deps: AppPorts) {}

  /**
   * Creates a workout template after verifying that every prescribed exercise
   * exists in the catalog. Returns a typed `Result`.
   */
  async create(
    userId: string,
    input: unknown,
  ): Promise<Result<WorkoutTemplate>> {
    const parsed = upsertWorkoutSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: new ValidationError(formatZodError(parsed.error)),
      };
    }

    const nameCheck = validateWorkoutName(parsed.data.name);
    if (!nameCheck.ok) {
      return { ok: false, error: nameCheck.error };
    }

    const exerciseCheck = await this.assertAllExercisesExist(
      parsed.data.exercises.map((exercise) => exercise.exerciseId),
    );
    if (!exerciseCheck.ok) {
      return { ok: false, error: exerciseCheck.error };
    }

    return tryAsync(async (): Promise<WorkoutTemplate> => {
      const created = await this.deps.workouts.create({
        userId,
        name: nameCheck.value,
        description: parsed.data.description,
        image: parsed.data.image || undefined,
        isTemplate: parsed.data.isTemplate,
        exercises: parsed.data.exercises.map((exercise, position) => ({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          targetWeight: exercise.targetWeight ?? null,
          restSeconds: exercise.restSeconds,
          position: exercise.position ?? position,
        })),
      });
      this.deps.logger.info("workout.created", {
        userId,
        workoutId: created.id,
      });
      return created;
    });
  }

  /** Lists all workouts for a user, newest first. */
  async listForUser(userId: string): Promise<Result<WorkoutTemplate[]>> {
    return tryAsync(() => this.deps.workouts.listByUser(userId));
  }

  /** Deletes a workout owned by the given user. */
  async removeById(userId: string, workoutId: string): Promise<Result<void>> {
    return tryAsync(async () => {
      const deleted = await this.deps.workouts.delete(workoutId, userId);
      if (!deleted) throw new NotFoundError("Workout not found");
    });
  }

  private async assertAllExercisesExist(ids: string[]): Promise<Result<void>> {
    for (const id of [...new Set(ids)]) {
      const exercise = await this.deps.exercises.findById(id);
      if (!exercise) {
        return {
          ok: false,
          error: new NotFoundError(`Exercise "${id}" does not exist`),
        };
      }
    }
    return ok(undefined);
  }
}
