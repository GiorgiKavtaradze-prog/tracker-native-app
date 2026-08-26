import { z } from "zod";
import { SCORING_PROFILE_NAMES } from "../domain/profiles";

export const DEFAULT_WINDOW_DAYS = 28;
export const DEFAULT_ACUTE_DAYS = 7;
export const DEFAULT_CHRONIC_DAYS = 28;

export const readinessQuerySchema = z
  .object({
    windowDays: z.coerce
      .number()
      .int()
      .min(14)
      .max(90)
      .default(DEFAULT_WINDOW_DAYS),
    acuteDays: z.coerce
      .number()
      .int()
      .min(3)
      .max(14)
      .default(DEFAULT_ACUTE_DAYS),
    chronicDays: z.coerce
      .number()
      .int()
      .min(7)
      .max(56)
      .default(DEFAULT_CHRONIC_DAYS),
    profile: z.enum(SCORING_PROFILE_NAMES).optional(),
  })
  .refine(({ acuteDays, chronicDays }) => chronicDays > acuteDays, {
    message: "chronicDays must be greater than acuteDays",
  });

export type ReadinessQueryDTO = z.infer<typeof readinessQuerySchema>;
