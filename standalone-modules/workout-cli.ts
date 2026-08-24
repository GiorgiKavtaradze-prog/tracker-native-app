import { calculateAdvanced1RM } from "../src/lib/fitness-analytics";
import { calculateTDEEAndMacros } from "../src/lib/nutrition-calculator";
import { calculateBarbellPlates } from "../src/services/plate-calculator";

function printHelp() {
  return `
🏋️‍♂️ AI Workout Tracker - Standalone Terminal CLI Toolkit
---------------------------------------------------------
Available Commands:
  1rm       Calculate estimated 1-Rep Max and Strength Zones
            Flags: --weight <kg> --reps <count>

  tdee      Calculate Daily Calories & Macro Breakdown
            Flags: --weight <kg> --height <cm> --age <years> --gender <male|female> --activity <sedentary|light|moderate|active|very_active> --goal <fat_loss|maintenance|muscle_gain>

  plates    Calculate Barbell Plate Loading per side
            Flags: --target <kg> --bar <kg>
  `;
}

function parseArgs(): { command: string; flags: Record<string, string> } {
  const args = process.argv.slice(2);
  const command = args[0] ?? "help";
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i += 2) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = args[i + 1] ?? "";
      flags[key] = val;
    }
  }

  return { command, flags };
}

export function main() {
  const { command, flags } = parseArgs();

  switch (command.toLowerCase()) {
    case "1rm": {
      const weight = parseFloat(flags.weight || "100");
      const reps = parseInt(flags.reps || "5", 10);
      return calculateAdvanced1RM(weight, reps);
    }

    case "tdee": {
      const w = parseFloat(flags.weight || "75");
      const h = parseFloat(flags.height || "175");
      const age = parseInt(flags.age || "25", 10);
      const gender = (flags.gender === "female" ? "female" : "male") as
        "male" | "female";
      const act = (flags.activity || "moderate") as any;
      const goal = (flags.goal || "maintenance") as any;

      return calculateTDEEAndMacros(w, h, age, gender, act, goal);
    }

    case "plates": {
      const target = parseFloat(flags.target || "100");
      const bar = parseFloat(flags.bar || "20");
      return calculateBarbellPlates(target, bar);
    }

    default:
      return printHelp();
  }
}

main();
