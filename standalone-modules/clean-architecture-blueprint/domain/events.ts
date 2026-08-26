import type { AthleteId, ExerciseId, SessionId } from "../shared/brand";

export interface AthleteRegistered {
  readonly kind: "AthleteRegistered";
  readonly athleteId: AthleteId;
  readonly displayName: string;
  readonly occurredAt: Date;
}

export interface BodyweightRecorded {
  readonly kind: "BodyweightRecorded";
  readonly athleteId: AthleteId;
  readonly weightKg: number;
  readonly recordedAt: Date;
}

export interface TrainingSessionCompleted {
  readonly kind: "TrainingSessionCompleted";
  readonly sessionId: SessionId;
  readonly athleteId: AthleteId;
  readonly totalVolumeKg: number;
  readonly completedAt: Date;
}

export interface PersonalRecordSurpassed {
  readonly kind: "PersonalRecordSurpassed";
  readonly athleteId: AthleteId;
  readonly exerciseId: ExerciseId;
  readonly previousBestKg: number;
  readonly newBestKg: number;
}

export interface DomainEventMap {
  readonly AthleteRegistered: AthleteRegistered;
  readonly BodyweightRecorded: BodyweightRecorded;
  readonly TrainingSessionCompleted: TrainingSessionCompleted;
  readonly PersonalRecordSurpassed: PersonalRecordSurpassed;
}

export type DomainEvent = DomainEventMap[keyof DomainEventMap];

export type EventName = keyof DomainEventMap;

export type EventHandler<K extends EventName = EventName> = (
  event: DomainEventMap[K],
) => void | Promise<void>;
