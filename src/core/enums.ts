/**
 * Domain value enums — the single source of truth for closed string sets used
 * across the workout domain. Kept in the pure core layer so both the application
 * and infrastructure layers share the exact same literals.
 *
 * These mirror (but intentionally do not couple to) the Drizzle `pgEnum` values
 * defined in `src/db/schema.ts`. The infrastructure layer is responsible for
 * declaring the DB ↔ domain mapping (see `src/infrastructure/repositories/mappers.ts`).
 */

export const WEIGHT_UNITS = ["kg", "lb"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const FITNESS_GOALS = ["build-muscle", "lose-fat", "maintain"] as const;
export type FitnessGoal = (typeof FITNESS_GOALS)[number];

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const SESSION_STATUSES = [
  "in-progress",
  "completed",
  "abandoned",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const EXERCISE_CATEGORIES = [
  "strength",
  "hypertrophy",
  "conditioning",
  "rehabilitation",
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

/** Human-facing labels for weight units (used for localization-ready rendering). */
export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  kg: "Kilograms",
  lb: "Pounds",
};

/** Persistence payload for a user's fitness profile. */
export interface ProfileInput {
  gender: Gender;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  weightUnit: WeightUnit;
}
