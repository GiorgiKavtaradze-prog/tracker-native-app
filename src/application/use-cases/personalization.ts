/**
 * Personalization use case — nutrition, supplementation and cardio guidance built
 * on the existing `src/lib` calculators. Thin orchestration: validates input and
 * delegates to the proven, evidence-based engines so the domain stays DRY.
 */
import { ValidationError, type AppError } from "@/core/domain-error";
import { type Result, tryAsync } from "@/core";
import {
  calculateTDEEAndMacros,
  type Goal as NutritionGoal,
} from "@/lib/nutrition-calculator";
import { calculateSupplementProtocol } from "@/lib/supplement-timing-calculator";
import {
  calculateHeartRateZones,
  estimateVO2Max,
} from "@/lib/heart-rate-zones";

export interface NutritionPlanInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: NutritionGoal;
  bodyFatPercentage?: number;
}

export class PersonalizationService {
  async nutrition(
    input: NutritionPlanInput,
  ): Promise<Result<ReturnType<typeof calculateTDEEAndMacros>>> {
    const check = validateNumbers(input);
    if (!check.ok) return { ok: false, error: check.error };

    return tryAsync(() =>
      calculateTDEEAndMacros(
        input.weightKg,
        input.heightCm,
        input.ageYears,
        input.gender,
        input.activityLevel,
        input.goal,
        input.bodyFatPercentage,
      ),
    );
  }

  async supplements(
    weightKg: number,
    workoutHour24?: number,
  ): Promise<Result<ReturnType<typeof calculateSupplementProtocol>>> {
    return tryAsync(() => calculateSupplementProtocol(weightKg, workoutHour24));
  }

  async cardioZones(
    ageYears: number,
    restingHr?: number,
  ): Promise<Result<ReturnType<typeof calculateHeartRateZones>>> {
    return tryAsync(() => calculateHeartRateZones(ageYears, restingHr));
  }

  async vo2Max(ageYears: number, restingHr: number): Promise<Result<number>> {
    return tryAsync(() => estimateVO2Max(ageYears, restingHr));
  }
}

function validateNumbers(input: NutritionPlanInput): Result<void, AppError> {
  const { weightKg, heightCm, ageYears, bodyFatPercentage } = input;
  if (
    weightKg <= 0 ||
    heightCm <= 0 ||
    ageYears <= 0 ||
    (bodyFatPercentage !== undefined &&
      (bodyFatPercentage < 0 || bodyFatPercentage > 100))
  ) {
    return {
      ok: false,
      error: new ValidationError("Invalid anthropometric input"),
    };
  }
  return { ok: true, value: undefined };
}
