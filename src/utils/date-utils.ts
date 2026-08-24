/**
 * Advanced Fitness Date Range & Workout Calendar Utility
 */

export interface CalendarDayInfo {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isCompleted: boolean;
}

/**
 * Returns an array of Date objects for the current week starting on Monday
 */
export function getCurrentWeekDays(
  referenceDate: Date = new Date(),
  completedDates: Date[] = [],
): CalendarDayInfo[] {
  const curr = new Date(referenceDate);
  const dayOfWeek = curr.getDay(); // 0 = Sun, 1 = Mon ...
  const distanceToMon = (dayOfWeek + 6) % 7;

  const monday = new Date(curr);
  monday.setDate(curr.getDate() - distanceToMon);
  monday.setHours(0, 0, 0, 0);

  const weekDays: CalendarDayInfo[] = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayStr = new Date().toDateString();

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);

    const isCompleted = completedDates.some(
      (cd) => new Date(cd).toDateString() === day.toDateString(),
    );

    weekDays.push({
      date: day,
      dayName: dayNames[i],
      dayNumber: day.getDate(),
      isToday: day.toDateString() === todayStr,
      isCompleted,
    });
  }

  return weekDays;
}

/**
 * Groups workout session objects by YYYY-MM month string key
 */
export function groupSessionsByMonth<T extends { completedAt: string | Date }>(
  sessions: T[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  for (const session of sessions) {
    const d = new Date(session.completedAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(session);
  }

  return grouped;
}

/**
 * Calculates current consecutive workout streak in days
 */
export function calculateCurrentStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  const sortedTimeStamps = [
    ...new Set(
      completedDates.map((d) => {
        const day = new Date(d);
        day.setHours(0, 0, 0, 0);
        return day.getTime();
      }),
    ),
  ].sort((a, b) => b - a); // descending

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayTime = yesterday.getTime();

  let streak = 0;
  let expectedTime = sortedTimeStamps.includes(todayTime)
    ? todayTime
    : yesterdayTime;

  for (const time of sortedTimeStamps) {
    if (time === expectedTime) {
      streak++;
      expectedTime -= 24 * 60 * 60 * 1000;
    } else if (time < expectedTime) {
      break;
    }
  }

  return streak;
}
