import type {
  Clock,
  DomainEventBus,
  IdentifierFactory,
  TransactionCoordinator,
} from "../application/ports";
import { GetTrainingDashboard } from "../application/use-cases/get-training-dashboard";
import { LogTrainingSession } from "../application/use-cases/log-training-session";
import { RegisterAthlete } from "../application/use-cases/register-athlete";
import {
  CATALOG_BLUEPRINTS,
  type ExerciseBlueprint,
} from "../domain/exercise-catalog";
import {
  InProcessEventBus,
  PassthroughTransactions,
  SequentialIdentifierFactory,
  SystemClock,
} from "./adapters";
import {
  InMemoryAthleteRepository,
  InMemoryTrainingSessionRepository,
  StaticExerciseDirectory,
} from "./in-memory-repositories";

export interface ApplicationContainer {
  readonly registerAthlete: RegisterAthlete;
  readonly logTrainingSession: LogTrainingSession;
  readonly getTrainingDashboard: GetTrainingDashboard;
  readonly athletes: InMemoryAthleteRepository;
  readonly sessions: InMemoryTrainingSessionRepository;
  readonly directory: StaticExerciseDirectory;
}

export interface ContainerOptions {
  readonly clock?: Clock;
  readonly identifiers?: IdentifierFactory;
  readonly bus?: DomainEventBus;
  readonly transactions?: TransactionCoordinator;
  readonly exercises?: readonly ExerciseBlueprint[];
}

export const composeContainer = (
  options: ContainerOptions = {},
): ApplicationContainer => {
  const athletes = new InMemoryAthleteRepository();
  const sessions = new InMemoryTrainingSessionRepository();
  const directory = new StaticExerciseDirectory(
    options.exercises ?? CATALOG_BLUEPRINTS,
  );
  const clock = options.clock ?? new SystemClock();
  const identifiers =
    options.identifiers ?? new SequentialIdentifierFactory("wkt");
  const bus = options.bus ?? new InProcessEventBus();
  const transactions = options.transactions ?? new PassthroughTransactions();

  return {
    registerAthlete: new RegisterAthlete({ athletes, identifiers, clock, bus }),
    logTrainingSession: new LogTrainingSession({
      athletes,
      sessions,
      directory,
      identifiers,
      bus,
      transactions,
    }),
    getTrainingDashboard: new GetTrainingDashboard({
      athletes,
      sessions,
      directory,
      clock,
    }),
    athletes,
    sessions,
    directory,
  };
};
