import type { CompletedSession } from "@/core";
import type { AchievementUnlock } from "../domain";

export interface ProgressSource {
  listCompletedSessions(userId: string): Promise<CompletedSession[]>;
}

export interface AchievementStore {
  listUnlocked(userId: string): Promise<AchievementUnlock[]>;
  saveUnlocks(
    userId: string,
    unlocks: readonly AchievementUnlock[],
  ): Promise<number>;
}

export interface Clock {
  now(): Date;
}

export interface Logger {
  info(event: string, context?: Record<string, unknown>): void;
  warn(event: string, context?: Record<string, unknown>): void;
  error(event: string, context?: Record<string, unknown>): void;
}

export interface AchievementsPorts {
  progress: ProgressSource;
  store: AchievementStore;
  clock: Clock;
  logger: Logger;
}
