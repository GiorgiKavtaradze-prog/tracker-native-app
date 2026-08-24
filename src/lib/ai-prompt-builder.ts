/**
 * Standalone AI Coach Prompt Engineering & Template Builder Module
 * Formats structured LLM prompts for exercise form analysis, workout routine recommendations,
 * and recovery / injury modification strategies.
 */

export interface ExerciseContext {
  name: string;
  muscles: string;
  equipment: string;
  difficulty?: string;
  userNotes?: string;
}

export interface UserFitnessProfile {
  experienceLevel: "beginner" | "intermediate" | "advanced";
  primaryGoal: "strength" | "hypertrophy" | "endurance" | "weight_loss";
  injuriesOrLimitations?: string[];
  availableEquipment?: string[];
}

/**
 * Builds a structured system prompt for AI Form & Execution Coach
 */
export function buildExerciseInstructionsPrompt(exercise: ExerciseContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `You are an elite CSCS-certified strength and conditioning coach and biomechanics expert.
Your mission is to provide concise, actionable, and safe exercise instructions.
Return clear bullet points detailing:
1. Setup & Starting Position
2. Execution Cues (biomechanics, breathwork, path of movement)
3. Common Mistakes to Avoid
4. Safety & Injury Prevention Tips`;

  const userPrompt = `Exercise: ${exercise.name}
Target Muscle Groups: ${exercise.muscles}
Equipment Required: ${exercise.equipment}
Difficulty Level: ${exercise.difficulty ?? "General"}
${exercise.userNotes ? `User Note / Constraint: ${exercise.userNotes}` : ""}`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds prompt for custom AI workout plan generation
 */
export function buildWorkoutGenerationPrompt(
  profile: UserFitnessProfile,
  daysPerWeek: number,
  targetDurationMinutes: number
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an expert fitness programmer specializing in evidence-based periodization.
Generate a structured ${daysPerWeek}-day workout split tailored specifically to the user's goals, experience level, and equipment constraints.
Format the output clearly with warm-ups, main compound movements, accessory work, target set/rep ranges, and rest intervals.`;

  const userPrompt = `User Profile:
- Experience Level: ${profile.experienceLevel}
- Main Goal: ${profile.primaryGoal}
- Training Days: ${daysPerWeek} days/week (${targetDurationMinutes} mins per session)
- Limitations/Injuries: ${profile.injuriesOrLimitations?.join(", ") || "None"}
- Available Equipment: ${profile.availableEquipment?.join(", ") || "Full Gym"}`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds prompt for AI Exercise Substitution / Injury Alternative
 */
export function buildExerciseSubstitutionPrompt(
  originalExercise: string,
  reason: string,
  availableEquipment: string[]
): string {
  return `Suggest 3 effective alternative exercises for "${originalExercise}".
Reason for substitution: ${reason}.
Available equipment: ${availableEquipment.join(", ") || "Full Gym"}.
For each alternative, explain why it works as a replacement and how to adjust the movement.`;
}
