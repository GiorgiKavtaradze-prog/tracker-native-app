import { ValidationError, tryAsync, type Result } from "@/core";
import { mapErr } from "@/core/result";
import { AppError, toAppError } from "@/core/domain-error";
import {
  assembleReport,
  assessRisk,
  buildDailyLoads,
  computeEwmaRatio,
  computeFreshness,
  computeStrain,
  computeTrend,
  countWeeklySessions,
} from "../../domain";
import {
  createDefaultTriggers,
  orderSignals,
  type DeloadTrigger,
} from "../../domain/rules";
import {
  resolveProfile,
  type ScoringProfile,
  type ScoringProfileName,
} from "../../domain/profiles";
import type {
  LoadEstimator,
  ReadinessReport,
  TriggerSignal,
} from "../../domain/models";
import { readinessQuerySchema, type ReadinessQueryDTO } from "../dto";
import type { ReadinessPorts } from "../ports";

export interface ReadinessOptions {
  readonly estimator?: LoadEstimator;
  readonly profile?: ScoringProfileName | ScoringProfile;
  readonly triggers?: readonly DeloadTrigger[];
}

export type ReadinessReportPayload = {
  [
    K in keyof Omit<ReadinessReport, "generatedAt" | "dailyLoads">
  ]: ReadinessReport[K];
} & {
  generatedAt: string;
  dailyLoads: { date: string; load: number; sessionCount: number }[];
};

export function toReadinessPayload(
  report: ReadinessReport,
): ReadinessReportPayload {
  return {
    ...report,
    generatedAt: report.generatedAt.toISOString(),
    dailyLoads: report.dailyLoads.map((point) => ({ ...point })),
  };
}

export class ReadinessService {
  private readonly defaultProfile: ScoringProfile;
  private readonly customTriggers: readonly DeloadTrigger[] | undefined;
  private readonly estimator: LoadEstimator | undefined;
  private readonly triggerCache = new Map<string, readonly DeloadTrigger[]>();

  constructor(
    private readonly deps: ReadinessPorts,
    options: ReadinessOptions = {},
  ) {
    this.defaultProfile = resolveProfile(options.profile);
    this.customTriggers = options.triggers;
    this.estimator = options.estimator;
  }

  async evaluate(
    userId: string,
    input: ReadinessQueryDTO,
  ): Promise<Result<ReadinessReport, AppError>> {
    const result = await tryAsync(async (): Promise<ReadinessReport> => {
      const profile = resolveProfile(input.profile ?? this.defaultProfile);
      const triggers = this.getTriggersFor(profile);
      const now = this.deps.clock.now();

      const sessions = await this.deps.progress.listCompletedSessions(userId);

      const dailyLoads = buildDailyLoads(
        sessions,
        input.windowDays,
        now,
        this.estimator,
      );

      const week = computeStrain(dailyLoads);
      const ewma = computeEwmaRatio(
        dailyLoads,
        input.acuteDays,
        input.chronicDays,
        { elevated: profile.ewmaElevated, danger: profile.ewmaDanger },
      );
      const freshness = computeFreshness(
        dailyLoads,
        input.acuteDays,
        input.chronicDays,
      );
      const trend = computeTrend(dailyLoads);

      const weeklyCounts = countWeeklySessions(sessions, 4, now);
      const signals = orderSignals(
        triggers
          .map((trigger) =>
            trigger.evaluate({
              week,
              ewma,
              freshness,
              sessionsThisWeek: weeklyCounts[0] ?? 0,
              priorWeeklySessions: weeklyCounts.slice(1),
            }),
          )
          .filter((signal): signal is TriggerSignal => signal !== null),
      );
      const risk = assessRisk(signals, freshness.score);

      this.deps.logger.info("readiness.evaluated", {
        userId,
        windowDays: input.windowDays,
        profile: profile.name,
        signalCount: signals.length,
        readinessScore: freshness.score,
        ewmaZone: ewma.zone,
        trend: trend.direction,
        riskIndex: risk.index,
      });

      return assembleReport({
        generatedAt: now,
        windowDays: input.windowDays,
        dailyLoads,
        week,
        ewma,
        freshness,
        signals,
        trend,
        risk,
      });
    });
    return mapErr(result, toAppError);
  }

  async evaluateFromRawInput(
    userId: string,
    raw: unknown,
  ): Promise<Result<ReadinessReport, AppError>> {
    const parsed = this.parseQuery(raw);
    if (!parsed.ok) return parsed;
    return this.evaluate(userId, parsed.value);
  }

  private getTriggersFor(profile: ScoringProfile): readonly DeloadTrigger[] {
    if (this.customTriggers) return this.customTriggers;

    const cached = this.triggerCache.get(profile.name);
    if (cached) return cached;

    const built = createDefaultTriggers(profile);
    this.triggerCache.set(profile.name, built);
    return built;
  }

  private parseQuery(raw: unknown): Result<ReadinessQueryDTO, ValidationError> {
    const result = readinessQuerySchema.safeParse(raw);
    if (!result.success) {
      return {
        ok: false,
        error: new ValidationError("Invalid readiness query parameters", {
          issues: result.error.issues,
        }),
      };
    }
    return { ok: true, value: result.data };
  }
}
