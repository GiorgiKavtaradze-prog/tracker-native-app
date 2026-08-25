/**
 * Drizzle-backed `WorkoutRepository` implementation.
 *
 * Maps between the raw relational rows and the pure domain model via the mappers
 * in `./mappers.ts`, and keeps the application layer ignorant of SQL.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, workoutExercises, workouts } from "@/db";
import type { WorkoutTemplate, WorkoutTarget } from "@/core";
import type { WorkoutRepository } from "@/application/ports";
import { toWorkout, toWorkoutTarget } from "./mappers";

export class DrizzleWorkoutRepository implements WorkoutRepository {
  async findById(id: string): Promise<WorkoutTemplate | null> {
    const [row] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);
    if (!row) return null;

    const targets = await this.loadTargets([id]);
    return toWorkout(row, targets.get(id) ?? []);
  }

  async listByUser(userId: string): Promise<WorkoutTemplate[]> {
    const rows = await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.createdAt));

    if (rows.length === 0) return [];

    const targets = await this.loadTargets(rows.map((row) => row.id));
    return rows.map((row) => toWorkout(row, targets.get(row.id) ?? []));
  }

  async create(input: {
    userId: string;
    name: string;
    description?: string;
    image?: string;
    isTemplate?: boolean;
    exercises: WorkoutTarget[];
  }): Promise<WorkoutTemplate> {
    const [row] = await db
      .insert(workouts)
      .values({
        userId: input.userId,
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
        isTemplate: input.isTemplate ?? false,
      })
      .returning();

    if (!row) throw new Error("Failed to create workout");

    await db.insert(workoutExercises).values(
      input.exercises.map((target) => ({
        workoutId: row.id,
        exerciseId: target.exerciseId,
        sets: target.sets,
        reps: target.reps,
        targetWeight: target.targetWeight,
        restSeconds: target.restSeconds,
        position: target.position,
      })),
    );

    return toWorkout(row, input.exercises);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .delete(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .returning({ id: workouts.id });
    return deleted.length > 0;
  }

  private async loadTargets(
    workoutIds: string[],
  ): Promise<Map<string, WorkoutTarget[]>> {
    if (workoutIds.length === 0) return new Map();

    const rows = await db
      .select()
      .from(workoutExercises)
      .where(inArray(workoutExercises.workoutId, workoutIds))
      .orderBy(workoutExercises.position);

    const grouped = new Map<string, WorkoutTarget[]>();
    for (const row of rows) {
      const bucket = grouped.get(row.workoutId);
      const target = toWorkoutTarget(row);
      if (bucket) bucket.push(target);
      else grouped.set(row.workoutId, [target]);
    }
    return grouped;
  }
}
