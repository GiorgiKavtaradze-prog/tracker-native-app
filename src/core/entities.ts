/**
 * Domain aggregate models — pure, framework-agnostic entities of the workout
 * domain. They contain no SQL, no React, and no external service references, so
 * they can be reasoned about (and tested) in isolation.
 *
 * These are the canonical shapes used throughout the application layer. The
 * infrastructure layer maps raw Drizzle rows into these models via the mappers
 * found in `src/infrastructure/repositories/mappers.ts`.
 */
import type {
  ExperienceLevel,
  FitnessGoal,
  Gender,
  SessionStatus,
  WeightUnit,
} from "./enums";

/** A user's onboarding profile. */
export interface Profile {
  id: string;
  gender: Gender;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  weightUnit: WeightUnit;
  createdAt: Date;
  updatedAt: Date;
}

/** Catalog entry for a single lift/movement (mirrors the `exercises` table). */
export interface ExerciseTemplate {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  description: string;
  muscles: string;
  equipment: string | null;
  difficulty: string;
  forceType: string | null;
  mechanics: string | null;
  category: string;
}

/** Prescribed target for a single exercise inside a workout/circuit. */
export interface WorkoutTarget {
  exerciseId: string;
  sets: number;
  reps: number;
  targetWeight: number | null;
  restSeconds: number;
  position: number;
}

/** A reusable workout template (mirrors the `workouts` + `workout_exercises` tables). */
export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  image: string | null;
  isTemplate: boolean;
  exercises: WorkoutTarget[];
  createdAt: Date;
  updatedAt: Date;
}

/** A single logged set inside a workout session. */
export interface SetLog {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number | null;
}

/** An in-progress / completed training session (mirrors `workout_sessions` + sets). */
export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  sets: SetLog[];
}

/** A finished workout whose derived metrics (volume, set count, …) are pre-computed. */
export interface CompletedSession {
  id: string;
  workoutId: string;
  workoutName: string;
  image: string | null;
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
  sets: SetLog[];
}

/** A historical personal best for an exercise. */
export interface PersonalBest {
  exerciseId: string;
  bestWeightKg: number;
  bestReps: number;
  achievedAt: Date;
}
