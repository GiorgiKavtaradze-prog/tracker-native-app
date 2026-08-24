/**
 * Advanced Fitness & Sports Science Analytics Module
 * Contains algorithms for 1RM, ACWR (Acute:Chronic Workload Ratio), RPE/RIR intensity,
 * and muscle volume distribution.
 */

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

/**
 * Calculates One-Rep Max (1RM) using 4 sports science formulas
 */
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

  // 1. Epley Formula
  const epley = weightKg * (1 + reps / 30);

  // 2. Brzycki Formula
  const brzycki = reps < 37 ? weightKg * (36 / (37 - reps)) : epley;

  // 3. Lander Formula
  const lander = (100 * weightKg) / (101.3 - 2.67123 * reps);

  // 4. Lombardi Formula
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

/**
 * Calculates Acute:Chronic Workload Ratio (ACWR) to monitor injury risk & fatigue
 * Acute = 7 days volume, Chronic = 28 days volume average
 */
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

/**
 * Calculates Estimated RPE-Based 1RM based on Reps and RPE (Rating of Perceived Exertion)
 */
export function calculateRPE1RM(
  weightKg: number,
  reps: number,
  rpe: number,
): number {
  if (rpe < 1 || rpe > 10 || reps < 1) return weightKg;

  // Approximate percentage of 1RM table relative to RPE & reps
  const rir = 10 - rpe; // Reps In Reserve
  const effectiveReps = reps + rir;

  const result = calculateAdvanced1RM(weightKg, effectiveReps);
  return result.averageMax;
}

/**
 * Groups set history by muscle group and calculates volume distribution %
 */
export function getMuscleVolumeBreakdown(
  sets: ExerciseSetData[],
): Record<
  string,
  { totalVolumeKg: number; percentage: number; setCounts: number }
> {
  const totalVolume = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const breakdown: Record<
    string,
    { totalVolumeKg: number; percentage: number; setCounts: number }
  > = {};

  if (totalVolume === 0) return breakdown;

  for (const set of sets) {
    const key = set.muscleGroup.toLowerCase();
    const volume = set.weightKg * set.reps;

    if (!breakdown[key]) {
      breakdown[key] = { totalVolumeKg: 0, percentage: 0, setCounts: 0 };
    }

    breakdown[key].totalVolumeKg += volume;
    breakdown[key].setCounts += 1;
  }

  for (const key in breakdown) {
    breakdown[key].percentage = Math.round(
      (breakdown[key].totalVolumeKg / totalVolume) * 100,
    );
  }

  return breakdown;
}
