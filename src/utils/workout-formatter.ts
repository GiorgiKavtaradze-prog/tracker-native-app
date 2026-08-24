/**
 * Advanced Workout Unit & Text Formatting Utility
 * Converts weights, reps, tempo notation, pace, and volumes into clean UI strings.
 */

export type WeightUnit = "kg" | "lbs";

/**
 * Converts weight between kg and lbs
 */
export function convertWeight(
  weight: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  if (from === to) return weight;
  if (from === "kg" && to === "lbs") {
    return Math.round(weight * 2.20462 * 10) / 10;
  }
  return Math.round((weight / 2.20462) * 10) / 10;
}

/**
 * Formats weight with unit label (e.g. "80.5 kg" or "177.5 lbs")
 */
export function formatWeight(
  weightKg: number,
  targetUnit: WeightUnit = "kg",
  showUnit: boolean = true,
): string {
  const converted = convertWeight(weightKg, "kg", targetUnit);
  const formattedNum =
    converted % 1 === 0 ? converted.toFixed(0) : converted.toFixed(1);
  return showUnit ? `${formattedNum} ${targetUnit}` : formattedNum;
}

/**
 * Formats lifting tempo notation (e.g. 3-1-1-0 -> "3s down, 1s pause, 1s up, 0s top")
 */
export function formatTempo(
  eccentricSeconds: number = 3,
  pauseBottomSeconds: number = 1,
  concentricSeconds: number = 1,
  pauseTopSeconds: number = 0,
): { notation: string; description: string } {
  const notation = `${eccentricSeconds}-${pauseBottomSeconds}-${concentricSeconds}-${pauseTopSeconds}`;
  const description = `${eccentricSeconds}s eccentric, ${pauseBottomSeconds}s pause, ${concentricSeconds}s concentric, ${pauseTopSeconds}s hold`;
  return { notation, description };
}

/**
 * Formats total volume into compact readable string (e.g. 15400 kg -> "15.4t" or "15,400 kg")
 */
export function formatCompactVolume(
  volumeKg: number,
  unit: WeightUnit = "kg",
): string {
  const converted = convertWeight(volumeKg, "kg", unit);
  if (converted >= 1000) {
    return `${(converted / 1000).toFixed(1)}k ${unit}`;
  }
  return `${Math.round(converted).toLocaleString()} ${unit}`;
}

/**
 * Formats running / cardio pace (seconds per km into "5:30 /km")
 */
export function formatCardioPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0) return "--:-- /km";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${paddedSecs} /km`;
}
