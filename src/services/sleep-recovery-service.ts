/**
 * Sleep & HRV Readiness / Recovery Score Service
 * Computes daily athletic recovery readiness (0-100%) and training recommendations.
 */

export interface SleepDataInput {
  sleepDurationHours: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  hrvMs: number; // Heart Rate Variability (RMSSD in ms)
  baselineHrvMs: number; // 7-day average baseline HRV
  restingHrBpm: number;
  baselineRestingHrBpm: number;
  previousDayVolumeKg: number;
}

export interface ReadinessScoreResult {
  score: number; // 0 - 100
  status: "Prime" | "Good" | "Fair" | "Low Readiness / Recover";
  colorCode: string;
  recommendedIntensity:
    | "100% PR Attempt"
    | "Normal Training"
    | "Moderate Volume"
    | "Deload / Active Rest";
  keyFactors: string[];
}

/**
 * Calculates athletic readiness score (0-100%) based on sleep metrics, HRV deviation, and resting HR
 */
export function calculateReadinessScore(
  input: SleepDataInput,
): ReadinessScoreResult {
  const {
    sleepDurationHours,
    deepSleepMinutes,
    remSleepMinutes,
    hrvMs,
    baselineHrvMs,
    restingHrBpm,
    baselineRestingHrBpm,
  } = input;

  const keyFactors: string[] = [];

  // 1. Sleep Duration Score (max 35 points)
  let sleepScore = 0;
  if (sleepDurationHours >= 8) {
    sleepScore = 35;
    keyFactors.push("Optimal sleep duration (8+ hours)");
  } else if (sleepDurationHours >= 7) {
    sleepScore = 28;
    keyFactors.push("Adequate sleep duration (7+ hours)");
  } else if (sleepDurationHours >= 6) {
    sleepScore = 18;
    keyFactors.push("Sub-optimal sleep duration (<7 hours)");
  } else {
    sleepScore = 8;
    keyFactors.push("Sleep deficit (<6 hours)");
  }

  // 2. Sleep Architecture Score (Deep + REM sleep % of total, max 25 points)
  const totalSleepMinutes = sleepDurationHours * 60;
  const restorativeMinutes = deepSleepMinutes + remSleepMinutes;
  const restorativeRatio =
    totalSleepMinutes > 0 ? restorativeMinutes / totalSleepMinutes : 0;

  let archScore = 0;
  if (restorativeRatio >= 0.4) {
    archScore = 25;
    keyFactors.push("Excellent deep & REM restorative sleep ratio");
  } else if (restorativeRatio >= 0.3) {
    archScore = 20;
  } else {
    archScore = 10;
    keyFactors.push("Low deep/REM sleep stage duration");
  }

  // 3. HRV Deviation Score (max 25 points)
  // Higher HRV relative to baseline = higher parasympathetic recovery
  let hrvScore = 20;
  if (baselineHrvMs > 0) {
    const hrvDiffPct = ((hrvMs - baselineHrvMs) / baselineHrvMs) * 100;
    if (hrvDiffPct >= 5) {
      hrvScore = 25;
      keyFactors.push("HRV above baseline (+ parasympathetic state)");
    } else if (hrvDiffPct >= -5) {
      hrvScore = 20;
    } else if (hrvDiffPct >= -15) {
      hrvScore = 12;
      keyFactors.push("HRV suppressed below 7-day baseline");
    } else {
      hrvScore = 5;
      keyFactors.push("Significant HRV drop (-15%+), sympathetic fatigue");
    }
  }

  // 4. Resting HR Deviation Score (max 15 points)
  // Lower resting HR relative to baseline = better recovery
  let rhrScore = 12;
  if (baselineRestingHrBpm > 0) {
    const rhrDiff = restingHrBpm - baselineRestingHrBpm;
    if (rhrDiff <= -2) {
      rhrScore = 15;
    } else if (rhrDiff <= 2) {
      rhrScore = 12;
    } else {
      rhrScore = 4;
      keyFactors.push(`Elevated resting heart rate (+${rhrDiff} bpm)`);
    }
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round(sleepScore + archScore + hrvScore + rhrScore)),
  );

  let status: ReadinessScoreResult["status"] = "Good";
  let colorCode = "#22C55E";
  let recommendedIntensity: ReadinessScoreResult["recommendedIntensity"] =
    "Normal Training";

  if (score >= 85) {
    status = "Prime";
    colorCode = "#10B981";
    recommendedIntensity = "100% PR Attempt";
  } else if (score >= 70) {
    status = "Good";
    colorCode = "#22C55E";
    recommendedIntensity = "Normal Training";
  } else if (score >= 50) {
    status = "Fair";
    colorCode = "#EAB308";
    recommendedIntensity = "Moderate Volume";
  } else {
    status = "Low Readiness / Recover";
    colorCode = "#EF4444";
    recommendedIntensity = "Deload / Active Rest";
  }

  return {
    score,
    status,
    colorCode,
    recommendedIntensity,
    keyFactors,
  };
}
