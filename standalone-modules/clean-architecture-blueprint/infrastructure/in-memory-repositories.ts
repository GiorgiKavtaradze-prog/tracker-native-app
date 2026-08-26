import type { AthleteId, ExerciseId, SessionId } from "../shared/brand";
import type {
  AthleteRepository,
  ExerciseDirectory,
  TrainingSessionRepository,
} from "../application/ports";
import { Athlete, type AthleteSnapshot } from "../domain/athlete";
import type { ExerciseBlueprint } from "../domain/exercise-catalog";
import {
  TrainingSession,
  type SessionSnapshot,
} from "../domain/training-session";

export class InMemoryAthleteRepository implements AthleteRepository {
  private readonly storage = new Map<AthleteId, AthleteSnapshot>();

  async save(athlete: Athlete): Promise<void> {
    this.storage.set(athlete.id, athlete.snapshot());
  }

  async findById(id: AthleteId): Promise<Athlete | null> {
    const snapshot = this.storage.get(id);
    return snapshot ? Athlete.revive(snapshot) : null;
  }
}

export class InMemoryTrainingSessionRepository implements TrainingSessionRepository {
  private readonly storage = new Map<SessionId, SessionSnapshot>();

  async save(session: TrainingSession): Promise<void> {
    this.storage.set(session.id, session.snapshot());
  }

  async findById(id: SessionId): Promise<TrainingSession | null> {
    const snapshot = this.storage.get(id);
    return snapshot ? TrainingSession.revive(snapshot) : null;
  }

  async findByAthleteBetween(
    athleteId: AthleteId,
    from: Date,
    until: Date,
  ): Promise<readonly TrainingSession[]> {
    return [...this.storage.values()]
      .map((snapshot) => TrainingSession.revive(snapshot))
      .filter((session) => session.athleteId === athleteId)
      .filter((session) => {
        const stamp = (session.completedAt ?? session.startedAt).getTime();
        return stamp >= from.getTime() && stamp <= until.getTime();
      })
      .sort(
        (left, right) => left.startedAt.getTime() - right.startedAt.getTime(),
      );
  }
}

export class StaticExerciseDirectory implements ExerciseDirectory {
  private readonly index: ReadonlyMap<ExerciseId, ExerciseBlueprint>;

  constructor(blueprints: readonly ExerciseBlueprint[]) {
    this.index = new Map(
      blueprints.map((blueprint) => [blueprint.id, blueprint]),
    );
  }

  async resolve(id: ExerciseId): Promise<ExerciseBlueprint | null> {
    return this.index.get(id) ?? null;
  }

  async catalogue(): Promise<readonly ExerciseBlueprint[]> {
    return [...this.index.values()];
  }
}
