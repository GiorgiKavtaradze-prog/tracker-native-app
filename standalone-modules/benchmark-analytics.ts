import { calculateAdvanced1RM } from "../src/lib/fitness-analytics";
import { calculateTDEEAndMacros } from "../src/lib/nutrition-calculator";
import { calculateBarbellPlates } from "../src/services/plate-calculator";

function runBenchmark(name: string, iterations: number, fn: () => void) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const totalMs = Math.round((end - start) * 100) / 100;
  const opsPerSec = Math.round(iterations / (totalMs / 1000));

  return { name, iterations, totalMs, opsPerSec };
}

export function main() {
  const results = [];

  // 1. 1RM Math Performance
  results.push(
    runBenchmark("1RM Multi-Formula Calculation", 100_000, () => {
      calculateAdvanced1RM(100, 5);
    }),
  );

  // 2. TDEE & Macro Calculation
  results.push(
    runBenchmark("TDEE & Macro Breakdown", 100_000, () => {
      calculateTDEEAndMacros(80, 180, 25, "male", "active", "muscle_gain");
    }),
  );

  // 3. Barbell Plate Loading Calculation
  results.push(
    runBenchmark("Barbell Plate Loading", 100_000, () => {
      calculateBarbellPlates(142.5, 20);
    }),
  );

  return results;
}

main();
