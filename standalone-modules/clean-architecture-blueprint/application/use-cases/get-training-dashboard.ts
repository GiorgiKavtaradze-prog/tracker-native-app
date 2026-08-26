import { asAthleteId } from "../../shared/brand";
import { err, ok, type Result } from "../../shared/result";
import {
  activeDayStreak,
  loadTrajectory,
  MILLISECONDS_PER_DAY,
  personalBests,
  weeklyVolumeTimeline,
} from "../../domain/analytics";
import type { MuscleGroup } from "../../domain/exercise-catalog";
import type { TrainingSession } from "../../domain/training-session";
import type {
  ApplicationFailure,
  DashboardQuery,
  DashboardView,
  RecentSessionView,
  WeeklyVolumeView,
} from "../dto";
import type {
  AthleteRepository,
  Clock,
  ExerciseDirectory,
  TrainingSessionRepository,
} from "../ports";

export interface GetTrainingDashboardDependencies {
  readonly athletes: AthleteRepository;
  readonly sessions: TrainingSessionRepository;
  readonly directory: ExerciseDirectory;
  readonly clock: Clock;
}

const HORIZON_FLOOR_DAYS = 7;
const HORIZON_CEILING_DAYS = 365;
const RECENT_SESSION_LIMIT = 5;
const TREND_SAMPLE_SIZE = 6;
const HIGHLIGHT_LIMIT = 3;

export class GetTrainingDashboard {
  constructor(
    private readonly dependencies: GetTrainingDashboardDependencies,
  ) {}

  async execute(
    query: DashboardQuery,
  ): Promise<Result<DashboardView, ApplicationFailure>> {
    if (
      query.horizonDays < HORIZON_FLOOR_DAYS ||
      query.horizonDays > HORIZON_CEILING_DAYS
    ) {
      return err({
        code: "MALFORMED_INPUT",
        reason: `horizonDays must span ${HORIZON_FLOOR_DAYS}-${HORIZON_CEILING_DAYS}`,
      });
    }

    const athleteId = asAthleteId(query.athleteId);
    const athlete = await this.dependencies.athletes.findById(athleteId);
    if (!athlete)
      return err({ code: "UNKNOWN_ATHLETE", athleteId: query.athleteId });

    const reference = this.dependencies.clock.now();
    const windowStart = new Date(
      reference.getTime() - query.horizonDays * MILLISECONDS_PER_DAY,
    );
    const sessions = await this.dependencies.sessions.findByAthleteBetween(
      athleteId,
      windowStart,
      reference,
    );
    const blueprints = await this.dependencies.directory.catalogue();

    const timeline = weeklyVolumeTimeline(
      sessions,
      new Map(blueprints.map((blueprint) => [blueprint.id, blueprint])),
      Math.max(1, Math.ceil(query.horizonDays / 7)),
    );

    const chronological = [...sessions]
      .filter((session) => session.isCompleted)
      .sort(
        (left, right) =>
          (left.completedAt?.getTime() ?? 0) -
          (right.completedAt?.getTime() ?? 0),
      );

    return ok({
      athleteId: athlete.id,
      displayName: athlete.displayName,
      experience: athlete.experience,
      streakDays: activeDayStreak(sessions, reference),
      loadTrend:
        loadTrajectory(
          chronological
            .slice(-TREND_SAMPLE_SIZE)
            .map((session) => session.averageRpe),
        )?.label ?? null,
      weeklyVolumes: this.toWeeklyVolumes(timeline),
      personalBests: personalBests(sessions),
      recentSessions: this.toRecentSessions(chronological),
    });
  }

  private toWeeklyVolumes(
    timeline: ReturnType<typeof weeklyVolumeTimeline>,
  ): readonly WeeklyVolumeView[] {
    return timeline.map((point) => ({
      weekStartedOnIso: point.weekStartedOnIso,
      totalKg: point.totalKg,
      highlights: Object.entries(point.volumeByMuscle)
        .map(([muscle, volumeKg]) => ({
          muscle: muscle as MuscleGroup,
          volumeKg: volumeKg ?? 0,
        }))
        .filter((entry) => entry.volumeKg > 0)
        .sort((left, right) => right.volumeKg - left.volumeKg)
        .slice(0, HIGHLIGHT_LIMIT),
    }));
  }

  private toRecentSessions(
    chronological: readonly TrainingSession[],
  ): readonly RecentSessionView[] {
    return chronological
      .slice(-RECENT_SESSION_LIMIT)
      .reverse()
      .map((session) => ({
        sessionId: session.id,
        title: session.title,
        completedOnIso: (
          session.completedAt ?? session.startedAt
        ).toISOString(),
        totalVolumeKg: session.totalVolumeKg,
        averageRpe: session.averageRpe,
      }));
  }
}
