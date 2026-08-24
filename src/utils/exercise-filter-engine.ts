/**
 * Exercise Searching, Filtering & Fuzzy Match Engine Utility
 */

export interface ExerciseItem {
  id: string;
  name: string;
  muscles: string; // e.g. "chest, triceps, shoulders"
  equipment: string; // e.g. "barbell", "dumbbell", "bodyweight"
  difficulty?: string;
  mechanics?: string;
}

export interface ExerciseFilterOptions {
  query?: string;
  selectedMuscles?: string[];
  selectedEquipment?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
}

/**
 * Filters and searches exercise lists based on fuzzy search query, equipment, and target muscles
 */
export function filterExercises(
  exercises: ExerciseItem[],
  options: ExerciseFilterOptions,
): ExerciseItem[] {
  const {
    query,
    selectedMuscles = [],
    selectedEquipment = [],
    difficulty,
  } = options;

  const normalizedQuery = query?.trim().toLowerCase() ?? "";

  return exercises.filter((ex) => {
    // 1. Text Search Filter
    if (normalizedQuery) {
      const nameMatch = ex.name.toLowerCase().includes(normalizedQuery);
      const muscleMatch = ex.muscles.toLowerCase().includes(normalizedQuery);
      const equipMatch = ex.equipment.toLowerCase().includes(normalizedQuery);

      if (!nameMatch && !muscleMatch && !equipMatch) {
        return false;
      }
    }

    // 2. Target Muscle Filter
    if (selectedMuscles.length > 0) {
      const exMuscles = ex.muscles.toLowerCase();
      const hasMuscle = selectedMuscles.some((m) =>
        exMuscles.includes(m.toLowerCase()),
      );
      if (!hasMuscle) return false;
    }

    // 3. Equipment Filter
    if (selectedEquipment.length > 0) {
      const exEquip = ex.equipment.toLowerCase();
      const hasEquip = selectedEquipment.some((eq) =>
        exEquip.includes(eq.toLowerCase()),
      );
      if (!hasEquip) return false;
    }

    // 4. Difficulty Filter
    if (difficulty && ex.difficulty) {
      if (ex.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Groups exercise list by main target muscle group for list headers
 */
export function groupExercisesByPrimaryMuscle(
  exercises: ExerciseItem[],
): Record<string, ExerciseItem[]> {
  const grouped: Record<string, ExerciseItem[]> = {};

  for (const ex of exercises) {
    const primaryMuscle =
      ex.muscles.split(",")[0].trim().toUpperCase() || "OTHER";
    if (!grouped[primaryMuscle]) {
      grouped[primaryMuscle] = [];
    }
    grouped[primaryMuscle].push(ex);
  }

  return grouped;
}
