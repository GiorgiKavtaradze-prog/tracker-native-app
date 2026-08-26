export {
  asAthleteId,
  asExerciseId,
  asSessionId,
  brand,
  unbrand,
} from "./shared/brand";
export type { AthleteId, Brand, ExerciseId, SessionId } from "./shared/brand";
export { clampToRange, meanOf, roundToDecimals, sumOf } from "./shared/numbers";
export {
  andThen,
  attempt,
  err,
  isErr,
  isOk,
  mapErr,
  mapOk,
  matchResult,
  ok,
  unwrapOr,
} from "./shared/result";
export type { Err, Ok, Result } from "./shared/result";

export { AggregateRoot, Entity, ValueObject } from "./domain/common";
export {
  DomainError,
  InvariantViolationError,
  NotFoundError,
  ValidationError,
} from "./domain/errors";
export type { DomainErrorCode, ErrorContext } from "./domain/errors";
export type {
  AthleteRegistered,
  BodyweightRecorded,
  DomainEvent,
  DomainEventMap,
  EventHandler,
  EventName,
  PersonalRecordSurpassed,
  TrainingSessionCompleted,
} from "./domain/events";
export {
  CATALOG_BLUEPRINTS,
  EXERCISE_MODALITIES,
  isExerciseModality,
  isMuscleGroup,
  MUSCLE_GROUPS,
} from "./domain/exercise-catalog";
export type {
  ExerciseBlueprint,
  ExerciseModality,
  MuscleGroup,
} from "./domain/exercise-catalog";
export { SetSpec } from "./domain/set-spec";
export type { SetSpecAttributes } from "./domain/set-spec";
export {
  Athlete,
  EXPERIENCE_LEVELS,
  isExperienceLevel,
} from "./domain/athlete";
export type {
  AthleteSnapshot,
  BodyweightEntry,
  ExperienceLevel,
} from "./domain/athlete";
export { SESSION_STATUSES, TrainingSession } from "./domain/training-session";
export type {
  SessionLineSnapshot,
  SessionSnapshot,
  SessionStatus,
} from "./domain/training-session";
export {
  activeDayStreak,
  loadTrajectory,
  MILLISECONDS_PER_DAY,
  personalBests,
  priorPersonalBests,
  weeklyVolumeTimeline,
} from "./domain/analytics";
export type {
  LoadTrajectoryVerdict,
  PersonalBestEntry,
  WeeklyVolumePoint,
} from "./domain/analytics";

export type {
  ApplicationFailure,
  AthleteView,
  DashboardQuery,
  DashboardView,
  LoggedSessionView,
  LogTrainingSessionCommand,
  PersonalBestView,
  PersonalRecordView,
  RecentSessionView,
  RegisterAthleteCommand,
  SessionExerciseDto,
  SessionSetDto,
  VolumeHighlightView,
  WeeklyVolumeView,
} from "./application/dto";
export type {
  AthleteRepository,
  Clock,
  DomainEventBus,
  EventSubscription,
  ExerciseDirectory,
  IdentifierFactory,
  TransactionCoordinator,
  TrainingSessionRepository,
} from "./application/ports";
export { GetTrainingDashboard } from "./application/use-cases/get-training-dashboard";
export { LogTrainingSession } from "./application/use-cases/log-training-session";
export { RegisterAthlete } from "./application/use-cases/register-athlete";

export {
  FrozenClock,
  InProcessEventBus,
  PassthroughTransactions,
  SequentialIdentifierFactory,
  SystemClock,
} from "./infrastructure/adapters";
export {
  InMemoryAthleteRepository,
  InMemoryTrainingSessionRepository,
  StaticExerciseDirectory,
} from "./infrastructure/in-memory-repositories";
export { composeContainer } from "./infrastructure/composition-root";
export type {
  ApplicationContainer,
  ContainerOptions,
} from "./infrastructure/composition-root";

export { ApiGateway, buildHttpApi } from "./presentation/http-api";
export type {
  Envelope,
  FailureProblem,
  HttpRequest,
  HttpResponse,
  HttpVerb,
  ResponseStatus,
} from "./presentation/http-api";
export {
  asRecord,
  optionalString,
  recordArray,
  requiredNumber,
  requiredString,
} from "./presentation/decode";
export type { DecodedRecord } from "./presentation/decode";

export { runShowcase } from "./demo";
export type { ShowcaseStep } from "./demo";
