import {
  asAthleteId,
  asExerciseId,
  asSessionId,
  type ExerciseId,
} from "../../shared/brand";
import { err, isErr, ok, type Result } from "../../shared/result";
import { priorPersonalBests } from "../../domain/analytics";
import type { DomainEvent } from "../../domain/events";
import { TrainingSession } from "../../domain/training-session";
import type {
  ApplicationFailure,
  LoggedSessionView,
  LogTrainingSessionCommand,
  PersonalRecordView,
  SessionExerciseDto,
} from "../dto";
import { toRuleRejection, toSetAttributes } from "../mappers";
import type {
  AthleteRepository,
  DomainEventBus,
  ExerciseDirectory,
  IdentifierFactory,
  TransactionCoordinator,
  TrainingSessionRepository,
} from "../ports";

const HISTORY_LOOKBACK_MS = 1000 * 60 * 60 * 24 * 180;

export interface LogTrainingSessionDependencies {
  readonly athletes: AthleteRepository;
  readonly sessions: TrainingSessionRepository;
  readonly directory: ExerciseDirectory;
  readonly identifiers: IdentifierFactory;
  readonly bus: DomainEventBus;
  readonly transactions: TransactionCoordinator;
}

export class LogTrainingSession {
  constructor(private readonly dependencies: LogTrainingSessionDependencies) {}

  async execute(
    command: LogTrainingSessionCommand,
  ): Promise<Result<LoggedSessionView, ApplicationFailure>> {
    const malformation = this.detectMalformation(command);
    if (malformation) return err(malformation);

    return this.dependencies.transactions.run(
      async (): Promise<Result<LoggedSessionView, ApplicationFailure>> => {
        const athleteId = asAthleteId(command.athleteId);
        const athlete = await this.dependencies.athletes.findById(athleteId);
        if (!athlete)
          return err({ code: "UNKNOWN_ATHLETE", athleteId: command.athleteId });

        const exerciseIds = command.exercises.map((exercise) =>
          asExerciseId(exercise.exerciseId),
        );
        const unknownExercise = await this.locateUnknownExercise(exerciseIds);
        if (unknownExercise) return err(unknownExercise);

        const opened = TrainingSession.open(
          asSessionId(this.dependencies.identifiers.issue()),
          athleteId,
          new Date(command.startedAtIso),
          command.title,
        );
        if (isErr(opened)) return err(toRuleRejection(opened.error));

        const rejection = this.materialize(opened.value, command.exercises);
        if (rejection) return err(rejection);

        const completedAt = new Date(command.completedAtIso);
        const finished = opened.value.finish(completedAt);
        if (isErr(finished)) return err(toRuleRejection(finished.error));

        const history = await this.dependencies.sessions.findByAthleteBetween(
          athleteId,
          new Date(completedAt.getTime() - HISTORY_LOOKBACK_MS),
          completedAt,
        );
        const baselines = priorPersonalBests(
          history.filter((past) => past.id !== opened.value.id),
        );
        const records = this.collectPersonalRecords(
          opened.value,
          exerciseIds,
          baselines,
        );
        const recordEvents = this.toRecordEvents(athleteId, records);

        await this.dependencies.sessions.save(opened.value);

        const events = [...opened.value.pullDomainEvents(), ...recordEvents];
        if (events.length > 0) await this.dependencies.bus.dispatch(events);

        return ok(this.toView(opened.value, records));
      },
    );
  }

  private collectPersonalRecords(
    session: TrainingSession,
    exerciseIds: readonly ExerciseId[],
    baselines: ReadonlyMap<ExerciseId, number>,
  ): readonly PersonalRecordView[] {
    const records: PersonalRecordView[] = [];
    for (const exerciseId of exerciseIds) {
      const achieved = session.bestEstimatedOneRepMaxKg(exerciseId);
      const previous = baselines.get(exerciseId);
      if (achieved !== null && previous !== undefined && achieved > previous) {
        records.push({
          exerciseId,
          previousBestKg: previous,
          achievedBestKg: achieved,
        });
      }
    }
    return records;
  }

  private toRecordEvents(
    athleteId: ReturnType<typeof asAthleteId>,
    records: readonly PersonalRecordView[],
  ): readonly DomainEvent[] {
    return records.map((record) => ({
      kind: "PersonalRecordSurpassed" as const,
      athleteId,
      exerciseId: asExerciseId(record.exerciseId),
      previousBestKg: record.previousBestKg,
      newBestKg: record.achievedBestKg,
    }));
  }

  private detectMalformation(
    command: LogTrainingSessionCommand,
  ): ApplicationFailure | null {
    if (command.athleteId.trim().length === 0) {
      return { code: "MALFORMED_INPUT", reason: "athleteId is required" };
    }
    if (Number.isNaN(Date.parse(command.startedAtIso))) {
      return {
        code: "MALFORMED_INPUT",
        reason: "startedAtIso must be an ISO-8601 timestamp",
      };
    }
    if (Number.isNaN(Date.parse(command.completedAtIso))) {
      return {
        code: "MALFORMED_INPUT",
        reason: "completedAtIso must be an ISO-8601 timestamp",
      };
    }
    if (command.exercises.length === 0) {
      return {
        code: "MALFORMED_INPUT",
        reason: "at least one exercise is required",
      };
    }
    if (
      command.exercises.some(
        (exercise) =>
          exercise.exerciseId.trim().length === 0 || exercise.sets.length === 0,
      )
    ) {
      return {
        code: "MALFORMED_INPUT",
        reason: "every exercise requires an identifier plus at least one set",
      };
    }
    return null;
  }

  private async locateUnknownExercise(
    exerciseIds: readonly ExerciseId[],
  ): Promise<ApplicationFailure | null> {
    for (const exerciseId of exerciseIds) {
      const blueprint = await this.dependencies.directory.resolve(exerciseId);
      if (!blueprint) return { code: "UNKNOWN_EXERCISE", exerciseId };
    }
    return null;
  }

  private materialize(
    session: TrainingSession,
    exercises: readonly SessionExerciseDto[],
  ): ApplicationFailure | null {
    for (const exercise of exercises) {
      const exerciseId = asExerciseId(exercise.exerciseId);
      const attached = session.attachExercise(exerciseId);
      if (isErr(attached)) return toRuleRejection(attached.error);
      for (const set of exercise.sets) {
        const recorded = session.recordSet(exerciseId, toSetAttributes(set));
        if (isErr(recorded)) return toRuleRejection(recorded.error);
      }
    }
    return null;
  }

  private toView(
    session: TrainingSession,
    records: readonly PersonalRecordView[],
  ): LoggedSessionView {
    return {
      sessionId: session.id,
      athleteId: session.athleteId,
      title: session.title,
      status: session.status,
      totalVolumeKg: session.totalVolumeKg,
      setCount: session.setCount,
      averageRpe: session.averageRpe,
      durationMinutes: session.durationMinutes,
      personalRecords: records,
    };
  }
}
