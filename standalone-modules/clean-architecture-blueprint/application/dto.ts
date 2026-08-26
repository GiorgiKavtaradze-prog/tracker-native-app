import type { ExperienceLevel } from "../domain/athlete";
import type { MuscleGroup } from "../domain/exercise-catalog";
import type { SessionStatus } from "../domain/training-session";

export interface RegisterAthleteCommand {
  readonly displayName: string;
  readonly experience: ExperienceLevel;
  readonly bodyweightKg: number;
}

export interface AthleteView {
  readonly athleteId: string;
  readonly displayName: string;
  readonly experience: ExperienceLevel;
  readonly currentBodyweightKg: number | null;
}

export interface SessionSetDto {
  readonly reps: number;
  readonly weightKg: number;
  readonly rpe: number;
}

export interface SessionExerciseDto {
  readonly exerciseId: string;
  readonly sets: readonly SessionSetDto[];
}

export interface LogTrainingSessionCommand {
  readonly athleteId: string;
  readonly title?: string;
  readonly startedAtIso: string;
  readonly completedAtIso: string;
  readonly exercises: readonly SessionExerciseDto[];
}

export interface PersonalRecordView {
  readonly exerciseId: string;
  readonly previousBestKg: number;
  readonly achievedBestKg: number;
}

export interface LoggedSessionView {
  readonly sessionId: string;
  readonly athleteId: string;
  readonly title: string | null;
  readonly status: SessionStatus;
  readonly totalVolumeKg: number;
  readonly setCount: number;
  readonly averageRpe: number | null;
  readonly durationMinutes: number | null;
  readonly personalRecords: readonly PersonalRecordView[];
}

export interface DashboardQuery {
  readonly athleteId: string;
  readonly horizonDays: number;
}

export interface VolumeHighlightView {
  readonly muscle: MuscleGroup;
  readonly volumeKg: number;
}

export interface WeeklyVolumeView {
  readonly weekStartedOnIso: string;
  readonly totalKg: number;
  readonly highlights: readonly VolumeHighlightView[];
}

export interface RecentSessionView {
  readonly sessionId: string;
  readonly title: string | null;
  readonly completedOnIso: string;
  readonly totalVolumeKg: number;
  readonly averageRpe: number | null;
}

export interface PersonalBestView {
  readonly exerciseId: string;
  readonly bestEstimatedOneRepMaxKg: number;
}

export interface DashboardView {
  readonly athleteId: string;
  readonly displayName: string;
  readonly experience: ExperienceLevel;
  readonly streakDays: number;
  readonly loadTrend: "deloading" | "steady" | "escalating" | null;
  readonly weeklyVolumes: readonly WeeklyVolumeView[];
  readonly personalBests: readonly PersonalBestView[];
  readonly recentSessions: readonly RecentSessionView[];
}

export type ApplicationFailure =
  | { readonly code: "MALFORMED_INPUT"; readonly reason: string }
  | { readonly code: "UNKNOWN_ATHLETE"; readonly athleteId: string }
  | { readonly code: "UNKNOWN_EXERCISE"; readonly exerciseId: string }
  | { readonly code: "RULE_REJECTED"; readonly reason: string };
