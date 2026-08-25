/**
 * Drizzle-backed catalog (exercise search) + profile repositories.
 */
import { eq, like, or } from "drizzle-orm";
import { db, exercises, profiles } from "@/db";
import type { ExerciseTemplate, Profile, ProfileInput } from "@/core";
import type {
  ExerciseRepository,
  ProfileRepository,
} from "@/application/ports";
import { toExercise, toProfile } from "./mappers";

export class DrizzleExerciseRepository implements ExerciseRepository {
  async findById(id: string): Promise<ExerciseTemplate | null> {
    const [row] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);
    return row ? toExercise(row) : null;
  }

  async search(query?: string): Promise<ExerciseTemplate[]> {
    const trimmed = query?.trim() ?? "";
    if (trimmed.length === 0) {
      const rows = await db.select().from(exercises).limit(500);
      return rows.map(toExercise);
    }

    const pattern = `%${trimmed.toLowerCase()}%`;
    const rows = await db
      .select()
      .from(exercises)
      .where(
        or(
          like(exercises.name, pattern),
          like(exercises.muscles, pattern),
          like(exercises.category, pattern),
        ),
      )
      .limit(500);
    return rows.map(toExercise);
  }
}

export class DrizzleProfileRepository implements ProfileRepository {
  async getByUserId(userId: string): Promise<Profile | null> {
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return row ? toProfile(row) : null;
  }

  async upsert(userId: string, input: ProfileInput): Promise<Profile> {
    const existing = await this.getByUserId(userId);
    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({
          gender: input.gender,
          goal: input.goal,
          experience: input.experience,
          weightUnit: input.weightUnit,
        })
        .where(eq(profiles.userId, userId))
        .returning();
      if (updated) return toProfile(updated);
    }

    const [created] = await db
      .insert(profiles)
      .values({
        userId,
        gender: input.gender,
        goal: input.goal,
        experience: input.experience,
        weightUnit: input.weightUnit,
      })
      .returning();
    if (!created) throw new Error("Failed to upsert profile");
    return toProfile(created);
  }
}
