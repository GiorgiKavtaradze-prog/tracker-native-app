import { z } from "zod";
import { ACHIEVEMENT_CATEGORIES } from "../domain";

export const achievementsUserIdSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

export const achievementFilterSchema = z.object({
  categories: z.array(z.enum(ACHIEVEMENT_CATEGORIES)).optional(),
  codes: z.array(z.string().min(1)).optional(),
});

export type AchievementsUserIdDTO = z.infer<typeof achievementsUserIdSchema>;
export type AchievementFilterDTO = z.infer<typeof achievementFilterSchema>;
