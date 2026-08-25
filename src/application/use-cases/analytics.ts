/**
 * Progress-analytics use case — composes domain metrics with the existing
 * sports-science libraries to produce a rich, read-side training dashboard.
 *
 * This showcases the "clean architecture" seam: pure algorithms (this file) are
 * fed by the `ProgressReadModel` port and the existing `src/lib/*` engines,
 * while staying fully unit-testable and framework-agnostic.
 */
import { ValidationError } from "@/core/domain-error";
import {
  buildVolumeTimeline,
  detectNewPersonalBest,
  tryAsync,
  type LoadPoint,
  type PersonalBest,
  type Result,
} from "@/core";
import { getStreakSummary } from "@/lib/streak";
import { calculateACWR, type ACWRResult } from "@/lib/fitness-analytics";
import { analyticsWindowSchema } from "@/application/dto";
import type { AppPorts } from "@/application/ports";

/** Read-model payload returned to analytics screens. */
export interface DashboardReport {
  totalSessions: number;
  totalVolumeKg: number;
  totalSets: number;
  currentStreak: number;
  bestStreak: number;
  volumeTimeline: LoadPoint[];
  acwr: ACWRResult;
  personalBests: PersonalBest[];
}

export class ProgressAnalyticsService {
  constructor(private readonly deps: AppPorts) {}

  /** Builds the full dashboard from the user's completed-session history. */
  async dashboard(userId: string): Promise<Result<DashboardReport>> {
    return tryAsync(async () => {
      const sessions = await this.deps.progress.listCompletedSessions(userId);

      const streak = getStreakSummary(
        sessions.map((session) => session.completedAt),
      );
      const timeline = buildVolumeTimeline(sessions);

      const acwr = calculateACWR(
        sessions.map((session) => ({
          date: session.completedAt,
          volumeKg: session.totalVolumeKg,
        })),
      );

      const personalBests = this.detectPersonalBests(sessions);

      return {
        totalSessions: sessions.length,
        totalVolumeKg: sessions.reduce(
          (sum, session) => sum + session.totalVolumeKg,
          0,
        ),
        totalSets: sessions.reduce((sum, session) => sum + session.setCount, 0),
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
        volumeTimeline: timeline,
        acwr,
        personalBests,
      };
    });
  }

  /** Scans all history and returns the all-time best for every exercised muscle/lift. */
  async personalBests(userId: string): Promise<Result<PersonalBest[]>> {
    return tryAsync(async () => {
      const sessions = await this.deps.progress.listCompletedSessions(userId);
      return this.detectPersonalBests(sessions);
    });
  }

  /** Loads session history within an explicit (already validated) ISO window. */
  async window(
    userId: string,
    input: unknown,
  ): Promise<Result<DashboardReport>> {
    const parsed = analyticsWindowSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: new ValidationError("Invalid analytics window"),
      };

    const report = await this.dashboard(userId);
    if (!report.ok) return report;

    const filtered = report.value.volumeTimeline.filter(
      (point) => point.date >= parsed.data.from && point.date <= parsed.data.to,
    );
    return { ok: true, value: { ...report.value, volumeTimeline: filtered } };
  }

  private detectPersonalBests(
    sessions: Awaited<
      ReturnType<AppPorts["progress"]["listCompletedSessions"]>
    >,
  ): PersonalBest[] {
    const bests = new Map<string, PersonalBest>();

    for (const session of sessions) {
      for (const set of session.sets) {
        const current = bests.get(set.exerciseId) ?? null;
        const next = detectNewPersonalBest(current, {
          exerciseId: set.exerciseId,
          weightKg: set.weight ?? 0,
          reps: set.reps,
          at: session.completedAt,
        });
        bests.set(set.exerciseId, next);
      }
    }

    return [...bests.values()].sort((a, b) => b.bestWeightKg - a.bestWeightKg);
  }
}
