/**
 * Olympic Barbell Weight & Plate Loading Calculator Service
 * Calculates exact weight plates needed per side for any target barbell weight.
 */

export interface PlateCount {
  plateWeightKg: number;
  countPerSide: number;
  colorHex: string;
  label: string;
}

export interface PlateCalculationResult {
  targetWeightKg: number;
  barWeightKg: number;
  actualWeightKg: number;
  platesPerSide: PlateCount[];
  totalPlatesCount: number;
  remainderKg: number;
}

export const STANDARD_PLATES: {
  weight: number;
  color: string;
  label: string;
}[] = [
  { weight: 25, color: "#EF4444", label: "25 kg (Red)" },
  { weight: 20, color: "#3B82F6", label: "20 kg (Blue)" },
  { weight: 15, color: "#EAB308", label: "15 kg (Yellow)" },
  { weight: 10, color: "#22C55E", label: "10 kg (Green)" },
  { weight: 5, color: "#64748B", label: "5 kg (White)" },
  { weight: 2.5, color: "#1E293B", label: "2.5 kg (Black)" },
  { weight: 1.25, color: "#94A3B8", label: "1.25 kg (Micro)" },
  { weight: 0.5, color: "#CBD5E1", label: "0.5 kg (Fractional)" },
];

/**
 * Calculates plates required per side of the barbell
 */
export function calculateBarbellPlates(
  targetWeightKg: number,
  barWeightKg: number = 20,
  availablePlateWeights: number[] = [25, 20, 15, 10, 5, 2.5, 1.25],
): PlateCalculationResult {
  if (targetWeightKg <= barWeightKg) {
    return {
      targetWeightKg,
      barWeightKg,
      actualWeightKg: barWeightKg,
      platesPerSide: [],
      totalPlatesCount: 0,
      remainderKg: 0,
    };
  }

  let remainingWeightPerSide = (targetWeightKg - barWeightKg) / 2;
  const sortedPlates = [...availablePlateWeights].sort((a, b) => b - a);

  const platesPerSide: PlateCount[] = [];
  let totalPlatesCount = 0;

  for (const plateWeight of sortedPlates) {
    if (remainingWeightPerSide >= plateWeight) {
      const count = Math.floor(remainingWeightPerSide / plateWeight);
      remainingWeightPerSide =
        Math.round((remainingWeightPerSide - count * plateWeight) * 100) / 100;

      const meta = STANDARD_PLATES.find((p) => p.weight === plateWeight) ?? {
        color: "#64748B",
        label: `${plateWeight} kg`,
      };

      platesPerSide.push({
        plateWeightKg: plateWeight,
        countPerSide: count,
        colorHex: meta.color,
        label: meta.label,
      });

      totalPlatesCount += count * 2;
    }
  }

  const actualWeightKg = targetWeightKg - remainingWeightPerSide * 2;

  return {
    targetWeightKg,
    barWeightKg,
    actualWeightKg,
    platesPerSide,
    totalPlatesCount,
    remainderKg: remainingWeightPerSide * 2,
  };
}
