import type { AthleteId, ExerciseId, SessionId } from "../shared/brand";
import type { Athlete } from "../domain/athlete";
import type { ExerciseBlueprint } from "../domain/exercise-catalog";
import type { DomainEvent, EventHandler, EventName } from "../domain/events";
import type { TrainingSession } from "../domain/training-session";

export interface Clock {
  now(): Date;
}

export interface IdentifierFactory {
  issue(): string;
}

export type EventSubscription = () => void;

export interface DomainEventBus {
  dispatch(events: readonly DomainEvent[]): Promise<void>;
  subscribe<K extends EventName>(
    name: K,
    handler: EventHandler<K>,
  ): EventSubscription;
}

export interface AthleteRepository {
  save(athlete: Athlete): Promise<void>;
  findById(id: AthleteId): Promise<Athlete | null>;
}

export interface TrainingSessionRepository {
  save(session: TrainingSession): Promise<void>;
  findById(id: SessionId): Promise<TrainingSession | null>;
  findByAthleteBetween(
    athleteId: AthleteId,
    from: Date,
    until: Date,
  ): Promise<readonly TrainingSession[]>;
}

export interface ExerciseDirectory {
  resolve(id: ExerciseId): Promise<ExerciseBlueprint | null>;
  catalogue(): Promise<readonly ExerciseBlueprint[]>;
}

export interface TransactionCoordinator {
  run<T>(unit: () => Promise<T>): Promise<T>;
}
