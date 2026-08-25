/**
 * Composition root — the single place where the entire application is "wired
 * together" (dependency injection / service locator). Nothing upstream constructs
 * dependencies manually; it all flows from here.
 *
 * This is intentionally NOT yet referenced from the router render layer — it is
 * the ready-to-adopt seam that an API handler or screen can import once they want
 * these use-cases. Keeping it isolated means the existing screens keep working
 * untouched while this clean-architecture layer remains fully available.
 */
import { ConsoleLogger, SequentialIdGenerator, SystemClock } from "./clock";
import {
  DrizzleExerciseRepository,
  DrizzleProfileRepository,
} from "./repositories/drizzle-catalog";
import {
  DrizzleProgressReadModel,
  DrizzleSessionRepository,
} from "./repositories/drizzle-sessions";
import { DrizzleWorkoutRepository } from "./repositories/drizzle-workouts";
import {
  GeminiAICoachProvider,
  RuleBasedCoachProvider,
} from "./ai/ai-coach-adapter";
import type { AppPorts, Logger } from "@/application/ports";
import { WorkoutManagementService } from "@/application/use-cases/workouts";
import { TrainingSessionService } from "@/application/use-cases/sessions";
import { ProgressAnalyticsService } from "@/application/use-cases/analytics";
import { CoachingService } from "@/application/use-cases/coaching";
import { PersonalizationService } from "@/application/use-cases/personalization";

/** Everything the runtime needs, assembled in one object. */
export interface AppContainer {
  ports: AppPorts;
  services: {
    workouts: WorkoutManagementService;
    sessions: TrainingSessionService;
    analytics: ProgressAnalyticsService;
    coaching: CoachingService;
    personalization: PersonalizationService;
  };
}

export function createAppContainer(
  options: { logger?: Logger; useRulesAI?: boolean } = {},
): AppContainer {
  const logger = options.logger ?? new ConsoleLogger("infra");

  const ports: AppPorts = {
    workouts: new DrizzleWorkoutRepository(),
    sessions: new DrizzleSessionRepository(),
    exercises: new DrizzleExerciseRepository(),
    profiles: new DrizzleProfileRepository(),
    progress: new DrizzleProgressReadModel(),
    clock: new SystemClock(),
    ids: new SequentialIdGenerator(),
    logger,
    ai: options.useRulesAI
      ? new RuleBasedCoachProvider()
      : new GeminiAICoachProvider(),
  };

  return {
    ports,
    services: {
      workouts: new WorkoutManagementService(ports),
      sessions: new TrainingSessionService(ports),
      analytics: new ProgressAnalyticsService(ports),
      coaching: new CoachingService(ports),
      personalization: new PersonalizationService(),
    },
  };
}
