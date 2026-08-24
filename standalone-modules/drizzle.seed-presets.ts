export interface PresetRoutine {
  id: string;
  name: string;
  category: "Strength" | "Hypertrophy" | "Endurance" | "Full Body";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  description: string;
  exerciseIds: string[];
}

export const WORKOUT_ROUTINE_PRESETS: PresetRoutine[] = [
  {
    id: "preset-ppl-push",
    name: "Push Day (Chest, Shoulders, Triceps)",
    category: "Hypertrophy",
    difficulty: "Intermediate",
    estimatedMinutes: 60,
    description:
      "Focuses on heavy pressing movements targeting chest, anterior deltoids, and triceps.",
    exerciseIds: [
      "barbell-bench-press",
      "incline-dumbbell-press",
      "overhead-barbell-press",
      "cable-tricep-pushdown",
      "lateral-raises",
    ],
  },
  {
    id: "preset-ppl-pull",
    name: "Pull Day (Back, Rear Delts, Biceps)",
    category: "Hypertrophy",
    difficulty: "Intermediate",
    estimatedMinutes: 60,
    description:
      "Complete back width and thickness workout with bicep isolation.",
    exerciseIds: [
      "barbell-deadlift",
      "lat-pulldown",
      "bent-over-barbell-row",
      "face-pulls",
      "barbell-bicep-curl",
    ],
  },
  {
    id: "preset-ppl-legs",
    name: "Leg Day (Quads, Hamstrings, Calves)",
    category: "Hypertrophy",
    difficulty: "Intermediate",
    estimatedMinutes: 65,
    description:
      "High-intensity leg workout covering compound squats, lunges, and calf raises.",
    exerciseIds: [
      "barbell-back-squat",
      "romanian-deadlift",
      "leg-press",
      "walking-lunges",
      "standing-calf-raise",
    ],
  },
  {
    id: "preset-full-body-3day",
    name: "Full Body 3-Day Foundation",
    category: "Strength",
    difficulty: "Beginner",
    estimatedMinutes: 45,
    description:
      "Ideal for beginners or busy individuals targeting all major muscle groups 3x weekly.",
    exerciseIds: [
      "barbell-back-squat",
      "barbell-bench-press",
      "bent-over-barbell-row",
      "overhead-barbell-press",
    ],
  },
];
