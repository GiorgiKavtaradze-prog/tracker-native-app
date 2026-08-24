/**
 * Evidence-Based Sports Supplement Timing & Dosage Calculator
 * Provides science-backed dosage recommendations for Creatine, Caffeine, Beta-Alanine, and Electrolytes.
 */

export interface SupplementDosage {
  supplementName: string;
  recommendedDailyDose: string;
  optimalTiming: string;
  loadingProtocol?: string;
  halfLifeHours?: number;
  benefits: string;
}

export interface CaffeineDecayCurve {
  intakeTimeHours: number; // e.g. 14.0 for 2:00 PM
  initialMg: number;
  decaySchedule: { time: string; remainingMg: number; impactOnSleep: string }[];
}

/**
 * Calculates evidence-backed supplement dosages based on bodyweight & workout schedule
 */
export function calculateSupplementProtocol(
  weightKg: number,
  workoutTimeHour24: number = 17, // 5:00 PM default
): SupplementDosage[] {
  const safeWeight = Math.max(40, Math.min(160, weightKg));

  // Creatine: 0.03g - 0.05g / kg maintenance or 3-5g flat
  const creatineDoseGrams =
    Math.round(Math.max(3, safeWeight * 0.04) * 10) / 10;

  // Caffeine: 3-6mg / kg for ergogenic effect
  const caffeineMinMg = Math.round(safeWeight * 3);
  const caffeineMaxMg = Math.min(400, Math.round(safeWeight * 5));

  const preWorkoutHour = Math.max(0, workoutTimeHour24 - 1);
  const formattedPreWorkoutTime = `${preWorkoutHour > 12 ? preWorkoutHour - 12 : preWorkoutHour}:00 ${preWorkoutHour >= 12 ? "PM" : "AM"}`;

  return [
    {
      supplementName: "Creatine Monohydrate",
      recommendedDailyDose: `${creatineDoseGrams} g/day`,
      optimalTiming:
        "Post-workout with carbohydrates or at a consistent daily time",
      loadingProtocol:
        "Optional: 20g/day split into 4 doses for 5-7 days, then maintenance",
      benefits:
        "Increases intracellular phosphocreatine, ATP regeneration, power output, and muscle volume",
    },
    {
      supplementName: "Caffeine Anhydrous",
      recommendedDailyDose: `${caffeineMinMg} - ${caffeineMaxMg} mg (pre-workout)`,
      optimalTiming: `30-60 minutes before training (~${formattedPreWorkoutTime})`,
      halfLifeHours: 5.7,
      benefits:
        "Enhances central nervous system arousal, reduces perceived exertion, improves peak power output",
    },
    {
      supplementName: "Beta-Alanine",
      recommendedDailyDose: "3.2 - 6.4 g/day",
      optimalTiming:
        "Split into 2-3 doses of 1.6g throughout the day to minimize paresthesia (tingling)",
      benefits:
        "Increases intramuscular carnosine levels, buffering H+ ions during high-intensity 60-240s bouts",
    },
    {
      supplementName: "Electrolytes (Sodium / Potassium / Magnesium)",
      recommendedDailyDose:
        "500mg Sodium, 200mg Potassium, 100mg Magnesium per intense training hour",
      optimalTiming:
        "Sipped intra-workout in 500-750ml of water during sessions lasting >60 mins",
      benefits:
        "Maintains plasma volume, prevents cramping, and optimizes muscular contractions under heavy sweat rates",
    },
  ];
}

/**
 * Calculates Caffeine Decay Curve in the bloodstream to evaluate sleep disturbance
 * Average Caffeine Half-Life = ~5.5 hours
 */
export function calculateCaffeineDecay(
  intakeTimeHour24: number,
  caffeineMg: number,
): CaffeineDecayCurve {
  const halfLifeHours = 5.5;
  const decaySchedule: CaffeineDecayCurve["decaySchedule"] = [];

  for (let h = 0; h <= 12; h += 3) {
    const elapsed = h;
    const currentMg = Math.round(
      caffeineMg * Math.pow(0.5, elapsed / halfLifeHours),
    );

    const checkHour = (intakeTimeHour24 + h) % 24;
    const timeFormatted = `${checkHour > 12 ? checkHour - 12 : checkHour === 0 ? 12 : checkHour}:00 ${checkHour >= 12 ? "PM" : "AM"}`;

    let impactOnSleep = "Low impact";
    if (currentMg > 100) {
      impactOnSleep = "High risk of disrupting deep sleep latency";
    } else if (currentMg > 50) {
      impactOnSleep = "Moderate risk of delaying REM sleep";
    }

    decaySchedule.push({
      time: timeFormatted,
      remainingMg: currentMg,
      impactOnSleep,
    });
  }

  return {
    intakeTimeHours: intakeTimeHour24,
    initialMg: caffeineMg,
    decaySchedule,
  };
}
