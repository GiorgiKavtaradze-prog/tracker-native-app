/**
 * Heart Rate & Cardio Training Zone Engine
 * Calculates Max HR, Karvonen Target Heart Rate Zones, and VO2 Max approximations.
 */

export interface HeartRateZone {
  zoneNumber: number;
  name: string;
  minBpm: number;
  maxBpm: number;
  minPercentage: number;
  maxPercentage: number;
  primaryBenefit: string;
  perceivedExertion: string;
}

export interface HeartRateAnalysis {
  maxHrTanaka: number;
  maxHrGellish: number;
  restingHr: number;
  heartRateReserve: number; // HRR = HRmax - HRresting
  zones: HeartRateZone[];
}

/**
 * Calculates Heart Rate Max and Karvonen Training Zones (Zone 1 - Zone 5)
 */
export function calculateHeartRateZones(
  ageYears: number,
  restingHr: number = 60,
): HeartRateAnalysis {
  const safeAge = Math.max(10, Math.min(100, ageYears));

  // Tanaka Formula: 208 - (0.7 * age)
  const maxHrTanaka = Math.round(208 - 0.7 * safeAge);

  // Gellish Formula: 207 - (0.7 * age)
  const maxHrGellish = Math.round(207 - 0.7 * safeAge);

  const maxHr = maxHrTanaka;
  const heartRateReserve = maxHr - restingHr;

  // Karvonen Formula: Target HR = ((HRmax - HRresting) * %Intensity) + HRresting
  const calcTargetBpm = (pct: number) =>
    Math.round(heartRateReserve * (pct / 100) + restingHr);

  const zones: HeartRateZone[] = [
    {
      zoneNumber: 1,
      name: "Active Recovery",
      minBpm: calcTargetBpm(50),
      maxBpm: calcTargetBpm(60),
      minPercentage: 50,
      maxPercentage: 60,
      primaryBenefit: "Warming up, cooling down, active muscle recovery",
      perceivedExertion: "Very light, easy conversation",
    },
    {
      zoneNumber: 2,
      name: "Aerobic Base & Fat Burn",
      minBpm: calcTargetBpm(60),
      maxBpm: calcTargetBpm(70),
      minPercentage: 60,
      maxPercentage: 70,
      primaryBenefit:
        "Builds cardiovascular endurance and mitochondrial density",
      perceivedExertion: "Light, comfortable breathing pace",
    },
    {
      zoneNumber: 3,
      name: "Tempo / Aerobic Power",
      minBpm: calcTargetBpm(70),
      maxBpm: calcTargetBpm(80),
      minPercentage: 70,
      maxPercentage: 80,
      primaryBenefit:
        "Improves aerobic capacity and blood circulation efficiency",
      perceivedExertion: "Moderate effort, rhythmic breathing",
    },
    {
      zoneNumber: 4,
      name: "Lactate Threshold",
      minBpm: calcTargetBpm(80),
      maxBpm: calcTargetBpm(90),
      minPercentage: 80,
      maxPercentage: 90,
      primaryBenefit:
        "Increases high-speed endurance and delays muscle fatigue",
      perceivedExertion: "Hard effort, short sentences only",
    },
    {
      zoneNumber: 5,
      name: "Anaerobic Capacity / VO2 Max",
      minBpm: calcTargetBpm(90),
      maxBpm: maxHr,
      minPercentage: 90,
      maxPercentage: 100,
      primaryBenefit:
        "Develops maximal power output, sprint speed, and VO2 peak",
      perceivedExertion: "Maximal effort, unsustainable past 1-2 mins",
    },
  ];

  return {
    maxHrTanaka,
    maxHrGellish,
    restingHr,
    heartRateReserve,
    zones,
  };
}

/**
 * Estimates VO2 Max from Resting Heart Rate & Age (Uth-Sørensen-Overgaard-Pedersen estimation)
 * Formula: VO2max = 15.3 * (HRmax / HRrest)
 */
export function estimateVO2Max(ageYears: number, restingHr: number): number {
  if (restingHr <= 30 || ageYears <= 0) return 0;
  const maxHr = 208 - 0.7 * ageYears;
  const vo2Max = 15.3 * (maxHr / restingHr);
  return Math.round(vo2Max * 10) / 10;
}
