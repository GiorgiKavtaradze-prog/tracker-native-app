import type { AthleteId, ExerciseId, SessionId } from "../shared/brand";
import { roundToDecimals, sumOf } from "../shared/numbers";
import { err, ok, type Result } from "../shared/result";
import { AggregateRoot } from "./common";
import {
  InvariantViolationError,
  NotFoundError,
  ValidationError,
  type DomainError,
} from "./errors";
import type { TrainingSessionCompleted } from "./events";
import { SetSpec, type SetSpecAttributes } from "./set-spec";

export const SESSION_STATUSES = ["active", "completed", "abandoned"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export interface SessionLineSnapshot {
  readonly exerciseId: ExerciseId;
  readonly sets: readonly SetSpecAttributes[];
}

export interface SessionSnapshot {
  readonly id: SessionId;
  readonly athleteId: AthleteId;
  readonly title: string | null;
  readonly status: SessionStatus;
  readonly startedAtIso: string;
  readonly completedAtIso: string | null;
  readonly note: string | null;
  readonly lines: readonly SessionLineSnapshot[];
}

interface SessionLine {
  readonly exerciseId: ExerciseId;
  readonly sets: SetSpec[];
}

const MAX_ATTACHED_EXERCISES = 12;
const MAX_SETS_PER_EXERCISE = 12;

export class TrainingSession extends AggregateRoot<SessionId> {
  private readonly owner: AthleteId;
  private readonly beganAt: Date;
  private headline: string | null;
  private phase: SessionStatus;
  private endedAt: Date | null;
  private footnote: string | null;
  private readonly lines: SessionLine[];

  private constructor(
    id: SessionId,
    owner: AthleteId,
    beganAt: Date,
    headline: string | null,
    phase: SessionStatus,
    endedAt: Date | null,
    footnote: string | null,
    lines: SessionLine[],
  ) {
    super(id);
    this.owner = owner;
    this.beganAt = beganAt;
    this.headline = headline;
    this.phase = phase;
    this.endedAt = endedAt;
    this.footnote = footnote;
    this.lines = lines;
  }

  static open(
    sessionId: SessionId,
    athleteId: AthleteId,
    startedAt: Date,
    title?: string,
  ): Result<TrainingSession, DomainError> {
    if (Number.isNaN(startedAt.getTime())) {
      return err(new ValidationError("startedAt is not a valid timestamp"));
    }
    const trimmedTitle = title?.trim();
    if (trimmedTitle !== undefined && trimmedTitle.length < 3) {
      return err(
        new ValidationError("title must contain at least 3 characters"),
      );
    }
    return ok(
      new TrainingSession(
        sessionId,
        athleteId,
        startedAt,
        trimmedTitle ?? null,
        "active",
        null,
        null,
        [],
      ),
    );
  }

  static revive(snapshot: SessionSnapshot): TrainingSession {
    const lines = snapshot.lines.map((line) => ({
      exerciseId: line.exerciseId,
      sets: line.sets.map((attributes) => SetSpec.rehydrate(attributes)),
    }));
    return new TrainingSession(
      snapshot.id,
      snapshot.athleteId,
      new Date(snapshot.startedAtIso),
      snapshot.title,
      snapshot.status,
      snapshot.completedAtIso === null
        ? null
        : new Date(snapshot.completedAtIso),
      snapshot.note,
      lines,
    );
  }

  get athleteId(): AthleteId {
    return this.owner;
  }

  get title(): string | null {
    return this.headline;
  }

  get status(): SessionStatus {
    return this.phase;
  }

  get startedAt(): Date {
    return this.beganAt;
  }

  get completedAt(): Date | null {
    return this.endedAt;
  }

  get note(): string | null {
    return this.footnote;
  }

  get isActive(): boolean {
    return this.phase === "active";
  }

  get isCompleted(): boolean {
    return this.phase === "completed";
  }

  get totalVolumeKg(): number {
    return roundToDecimals(
      sumOf(
        this.lines.flatMap((line) => line.sets.map((spec) => spec.volumeKg)),
      ),
      2,
    );
  }

  get setCount(): number {
    return sumOf(this.lines.map((line) => line.sets.length));
  }

  get averageRpe(): number | null {
    const scores = this.lines.flatMap((line) =>
      line.sets.map((spec) => spec.rpe),
    );
    return scores.length === 0
      ? null
      : roundToDecimals(sumOf(scores) / scores.length, 1);
  }

  get durationMinutes(): number | null {
    return this.endedAt === null
      ? null
      : roundToDecimals(
          (this.endedAt.getTime() - this.beganAt.getTime()) / 60_000,
          1,
        );
  }

  attachExercise(exerciseId: ExerciseId): Result<void, DomainError> {
    if (this.phase !== "active") {
      return err(
        new InvariantViolationError(
          "a session can only be mutated while active",
          {
            status: this.phase,
          },
        ),
      );
    }
    if (this.lines.some((line) => line.exerciseId === exerciseId)) {
      return err(
        new InvariantViolationError(
          "the exercise is already attached to this session",
        ),
      );
    }
    if (this.lines.length >= MAX_ATTACHED_EXERCISES) {
      return err(
        new InvariantViolationError(
          `a session supports at most ${MAX_ATTACHED_EXERCISES} exercises`,
        ),
      );
    }
    this.lines.push({ exerciseId, sets: [] });
    return ok(undefined);
  }

  recordSet(
    exerciseId: ExerciseId,
    candidate: SetSpecAttributes,
  ): Result<SetSpec, DomainError> {
    if (this.phase !== "active") {
      return err(
        new InvariantViolationError(
          "a session can only be mutated while active",
          {
            status: this.phase,
          },
        ),
      );
    }
    const line = this.lines.find((entry) => entry.exerciseId === exerciseId);
    if (!line) {
      return err(new NotFoundError("ExerciseLine", exerciseId));
    }
    if (line.sets.length >= MAX_SETS_PER_EXERCISE) {
      return err(
        new InvariantViolationError(
          `an exercise supports at most ${MAX_SETS_PER_EXERCISE} sets per session`,
        ),
      );
    }
    const spec = SetSpec.create(candidate);
    if (!spec.success) {
      return spec;
    }
    line.sets.push(spec.value);
    return ok(spec.value);
  }

  finish(
    completedAt: Date,
    note?: string,
  ): Result<TrainingSessionCompleted, DomainError> {
    if (this.phase !== "active") {
      return err(
        new InvariantViolationError("only an active session can be finished", {
          status: this.phase,
        }),
      );
    }
    if (Number.isNaN(completedAt.getTime())) {
      return err(new ValidationError("completedAt is not a valid timestamp"));
    }
    if (completedAt.getTime() <= this.beganAt.getTime()) {
      return err(
        new ValidationError("completedAt must occur strictly after startedAt"),
      );
    }
    if (this.lines.some((line) => line.sets.length === 0)) {
      return err(
        new InvariantViolationError(
          "every attached exercise requires at least one recorded set",
        ),
      );
    }
    this.phase = "completed";
    this.endedAt = completedAt;
    this.footnote = note?.trim() ? note.trim() : null;
    const completion: TrainingSessionCompleted = {
      kind: "TrainingSessionCompleted",
      sessionId: this.id,
      athleteId: this.owner,
      totalVolumeKg: this.totalVolumeKg,
      completedAt,
    };
    this.raise(completion);
    return ok(completion);
  }

  abandon(): Result<void, DomainError> {
    if (this.phase !== "active") {
      return err(
        new InvariantViolationError("only an active session can be abandoned", {
          status: this.phase,
        }),
      );
    }
    this.phase = "abandoned";
    return ok(undefined);
  }

  exerciseIds(): readonly ExerciseId[] {
    return this.lines.map((line) => line.exerciseId);
  }

  volumeByExercise(): ReadonlyMap<ExerciseId, number> {
    return new Map(
      this.lines.map((line) => [
        line.exerciseId,
        roundToDecimals(sumOf(line.sets.map((spec) => spec.volumeKg)), 2),
      ]),
    );
  }

  bestEstimatedOneRepMaxKg(exerciseId: ExerciseId): number | null {
    const specs =
      this.lines.find((line) => line.exerciseId === exerciseId)?.sets ?? [];
    const estimates = specs.map((spec) => spec.estimatedOneRepMaxKg);
    return estimates.length === 0 ? null : Math.max(...estimates);
  }

  snapshot(): SessionSnapshot {
    return {
      id: this.id,
      athleteId: this.owner,
      title: this.headline,
      status: this.phase,
      startedAtIso: this.beganAt.toISOString(),
      completedAtIso: this.endedAt === null ? null : this.endedAt.toISOString(),
      note: this.footnote,
      lines: this.lines.map((line) => ({
        exerciseId: line.exerciseId,
        sets: line.sets.map((spec) => spec.toAttributes()),
      })),
    };
  }
}
