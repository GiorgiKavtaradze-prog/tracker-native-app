/**
 * Standalone Nutrition, TDEE, Macro & Calorie Burn Calculation Engine
 */

export type Gender = "male" | "female";
export type ActivityLevel =
  "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "fat_loss" | "maintenance" | "muscle_gain" | "recomp";

export interface BMRResult {
  mifflinStJeor: number;
  katchMcardle?: number;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  goal: Goal;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
    proteinCalories: number;
    carbsCalories: number;
    fatsCalories: number;
  };
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Little to no exercise
  light: 1.375, // 1-3 days/week exercise
  moderate: 1.55, // 3-5 days/week exercise
  active: 1.725, // 6-7 days/week exercise
  very_active: 1.9, // Intense daily exercise / physical job
};

/**
 * Calculates BMR using Mifflin-St Jeor and optional Katch-McArdle (if bodyfat % provided)
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender,
  bodyFatPercentage?: number,
): BMRResult {
  // Mifflin-St Jeor Equation
  let mifflinStJeor = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  mifflinStJeor += gender === "male" ? 5 : -161;

  let katchMcardle: number | undefined;
  if (bodyFatPercentage !== undefined && bodyFatPercentage > 0) {
    const leanBodyMassKg = weightKg * (1 - bodyFatPercentage / 100);
    katchMcardle = 370 + 21.6 * leanBodyMassKg;
  }

  return {
    mifflinStJeor: Math.round(mifflinStJeor),
    katchMcardle: katchMcardle ? Math.round(katchMcardle) : undefined,
  };
}

/**
 * Calculates TDEE & customized macronutrient breakdown based on fitness goals
 */
export function calculateTDEEAndMacros(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: Goal = "maintenance",
  bodyFatPercentage?: number,
): TDEEResult {
  const bmrResult = calculateBMR(
    weightKg,
    heightCm,
    ageYears,
    gender,
    bodyFatPercentage,
  );
  const bmr = bmrResult.katchMcardle ?? bmrResult.mifflinStJeor;

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const tdee = Math.round(bmr * multiplier);

  let calorieAdjustment = 0;
  let proteinRatio = 2.0; // g per kg of bodyweight
  let fatPercentage = 0.25; // 25% of calories from fat

  switch (goal) {
    case "fat_loss":
      calorieAdjustment = -500; // 500 kcal deficit
      proteinRatio = 2.2; // Higher protein to preserve muscle
      fatPercentage = 0.25;
      break;
    case "muscle_gain":
      calorieAdjustment = 300; // Moderate surplus
      proteinRatio = 2.0;
      fatPercentage = 0.25;
      break;
    case "recomp":
      calorieAdjustment = -150; // Mild deficit
      proteinRatio = 2.4; // High protein
      fatPercentage = 0.25;
      break;
    case "maintenance":
    default:
      calorieAdjustment = 0;
      proteinRatio = 1.8;
      fatPercentage = 0.3;
      break;
  }

  const targetCalories = Math.max(1200, tdee + calorieAdjustment);

  // Protein: 4 kcal per gram
  const proteinGrams = Math.round(weightKg * proteinRatio);
  const proteinCalories = proteinGrams * 4;

  // Fats: 9 kcal per gram
  const fatsCalories = Math.round(targetCalories * fatPercentage);
  const fatsGrams = Math.round(fatsCalories / 9);

  // Carbs: Remaining calories / 4 kcal per gram
  const carbsCalories = Math.max(
    0,
    targetCalories - (proteinCalories + fatsCalories),
  );
  const carbsGrams = Math.round(carbsCalories / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    goal,
    macros: {
      proteinGrams,
      carbsGrams,
      fatsGrams,
      proteinCalories,
      carbsCalories,
      fatsCalories,
    },
  };
}

/**
 * Calculates estimated calorie burn during exercise using MET (Metabolic Equivalent of Task)
 * Formula: Calories = MET * Weight(kg) * Duration(hours)
 */
export function estimateExerciseCalorieBurn(
  weightKg: number,
  durationMinutes: number,
  metValue: number = 6.0,
): number {
  if (weightKg <= 0 || durationMinutes <= 0) return 0;
  const durationHours = durationMinutes / 60;
  const calories = metValue * weightKg * durationHours;
  return Math.round(calories);
}
