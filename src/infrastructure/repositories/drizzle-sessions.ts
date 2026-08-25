/**
 * Drizzle-backed `SessionRepository` + `ProgressReadModel` implementations.
 *
 * Handles the lifecycle of training sessions (start / add set / complete) and
 * provides the read-model for analytics from the `workout_sessions` tables.
 */
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db, workouts, workoutSessionSets, workoutSessions } from "@/db";
import type { CompletedSession, SetLog, WorkoutSession } from "@/core";
import type { ProgressReadModel, SessionRepository } from "@/application/ports";
import { toCompletedSession, toSession, toSetLog } from "./mappers";

export class DrizzleSessionRepository implements SessionRepository {
  /** Inserts a completed session plus all of its sets. */
  async saveCompleted(input: {
    userId: string;
    workoutId: string;
    startedAt: Date;
    completedAt: Date;
    durationSeconds: number;
    sets: SetLog[];
  }): Promise<WorkoutSession> {
    const [row] = await db
      .insert(workoutSessions)
      .values({
        userId: input.userId,
        workoutId: input.workoutId,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        durationSeconds: input.durationSeconds,
      })
      .returning();

    if (!row) throw new Error("Failed to save session");

    await db.insert(workoutSessionSets).values(
      input.sets.map((set) => ({
        sessionId: row.id,
        exerciseId: set.exerciseId,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight,
      })),
    );

    return toSession(row, input.sets);
  }

  async loadSetsForSession(sessionId: string): Promise<SetLog[]> {
    const rows = await db
      .select()
      .from(workoutSessionSets)
      .where(eq(workoutSessionSets.sessionId, sessionId))
      .orderBy(workoutSessionSets.setNumber);
    return rows.map(toSetLog);
  }

  async listHistory(
    userId: string,
    offset = 0,
    limit = 50,
  ): Promise<CompletedSession[]> {
    return this.queryCompleted(userId, offset, limit);
  }

  private async queryCompleted(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<CompletedSession[]> {
    const rows = await db
      .select({
        session: workoutSessions,
        workoutName: workouts.name,
        workoutImage: workouts.image,
      })
      .from(workoutSessions)
      .innerJoin(workouts, eq(workouts.id, workoutSessions.workoutId))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNotNull(workoutSessions.completedAt),
        ),
      )
      .orderBy(desc(workoutSessions.completedAt))
      .limit(limit)
      .offset(offset);

    const sets = await this.loadSets(rows.map((row) => row.session.id));
    return rows.map((row) =>
      toCompletedSession(
        row.session,
        { name: row.workoutName, image: row.workoutImage },
        sets.get(row.session.id) ?? [],
      ),
    );
  }

  private async loadSets(sessionIds: string[]): Promise<Map<string, SetLog[]>> {
    if (sessionIds.length === 0) return new Map();
    const rows = await db
      .select()
      .from(workoutSessionSets)
      .where(inArray(workoutSessionSets.sessionId, sessionIds));

    const grouped = new Map<string, SetLog[]>();
    for (const row of rows) {
      const set = toSetLog(row);
      const bucket = grouped.get(row.sessionId);
      if (bucket) bucket.push(set);
      else grouped.set(row.sessionId, [set]);
    }
    return grouped;
  }
}

export class DrizzleProgressReadModel implements ProgressReadModel {
  async listCompletedSessions(userId: string): Promise<CompletedSession[]> {
    return new DrizzleSessionRepository().listHistory(userId, 0, 1000);
  }
}
