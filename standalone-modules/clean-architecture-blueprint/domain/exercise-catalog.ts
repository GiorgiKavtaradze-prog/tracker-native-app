import { asExerciseId, type ExerciseId } from "../shared/brand";

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "core",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EXERCISE_MODALITIES = ["barbell", "dumbbell", "machine", "cable", "bodyweight"] as const;

export type ExerciseModality = (typeof EXERCISE_MODALITIES)[number];

export interface ExerciseBlueprint {
  readonly id: ExerciseId;
  readonly name: string;
  readonly primary: MuscleGroup;
  readonly secondary: readonly MuscleGroup[];
  readonly modality: ExerciseModality;
}

export const CATALOG_BLUEPRINTS: readonly ExerciseBlueprint[] = [
  {
    id: asExerciseId("ex-back-squat"),
    name: "Back Squat",
    primary: "quads",
    secondary: ["glutes", "core"],
    modality: "barbell",
  },
  {
    id: asExerciseId("ex-bench-press"),
    name: "Bench Press",
    primary: "chest",
    secondary: ["triceps", "shoulders"],
    modality: "barbell",
  },
  {
    id: asExerciseId("ex-deadlift"),
    name: "Deadlift",
    primary: "hamstrings",
    secondary: ["back", "glutes"],
    modality: "barbell",
  },
  {
    id: asExerciseId("ex-pull-up"),
    name: "Pull Up",
    primary: "back",
    secondary: ["biceps"],
    modality: "bodyweight",
  },
  {
    id: asExerciseId("ex-overhead-press"),
    name: "Overhead Press",
    primary: "shoulders",
    secondary: ["triceps"],
    modality: "barbell",
  },
  {
    id: asExerciseId("ex-lat-pulldown"),
    name: "Lat Pulldown",
    primary: "back",
    secondary: ["biceps"],
    modality: "cable",
  },
];

export const isMuscleGroup = (candidate: unknown): candidate is MuscleGroup =>
  typeof candidate === "string" && (MUSCLE_GROUPS as readonly string[]).includes(candidate);

export const isExerciseModality = (candidate: unknown): candidate is ExerciseModality =>
  typeof candidate === "string" && (EXERCISE_MODALITIES as readonly string[]).includes(candidate);