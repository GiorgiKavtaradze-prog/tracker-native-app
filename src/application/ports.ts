/**
 * Application ports (interfaces) — the seams of the clean-architecture layer.
 *
 * The application layer depends only on these contracts, never on a concrete
 * database, cache, or AI provider. Concrete implementations live in
 * `src/infrastructure` and are injected via the composition root
 * (`src/infrastructure/composition-root.ts`). This is dependency inversion: high
 * policy depends on abstractions, low-level details depend on them too.
 */
import type {
  CompletedSession,
  ExerciseTemplate,
  PersonalBest,
  Profile,
  SetLog,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutTarget,
} from "@/core";
import type { ProfileInput } from "@/core";

/** Returns `null` when the entity is not found. */
export interface WorkoutRepository {
  findById(id: string): Promise<WorkoutTemplate | null>;
  listByUser(userId: string): Promise<WorkoutTemplate[]>;
  create(input: {
    userId: string;
    name: string;
    description?: string;
    image?: string;
    isTemplate?: boolean;
    exercises: WorkoutTarget[];
  }): Promise<WorkoutTemplate>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface SessionRepository {
  /**
   * Persists a completed session (with its sets) in a single write. The current
   * schema has no "in-progress" row type — a session is written to storage only
   * once completed (live state lives in the client), so this is the write path.
   */
  saveCompleted(input: {
    userId: string;
    workoutId: string;
    startedAt: Date;
    completedAt: Date;
    durationSeconds: number;
    sets: SetLog[];
  }): Promise<WorkoutSession>;
  listHistory(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<CompletedSession[]>;
  loadSetsForSession(sessionId: string): Promise<SetLog[]>;
}

export interface ExerciseRepository {
  findById(id: string): Promise<ExerciseTemplate | null>;
  search(query?: string): Promise<ExerciseTemplate[]>;
}

export interface ProfileRepository {
  getByUserId(userId: string): Promise<Profile | null>;
  upsert(userId: string, input: ProfileInput): Promise<Profile>;
}

/** Access to completed sessions for analytics (thin read-model over history). */
export interface ProgressReadModel {
  listCompletedSessions(userId: string): Promise<CompletedSession[]>;
}

/** Clock abstraction — injectable now() so tests can freeze time. */
export interface Clock {
  now(): Date;
}

/** Unique-id generator — lets tests deterministically seed ids. */
export interface IdGenerator {
  generate(prefix?: string): string;
}

/** Minimal structured logger (no-op-safe). */
export interface Logger {
  info(event: string, context?: Record<string, unknown>): void;
  warn(event: string, context?: Record<string, unknown>): void;
  error(event: string, context?: Record<string, unknown>): void;
}

/** Result of an AI coaching request (kept here so infra stays decoupled). */
export interface CoachingReply {
  content: string;
}

/** AI-provider port used by the coaching use-case. */
export interface AICoachProvider {
  /** Runs a coaching prompt and returns a textual reply. */
  ask(prompt: { system: string; user: string }): Promise<CoachingReply>;
}

/** The full dependency graph every use-case needs (wired in the composition root). */
export interface AppPorts {
  workouts: WorkoutRepository;
  sessions: SessionRepository;
  exercises: ExerciseRepository;
  profiles: ProfileRepository;
  progress: ProgressReadModel;
  clock: Clock;
  ids: IdGenerator;
  logger: Logger;
  ai: AICoachProvider;
}
