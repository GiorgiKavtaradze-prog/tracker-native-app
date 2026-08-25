import {
  AchievementsService,
  type AchievementStore,
  type Clock,
  type Logger,
  type ProgressSource,
} from "../application";
import { mergeCalculators } from "../domain/metrics";
import type { MetricCalculator, MilestoneDefinition } from "../domain";
import { InMemoryAchievementStore } from "./in-memory-achievement-store";

class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

class NoopLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
}

export interface AchievementsModule {
  readonly service: AchievementsService;
  readonly store: AchievementStore;
}

export interface AchievementsModuleInput {
  progress: ProgressSource;
  milestones?: readonly MilestoneDefinition[];
  calculators?: Record<string, MetricCalculator>;
  store?: AchievementStore;
  clock?: Clock;
  logger?: Logger;
}

export function createAchievementsModule(
  input: AchievementsModuleInput,
): AchievementsModule {
  const store = input.store ?? new InMemoryAchievementStore();

  const service = new AchievementsService(
    {
      progress: input.progress,
      store,
      clock: input.clock ?? new SystemClock(),
      logger: input.logger ?? new NoopLogger(),
    },
    {
      milestones: input.milestones,
      calculators: input.calculators
        ? mergeCalculators(input.calculators)
        : undefined,
    },
  );

  return { service, store };
}
