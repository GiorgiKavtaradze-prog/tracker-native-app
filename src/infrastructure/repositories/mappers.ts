/**
 * Persistence ↔ domain mappers. Every conversion between a raw Drizzle row and a
 * pure domain entity lives here, keeping SQL types out of the application layer.
 *
 * The application layer works exclusively with the domain models from `@/core`;
 * the repositories below translate on write (domain → row) and on read (row →
 * domain).
 */
import type {
  Profile,
  ExerciseTemplate,
  WorkoutTemplate,
  WorkoutTarget,
  SetLog,
  WorkoutSession,
  CompletedSession,
} from "@/core";
import type {
  Profile as ProfileRow,
  Exercise as ExerciseRow,
  Workout as WorkoutRow,
  WorkoutExercise as WorkoutExerciseRow,
  WorkoutSession as SessionRow,
  WorkoutSessionSet as SessionSetRow,
} from "@/db";

/** Maps a `profiles` row into the domain model. */
export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    gender: row.gender,
    goal: row.goal,
    experience: row.experience,
    weightUnit: row.weightUnit,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Maps an `exercises` catalog row into the domain model. */
export function toExercise(row: ExerciseRow): ExerciseTemplate {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: row.image,
    description: row.description,
    muscles: row.muscles,
    equipment: row.equipment,
    difficulty: row.difficulty,
    forceType: row.forceType,
    mechanics: row.mechanics,
    category: row.category,
  };
}

/** Maps a dense `workout_exercises` row into the prescribed-target domain shape. */
export function toWorkoutTarget(row: WorkoutExerciseRow): WorkoutTarget {
  return {
    exerciseId: row.exerciseId,
    sets: row.sets,
    reps: row.reps,
    targetWeight: row.targetWeight,
    restSeconds: row.restSeconds,
    position: row.position,
  };
}

/** Maps a `workouts` row plus its targets into the domain aggregate. */
export function toWorkout(
  row: WorkoutRow,
  targets: WorkoutTarget[],
): WorkoutTemplate {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    image: row.image,
    isTemplate: row.isTemplate,
    exercises: targets,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Maps a `workout_session_sets` row into the domain set-log shape. */
export function toSetLog(row: SessionSetRow): SetLog {
  return {
    exerciseId: row.exerciseId,
    setNumber: row.setNumber,
    reps: row.reps,
    weight: row.weight,
  };
}

/** Maps a `workout_sessions` row into a session with its logged sets. */
export function toSession(row: SessionRow, sets: SetLog[]): WorkoutSession {
  return {
    id: row.id,
    userId: row.userId,
    workoutId: row.workoutId,
    status: "in-progress",
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    durationSeconds: row.durationSeconds,
    sets,
  };
}

/** Maps a row pair (session + workout + sets) into the completed-session read model. */
export function toCompletedSession(
  row: SessionRow,
  workout: { name: string; image: string | null } | null,
  sets: SetLog[],
): CompletedSession {
  return {
    id: row.id,
    workoutId: row.workoutId,
    workoutName: workout?.name ?? "Workout",
    image: workout?.image ?? null,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? row.startedAt,
    durationSeconds: row.durationSeconds,
    exerciseCount: new Set(sets.map((set) => set.exerciseId)).size,
    setCount: sets.length,
    totalVolumeKg: sets.reduce(
      (sum, set) => sum + (set.weight ?? 0) * set.reps,
      0,
    ),
    sets,
  };
}
