import type { CompletedSession } from "@/core";

export interface ReadinessProgressSource {
  listCompletedSessions(userId: string): Promise<CompletedSession[]>;
}

export interface ReadinessClock {
  now(): Date;
}

export interface ReadinessLogger {
  info(event: string, context?: Record<string, unknown>): void;
}

export interface ReadinessPorts {
  readonly progress: ReadinessProgressSource;
  readonly clock: ReadinessClock;
  readonly logger: ReadinessLogger;
}
