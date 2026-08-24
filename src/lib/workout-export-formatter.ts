/**
 * Workout Session Exporter & Social Summary Formatter Module
 * Formats completed workout sessions into Markdown, CSV, and Social Share snippets.
 */

export interface ExportWorkoutSession {
  id: string;
  workoutName: string;
  completedAt: Date;
  durationSeconds: number;
  exercises: {
    name: string;
    sets: { weightKg: number; reps: number; isPersonalRecord?: boolean }[];
  }[];
}

/**
 * Formats a workout session into a GitHub-style Markdown report
 */
export function formatWorkoutToMarkdown(session: ExportWorkoutSession): string {
  const durationMins = Math.round(session.durationSeconds / 60);
  const totalVolume = session.exercises.reduce(
    (total, ex) =>
      total + ex.sets.reduce((sSum, s) => sSum + s.weightKg * s.reps, 0),
    0,
  );
  const totalSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );

  let md = `# 🏋️‍♂️ ${session.workoutName}\n\n`;
  md += `- **Date**: ${session.completedAt.toLocaleDateString()}\n`;
  md += `- **Duration**: ${durationMins} minutes\n`;
  md += `- **Total Volume**: ${totalVolume.toLocaleString()} kg\n`;
  md += `- **Total Sets**: ${totalSets}\n\n`;
  md += `--- \n\n`;

  session.exercises.forEach((ex, idx) => {
    md += `### ${idx + 1}. ${ex.name}\n\n`;
    md += `| Set | Weight (kg) | Reps | Note |\n`;
    md += `|---|---|---|---|\n`;

    ex.sets.forEach((set, sIdx) => {
      const prBadge = set.isPersonalRecord ? "🏆 PR!" : "-";
      md += `| ${sIdx + 1} | ${set.weightKg} | ${set.reps} | ${prBadge} |\n`;
    });

    md += `\n`;
  });

  return md;
}

/**
 * Exports workout session log into CSV standard row format
 */
export function formatWorkoutToCSV(session: ExportWorkoutSession): string {
  let csv = `Date,Workout,Exercise,Set,Weight_kg,Reps,PR\n`;

  const dateStr = session.completedAt.toISOString().split("T")[0];
  const workoutName = `"${session.workoutName.replace(/"/g, '""')}"`;

  session.exercises.forEach((ex) => {
    const exerciseName = `"${ex.name.replace(/"/g, '""')}"`;
    ex.sets.forEach((set, idx) => {
      csv += `${dateStr},${workoutName},${exerciseName},${idx + 1},${set.weightKg},${set.reps},${set.isPersonalRecord ? "YES" : "NO"}\n`;
    });
  });

  return csv;
}

/**
 * Formats session into an emoji-rich Social Media / Fitness App share caption
 */
export function formatWorkoutSocialCaption(
  session: ExportWorkoutSession,
): string {
  const durationMins = Math.round(session.durationSeconds / 60);
  const totalVolume = session.exercises.reduce(
    (total, ex) =>
      total + ex.sets.reduce((sSum, s) => sSum + s.weightKg * s.reps, 0),
    0,
  );

  let caption = `⚡ WORKOUT COMPLETE: ${session.workoutName.toUpperCase()} ⚡\n\n`;
  caption += `⏱️ Duration: ${durationMins} mins\n`;
  caption += `🔥 Volume Lifted: ${totalVolume} kg\n`;
  caption += `💪 Exercises Completed: ${session.exercises.length}\n\n`;

  session.exercises.forEach((ex) => {
    const bestSet = [...ex.sets].sort((a, b) => b.weightKg - a.weightKg)[0];
    if (bestSet) {
      const prTag = ex.sets.some((s) => s.isPersonalRecord) ? " 🏆 PR" : "";
      caption += `• ${ex.name}: Top Set ${bestSet.weightKg}kg × ${bestSet.reps}${prTag}\n`;
    }
  });

  caption += `\n#Fitness #WorkoutTracker #Progress #BuildingStrength`;
  return caption;
}
