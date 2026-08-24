/**
 * AI Audio & Voice Workout Coach Cue Generator Service
 * Generates structured speech cues for countdowns, set transitions, and motivational audio prompts.
 */

export interface VoiceCue {
  id: string;
  triggerSecondsRemaining?: number;
  textToSpeech: string;
  category:
    | "countdown"
    | "motivation"
    | "set_start"
    | "rest_warning"
    | "pr_celebration";
  priority: "high" | "medium" | "low";
}

export interface WorkoutVoiceSession {
  workoutName: string;
  currentExerciseName: string;
  setIndex: number;
  totalSets: number;
  restDurationSeconds: number;
}

/**
 * Generates real-time audio voice cues during rest periods
 */
export function generateRestTimerVoiceCues(
  session: WorkoutVoiceSession,
): VoiceCue[] {
  const cues: VoiceCue[] = [];
  const { currentExerciseName, setIndex, totalSets, restDurationSeconds } =
    session;

  // 1. Initial Rest Announcement
  cues.push({
    id: "rest_start",
    triggerSecondsRemaining: restDurationSeconds,
    textToSpeech: `Great set! Rest for ${restDurationSeconds} seconds.`,
    category: "rest_warning",
    priority: "medium",
  });

  // 2. Halfway Warning (if rest >= 45s)
  if (restDurationSeconds >= 45) {
    const halfway = Math.floor(restDurationSeconds / 2);
    cues.push({
      id: "halfway",
      triggerSecondsRemaining: halfway,
      textToSpeech: `${halfway} seconds remaining. Shake out your muscles and hydrate.`,
      category: "rest_warning",
      priority: "low",
    });
  }

  // 3. 15-second Get Ready Cue
  if (restDurationSeconds > 15) {
    cues.push({
      id: "prepare_next",
      triggerSecondsRemaining: 15,
      textToSpeech: `15 seconds. Prepare for set ${setIndex + 1} of ${totalSets} on ${currentExerciseName}.`,
      category: "set_start",
      priority: "high",
    });
  }

  // 4. Final 3-2-1 Countdown
  cues.push({
    id: "count_3",
    triggerSecondsRemaining: 3,
    textToSpeech: "Three",
    category: "countdown",
    priority: "high",
  });
  cues.push({
    id: "count_2",
    triggerSecondsRemaining: 2,
    textToSpeech: "Two",
    category: "countdown",
    priority: "high",
  });
  cues.push({
    id: "count_1",
    triggerSecondsRemaining: 1,
    textToSpeech: "One",
    category: "countdown",
    priority: "high",
  });

  // 5. Start Set Cue
  cues.push({
    id: "go",
    triggerSecondsRemaining: 0,
    textToSpeech: `Go! Push set ${setIndex + 1}!`,
    category: "motivation",
    priority: "high",
  });

  return cues;
}

/**
 * Generates PR celebration speech cue
 */
export function generatePRCelebrationCue(
  exerciseName: string,
  weightKg: number,
  reps: number,
): VoiceCue {
  return {
    id: "pr_celebration",
    textToSpeech: `New Personal Record! ${weightKg} kilograms for ${reps} reps on ${exerciseName}! Unbelievable effort!`,
    category: "pr_celebration",
    priority: "high",
  };
}
