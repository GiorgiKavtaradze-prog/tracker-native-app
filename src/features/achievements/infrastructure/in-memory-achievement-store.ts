import type { AchievementStore } from "../application";
import type { AchievementUnlock } from "../domain";

export class InMemoryAchievementStore implements AchievementStore {
  private readonly entries = new Map<string, AchievementUnlock[]>();

  async listUnlocked(userId: string): Promise<AchievementUnlock[]> {
    return [...(this.entries.get(userId) ?? [])];
  }

  async saveUnlocks(
    userId: string,
    unlocks: readonly AchievementUnlock[],
  ): Promise<number> {
    const existing = this.entries.get(userId) ?? [];
    const known = new Set(existing.map((unlock) => unlock.code));
    const added = unlocks.filter((unlock) => !known.has(unlock.code));

    if (added.length > 0) {
      this.entries.set(userId, [...existing, ...added]);
    }
    return added.length;
  }
}
