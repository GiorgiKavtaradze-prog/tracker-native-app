import { tryAsync, type Result } from "@/core";
import {
  DEFAULT_MILESTONES,
  snapshotToRecord,
  type AchievementUnlock,
  type MetricCalculator,
  type MetricsSnapshot,
  type MilestoneDefinition,
  type MilestoneFilter,
  type MilestoneProgress,
} from "../../domain";
import { computeMetrics } from "../../domain/metrics";
import {
  evaluateMilestones,
  filterFreshUnlocks,
  selectMilestones,
} from "../../domain/rules";
import type { AchievementsPorts } from "../ports";

export interface AchievementsOptions {
  readonly milestones?: readonly MilestoneDefinition[];
  readonly calculators?: Readonly<Record<string, MetricCalculator>>;
}

export interface EvaluationReport {
  readonly metrics: Record<string, number>;
  readonly totalAvailable: number;
  readonly evaluated: number;
  readonly unlockedCount: number;
  readonly newUnlocks: AchievementUnlock[];
  readonly progress: MilestoneProgress[];
}

export class AchievementsService {
  private readonly milestones: readonly MilestoneDefinition[];
  private readonly calculators: Readonly<Record<string, MetricCalculator>>;

  constructor(
    private readonly deps: AchievementsPorts,
    options: AchievementsOptions = {},
  ) {
    this.milestones = options.milestones ?? DEFAULT_MILESTONES;
    this.calculators = options.calculators ?? {};
  }

  async evaluate(
    userId: string,
    filter?: MilestoneFilter,
  ): Promise<Result<EvaluationReport>> {
    return tryAsync(async (): Promise<EvaluationReport> => {
      const sessions = await this.deps.progress.listCompletedSessions(userId);
      const snapshot = computeMetrics({ sessions }, this.calculators);

      const selected = selectMilestones(this.milestones, filter);

      const existing = await this.deps.store.listUnlocked(userId);
      const existingCodes = new Set(existing.map((unlock) => unlock.code));

      const fresh = filterFreshUnlocks(
        selected,
        snapshot,
        existingCodes,
        this.deps.clock.now(),
      );

      const unlockedAtByCode = new Map(
        existing.map((u) => [u.code, u.unlockedAt] as const),
      );
      for (const unlock of fresh)
        unlockedAtByCode.set(unlock.code, unlock.unlockedAt);

      if (fresh.length > 0) {
        await this.deps.store.saveUnlocks(userId, fresh);
      }

      const unlockedCount =
        this.countUnlocked(selected, existingCodes) + fresh.length;

      this.deps.logger.info("achievements.evaluated", {
        userId,
        evaluated: selected.length,
        newUnlocks: fresh.length,
        unlockedCount,
      });

      return {
        metrics: snapshotToRecord(snapshot),
        totalAvailable: this.milestones.length,
        evaluated: selected.length,
        unlockedCount,
        newUnlocks: fresh,
        progress: evaluateMilestones(selected, snapshot, unlockedAtByCode),
      };
    });
  }

  async list(userId: string): Promise<Result<AchievementUnlock[]>> {
    return tryAsync(() => this.deps.store.listUnlocked(userId));
  }

  async progress(
    userId: string,
    filter?: MilestoneFilter,
  ): Promise<Result<MilestoneProgress[]>> {
    return tryAsync(async (): Promise<MilestoneProgress[]> => {
      const sessions = await this.deps.progress.listCompletedSessions(userId);
      const snapshot = computeMetrics({ sessions }, this.calculators);
      const selected = selectMilestones(this.milestones, filter);

      const existing = await this.deps.store.listUnlocked(userId);
      const unlockedAtByCode = new Map(
        existing.map((u) => [u.code, u.unlockedAt] as const),
      );

      return evaluateMilestones(selected, snapshot, unlockedAtByCode);
    });
  }

  snapshot(
    sessions: Parameters<typeof computeMetrics>[0]["sessions"],
  ): MetricsSnapshot {
    return computeMetrics({ sessions }, this.calculators);
  }

  private countUnlocked(
    definitions: readonly MilestoneDefinition[],
    storedCodes: ReadonlySet<string>,
  ): number {
    let count = 0;
    for (const definition of definitions) {
      if (storedCodes.has(definition.code)) count += 1;
    }
    return count;
  }
}
