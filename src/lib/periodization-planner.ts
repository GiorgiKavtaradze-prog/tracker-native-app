/**
 * Advanced Workout Periodization & Strength Programming Module
 * Generates linear periodization, block periodization, and wave-loading schemes.
 */

export type PeriodizationType = "linear" | "block" | "wave" | "undulating";

export interface PeriodizationWeek {
  weekNumber: number;
  phaseName: string;
  volumePercentage: number; // % of standard total volume
  intensityPercentage: number; // % of 1RM
  targetReps: number;
  targetSets: number;
  isDeload: boolean;
  notes: string;
}

export interface PeriodizationProgram {
  name: string;
  type: PeriodizationType;
  totalWeeks: number;
  weeks: PeriodizationWeek[];
}

/**
 * Generates a 4-week to 12-week Linear Periodization Macrocycle
 * Gradually increases intensity while decreasing rep volume, ending with a deload.
 */
export function generateLinearPeriodization(
  weeksCount: 4 | 8 | 12 = 4,
  starting1RMPercentage: number = 70,
): PeriodizationProgram {
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
      // Calculate progressive overload step
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

  return {
    name: `${weeksCount}-Week Linear Strength Periodization`,
    type: "linear",
    totalWeeks: weeksCount,
    weeks,
  };
}

/**
 * Calculates 5/3/1 Style Wave Loading weights for a main lift
 */
export function calculateWaveLoadingCycle(oneRepMaxKg: number): {
  trainingMaxKg: number;
  week1: { percentage: number; weightKg: number; reps: string }[];
  week2: { percentage: number; weightKg: number; reps: string }[];
  week3: { percentage: number; weightKg: number; reps: string }[];
  week4Deload: { percentage: number; weightKg: number; reps: string }[];
} {
  const round = (w: number) => Math.round(w * 0.9 * 2) / 2; // 90% Training Max
  const tm = round(oneRepMaxKg);

  const calcSet = (pct: number, repStr: string) => ({
    percentage: pct,
    weightKg: Math.round(tm * (pct / 100) * 2) / 2,
    reps: repStr,
  });

  return {
    trainingMaxKg: tm,
    week1: [
      calcSet(65, "5 reps"),
      calcSet(75, "5 reps"),
      calcSet(85, "5+ reps (AMRAP)"),
    ],
    week2: [
      calcSet(70, "3 reps"),
      calcSet(80, "3 reps"),
      calcSet(90, "3+ reps (AMRAP)"),
    ],
    week3: [
      calcSet(75, "5 reps"),
      calcSet(85, "3 reps"),
      calcSet(95, "1+ reps (AMRAP)"),
    ],
    week4Deload: [
      calcSet(40, "5 reps"),
      calcSet(50, "5 reps"),
      calcSet(60, "5 reps"),
    ],
  };
}
