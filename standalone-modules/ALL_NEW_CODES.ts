export interface ExerciseSetData {
  weightKg: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  rir?: number; // Reps in Reserve (0-5)
  muscleGroup: string;
  completedAt: Date;
}

export interface ACWRResult {
  acuteWorkload: number; // 7-day average workload
  chronicWorkload: number; // 28-day average workload
  acwrRatio: number; // acute / chronic
  riskZone: "Undertraining" | "Optimal" | "High Risk" | "Overreaching";
  recommendation: string;
}

export interface OneRepMaxCalculations {
  epley: number;
  brzycki: number;
  lander: number;
  lombardi: number;
  averageMax: number;
}

export function calculateAdvanced1RM(
  weightKg: number,
  reps: number,
): OneRepMaxCalculations {
  if (weightKg <= 0 || reps <= 0) {
    return { epley: 0, brzycki: 0, lander: 0, lombardi: 0, averageMax: 0 };
  }
  if (reps === 1) {
    return {
      epley: weightKg,
      brzycki: weightKg,
      lander: weightKg,
      lombardi: weightKg,
      averageMax: weightKg,
    };
  }

  const epley = weightKg * (1 + reps / 30);
  const brzycki = reps < 37 ? weightKg * (36 / (37 - reps)) : epley;
  const lander = (100 * weightKg) / (101.3 - 2.67123 * reps);
  const lombardi = weightKg * Math.pow(reps, 0.1);
  const averageMax =
    Math.round(((epley + brzycki + lander + lombardi) / 4) * 10) / 10;

  return {
    epley: Math.round(epley * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    lander: Math.round(lander * 10) / 10,
    lombardi: Math.round(lombardi * 10) / 10,
    averageMax,
  };
}

export function calculateACWR(
  sessionVolumes: { date: Date; volumeKg: number }[],
): ACWRResult {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const acuteSessions = sessionVolumes.filter((s) => s.date >= sevenDaysAgo);
  const chronicSessions = sessionVolumes.filter(
    (s) => s.date >= twentyEightDaysAgo,
  );

  const acuteTotal = acuteSessions.reduce((sum, s) => sum + s.volumeKg, 0);
  const chronicTotal = chronicSessions.reduce((sum, s) => sum + s.volumeKg, 0);

  const acuteWorkload = acuteTotal / 7;
  const chronicWorkload = chronicTotal / 28;

  if (chronicWorkload === 0) {
    return {
      acuteWorkload: Math.round(acuteWorkload),
      chronicWorkload: 0,
      acwrRatio: 1.0,
      riskZone: "Optimal",
      recommendation:
        "Baseline workload established. Continue gradual progression.",
    };
  }

  const acwrRatio = Math.round((acuteWorkload / chronicWorkload) * 100) / 100;
  let riskZone: ACWRResult["riskZone"] = "Optimal";
  let recommendation =
    "Workload is in the sweet spot (0.8 - 1.3). Low injury risk.";

  if (acwrRatio < 0.8) {
    riskZone = "Undertraining";
    recommendation =
      "Workload dropped significantly. Increase training volume gradually.";
  } else if (acwrRatio > 1.5) {
    riskZone = "High Risk";
    recommendation =
      "Spike in training volume! High risk of injury/overuse. Consider a deload.";
  } else if (acwrRatio > 1.3) {
    riskZone = "Overreaching";
    recommendation =
      "High intensity zone. Monitor recovery and sleep carefully.";
  }

  return {
    acuteWorkload: Math.round(acuteWorkload),
    chronicWorkload: Math.round(chronicWorkload),
    acwrRatio,
    riskZone,
    recommendation,
  };
}

// ============================================================================
// 2. NUTRITION, BMR & TDEE ENGINE
// ============================================================================

export type Gender = "male" | "female";
export type ActivityLevel =
  "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "fat_loss" | "maintenance" | "muscle_gain" | "recomp";

export function calculateTDEEAndMacros(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: Goal = "maintenance",
) {
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  bmr += gender === "male" ? 5 : -161;
  bmr = Math.round(bmr);

  const mults: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(bmr * (mults[activityLevel] || 1.2));

  let calorieAdjustment = 0;
  let proteinRatio = 2.0;

  if (goal === "fat_loss") {
    calorieAdjustment = -500;
    proteinRatio = 2.2;
  } else if (goal === "muscle_gain") {
    calorieAdjustment = 300;
    proteinRatio = 2.0;
  } else if (goal === "recomp") {
    calorieAdjustment = -150;
    proteinRatio = 2.4;
  }

  const targetCalories = Math.max(1200, tdee + calorieAdjustment);
  const proteinGrams = Math.round(weightKg * proteinRatio);
  const fatsGrams = Math.round((targetCalories * 0.25) / 9);
  const carbsGrams = Math.round(
    Math.max(0, targetCalories - (proteinGrams * 4 + fatsGrams * 9)) / 4,
  );

  return {
    bmr,
    tdee,
    targetCalories,
    goal,
    macros: { proteinGrams, carbsGrams, fatsGrams },
  };
}

// ============================================================================
// 3. BARBELL PLATE LOADING CALCULATOR
// ============================================================================

export interface PlateCount {
  plateWeightKg: number;
  countPerSide: number;
}

export function calculateBarbellPlates(
  targetWeightKg: number,
  barWeightKg: number = 20,
) {
  if (targetWeightKg <= barWeightKg) {
    return {
      targetWeightKg,
      barWeightKg,
      actualWeightKg: barWeightKg,
      platesPerSide: [],
    };
  }

  let rem = (targetWeightKg - barWeightKg) / 2;
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const platesPerSide: PlateCount[] = [];

  for (const p of plates) {
    if (rem >= p) {
      const count = Math.floor(rem / p);
      rem = Math.round((rem - count * p) * 100) / 100;
      platesPerSide.push({ plateWeightKg: p, countPerSide: count });
    }
  }

  return {
    targetWeightKg,
    barWeightKg,
    actualWeightKg: targetWeightKg - rem * 2,
    platesPerSide,
  };
}

// ============================================================================
// 4. PERIODIZATION & STRENGTH PROGRAMMING PLANNER
// ============================================================================

export interface PeriodizationWeek {
  weekNumber: number;
  phaseName: string;
  volumePercentage: number;
  intensityPercentage: number;
  targetReps: number;
  targetSets: number;
  isDeload: boolean;
  notes: string;
}

export function generateLinearPeriodization(
  weeksCount: 4 | 8 | 12 = 4,
  starting1RMPercentage: number = 70,
) {
  const weeks: PeriodizationWeek[] = [];

  for (let w = 1; w <= weeksCount; w++) {
    const isDeload = w % 4 === 0;

    if (isDeload) {
      weeks.push({
        weekNumber: w,
        phaseName: "Active Recovery & Deload",
        volumePercentage: 50,
        intensityPercentage: 60,
        targetReps: 10,
        targetSets: 2,
        isDeload: true,
        notes:
          "Reduce weight by 30-40% and cut set count in half to drop fatigue.",
      });
    } else {
      const step = Math.floor((w - 1) / 4) * 5 + ((w - 1) % 4) * 2.5;
      const intensity = Math.min(92.5, starting1RMPercentage + step);
      const reps = Math.max(3, 12 - Math.floor((intensity - 65) / 3));

      weeks.push({
        weekNumber: w,
        phaseName:
          w <= 4
            ? "Hypertrophy Phase"
            : w <= 8
              ? "Strength Phase"
              : "Peaking Phase",
        volumePercentage: 100 - (w - 1) * 3,
        intensityPercentage: Math.round(intensity * 10) / 10,
        targetReps: reps,
        targetSets: reps <= 5 ? 5 : 4,
        isDeload: false,
        notes: `Focus on clean bar speed and maintaining ${reps} controlled reps.`,
      });
    }
  }

  return { name: `${weeksCount}-Week Linear Strength Periodization`, weeks };
}

// ============================================================================
// 5. HEART RATE ZONES & VO2 MAX ESTIMATOR
// ============================================================================

export function calculateHeartRateZones(
  ageYears: number,
  restingHr: number = 60,
) {
  const maxHr = Math.round(208 - 0.7 * ageYears);
  const hrr = maxHr - restingHr;

  const target = (pct: number) => Math.round(hrr * (pct / 100) + restingHr);

  return {
    maxHr,
    restingHr,
    zones: [
      {
        zone: 1,
        name: "Active Recovery",
        minBpm: target(50),
        maxBpm: target(60),
      },
      {
        zone: 2,
        name: "Aerobic Fat Burn",
        minBpm: target(60),
        maxBpm: target(70),
      },
      {
        zone: 3,
        name: "Tempo / Aerobic Power",
        minBpm: target(70),
        maxBpm: target(80),
      },
      {
        zone: 4,
        name: "Lactate Threshold",
        minBpm: target(80),
        maxBpm: target(90),
      },
      { zone: 5, name: "Anaerobic VO2 Max", minBpm: target(90), maxBpm: maxHr },
    ],
  };
}

// ============================================================================
// 6. BODY COMPOSITION ANALYZER (NAVY METHOD)
// ============================================================================

export function calculateNavyBodyFat(
  weightKg: number,
  heightCm: number,
  neckCm: number,
  waistCm: number,
  gender: Gender,
  hipCm?: number,
) {
  let bf = 0;
  if (gender === "male") {
    const diff = waistCm - neckCm;
    if (diff > 0 && heightCm > 0)
      bf = 86.01 * Math.log10(diff) - 70.041 * Math.log10(heightCm) + 36.76;
  } else {
    const sum = waistCm + (hipCm ?? waistCm * 1.1) - neckCm;
    if (sum > 0 && heightCm > 0)
      bf = 163.205 * Math.log10(sum) - 97.684 * Math.log10(heightCm) - 78.387;
  }

  bf = Math.max(3, Math.min(60, Math.round(bf * 10) / 10));
  const fatMass = Math.round(weightKg * (bf / 100) * 10) / 10;
  const leanMass = Math.round((weightKg - fatMass) * 10) / 10;

  return { bodyFatPercentage: bf, fatMassKg: fatMass, leanMassKg: leanMass };
}

// ============================================================================
// 7. SLEEP & HRV ATHLETIC READINESS SCORE
// ============================================================================

export interface SleepDataInput {
  sleepDurationHours: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  hrvMs: number;
  baselineHrvMs: number;
  restingHrBpm: number;
  baselineRestingHrBpm: number;
}

export function calculateReadinessScore(input: SleepDataInput) {
  let score = 50;

  if (input.sleepDurationHours >= 8) score += 25;
  else if (input.sleepDurationHours >= 7) score += 15;

  if (input.baselineHrvMs > 0) {
    const diff =
      ((input.hrvMs - input.baselineHrvMs) / input.baselineHrvMs) * 100;
    if (diff >= 0) score += 25;
    else score += 10;
  }

  score = Math.min(100, Math.max(0, score));
  return {
    score,
    status: score >= 80 ? "Prime" : score >= 60 ? "Good" : "Deload Recommended",
  };
}

// ============================================================================
// 8. AI PROMPT TEMPLATE BUILDER
// ============================================================================

export function buildExerciseInstructionsPrompt(
  exerciseName: string,
  muscles: string,
) {
  return {
    systemPrompt: "You are an elite strength & conditioning coach.",
    userPrompt: `Provide execution cues, form safety tips, and common mistakes for ${exerciseName} targeting ${muscles}.`,
  };
}

// ============================================================================
// 9. WORKOUT EXPORTER (MARKDOWN REPORT GENERATOR)
// ============================================================================

export function formatWorkoutToMarkdown(
  sessionName: string,
  exercises: { name: string; weightKg: number; reps: number }[],
): string {
  let md = `# 🏋️‍♂️ ${sessionName}\n\n| Exercise | Weight (kg) | Reps |\n|---|---|---|\n`;
  exercises.forEach((ex) => {
    md += `| ${ex.name} | ${ex.weightKg} | ${ex.reps} |\n`;
  });
  return md;
}
