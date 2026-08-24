/**
 * US Navy & Jackson-Pollock Body Composition & Body Fat Analyzer Service
 * Calculates body fat percentage, lean body mass, fat mass, and target weight projections.
 */

export type Gender = "male" | "female";

export interface NavyBodyFatInput {
  gender: Gender;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number; // Required for females
}

export interface BodyFatResult {
  bodyFatPercentage: number;
  fatMassKg: number;
  leanMassKg: number;
  category: "Essential Fat" | "Athletes" | "Fitness" | "Average" | "Obese";
  idealWeightRangeKg: { min: number; max: number };
}

/**
 * Calculates Body Fat % using US Navy Circumference Method
 */
export function calculateNavyBodyFat(
  weightKg: number,
  input: NavyBodyFatInput,
): BodyFatResult {
  const { gender, heightCm, neckCm, waistCm, hipCm } = input;

  let bodyFatPercentage = 0;

  if (gender === "male") {
    // Male formula: 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
    const waistMinusNeck = waistCm - neckCm;
    if (waistMinusNeck > 0 && heightCm > 0) {
      bodyFatPercentage =
        86.01 * Math.log10(waistMinusNeck) -
        70.041 * Math.log10(heightCm) +
        36.76;
    }
  } else {
    // Female formula: 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
    const hip = hipCm ?? waistCm * 1.1;
    const sumVal = waistCm + hip - neckCm;
    if (sumVal > 0 && heightCm > 0) {
      bodyFatPercentage =
        163.205 * Math.log10(sumVal) - 97.684 * Math.log10(heightCm) - 78.387;
    }
  }

  bodyFatPercentage = Math.max(
    3,
    Math.min(60, Math.round(bodyFatPercentage * 10) / 10),
  );

  const fatMassKg = Math.round(weightKg * (bodyFatPercentage / 100) * 10) / 10;
  const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;

  // Categorize
  let category: BodyFatResult["category"] = "Average";
  if (gender === "male") {
    if (bodyFatPercentage < 6) category = "Essential Fat";
    else if (bodyFatPercentage <= 13) category = "Athletes";
    else if (bodyFatPercentage <= 17) category = "Fitness";
    else if (bodyFatPercentage <= 24) category = "Average";
    else category = "Obese";
  } else {
    if (bodyFatPercentage < 14) category = "Essential Fat";
    else if (bodyFatPercentage <= 20) category = "Athletes";
    else if (bodyFatPercentage <= 24) category = "Fitness";
    else if (bodyFatPercentage <= 31) category = "Average";
    else category = "Obese";
  }

  // Ideal weight at 12-15% (male) or 20-23% (female)
  const targetMinPct = gender === "male" ? 0.12 : 0.2;
  const targetMaxPct = gender === "male" ? 0.15 : 0.23;

  const minIdeal = Math.round((leanMassKg / (1 - targetMinPct)) * 10) / 10;
  const maxIdeal = Math.round((leanMassKg / (1 - targetMaxPct)) * 10) / 10;

  return {
    bodyFatPercentage,
    fatMassKg,
    leanMassKg,
    category,
    idealWeightRangeKg: {
      min: Math.min(minIdeal, maxIdeal),
      max: Math.max(minIdeal, maxIdeal),
    },
  };
}

/**
 * Jackson-Pollock 3-Site Caliper Skinfold Calculation (Chest, Abdomen, Thigh for males; Triceps, Suprailiac, Thigh for females)
 */
export function calculateJacksonPollock3(
  gender: Gender,
  ageYears: number,
  sumSkinfoldsMm: number,
): number {
  if (sumSkinfoldsMm <= 0 || ageYears <= 0) return 0;

  let bodyDensity = 0;

  if (gender === "male") {
    bodyDensity =
      1.10938 -
      0.0008267 * sumSkinfoldsMm +
      0.0000016 * Math.pow(sumSkinfoldsMm, 2) -
      0.0002574 * ageYears;
  } else {
    bodyDensity =
      1.0994921 -
      0.0009929 * sumSkinfoldsMm +
      0.0000023 * Math.pow(sumSkinfoldsMm, 2) -
      0.0001392 * ageYears;
  }

  // Siri Equation: %BF = (495 / Body Density) - 450
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(3, Math.min(60, Math.round(bodyFat * 10) / 10));
}
