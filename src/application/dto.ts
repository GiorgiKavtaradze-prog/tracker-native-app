/**
 * Application DTOs — Zod contracts that form the validation boundary between the
 * transport (API handlers / forms) and the use-cases. Every public use-case
 * method parses its raw input through one of these schemas before doing work, so
 * malformed payloads are rejected early and deterministically.
 *
 * The schemas borrow enums from the pure core layer so literals never drift.
 */
import { z } from "zod";
import {
  EXPERIENCE_LEVELS,
  FITNESS_GOALS,
  GENDERS,
  WEIGHT_UNITS,
} from "@/core";

/** A single logged set supplied by a client. */
export const setLogSchema = z.object({
  exerciseId: z.string().min(1),
  setNumber: z.number().int().positive(),
  reps: z.number().int().min(1).max(100),
  weight: z.number().nonnegative().nullable().optional(),
});
export type SetLogDTO = z.infer<typeof setLogSchema>;

/** Starts a new training session for a given workout template. */
export const startSessionSchema = z.object({
  workoutId: z.string().min(1),
});
export type StartSessionDTO = z.infer<typeof startSessionSchema>;

/** Completes an in-progress session with the full set of logged sets. */
export const completeSessionSchema = z.object({
  workoutId: z.string().min(1),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date(),
  durationSeconds: z.number().int().positive(),
  sets: z.array(setLogSchema).min(1),
});
export type CompleteSessionDTO = z.infer<typeof completeSessionSchema>;

/** Creates (or edits) a workout template with its prescribed exercises. */
export const workoutTargetSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(40),
  reps: z.number().int().min(1).max(100),
  targetWeight: z.number().nonnegative().nullable().optional(),
  restSeconds: z.number().int().min(0).max(600).default(90),
  position: z.number().int().min(0).default(0),
});
export type WorkoutTargetDTO = z.infer<typeof workoutTargetSchema>;

export const upsertWorkoutSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  image: z.string().url().or(z.literal("")).optional(),
  isTemplate: z.boolean().default(false),
  exercises: z.array(workoutTargetSchema).min(1),
});
export type UpsertWorkoutDTO = z.infer<typeof upsertWorkoutSchema>;

/** Payload for creating/updating a user's fitness profile. */
export const upsertProfileSchema = z.object({
  gender: z.enum(GENDERS),
  goal: z.enum(FITNESS_GOALS),
  experience: z.enum(EXPERIENCE_LEVELS),
  weightUnit: z.enum(WEIGHT_UNITS).default("kg"),
});
export type UpsertProfileDTO = z.infer<typeof upsertProfileSchema>;

/** Window params for analytics queries. */
export const analyticsWindowSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine(({ from, to }) => from <= to, {
    message: "from must not be after to",
  });
export type AnalyticsWindowDTO = z.infer<typeof analyticsWindowSchema>;
