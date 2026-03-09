import type { MoodEntry } from "@/types/mood";

/**
 * Returns the number of consecutive days (including today or yesterday) the user
 * has logged at least one mood. Uses mood_date (entry.date). If they skip a day, streak resets to 0.
 */
export function calculateMoodStreak(moods: MoodEntry[]): number {
  if (moods.length === 0) return 0;

  const dates = Array.from(
    new Set(moods.map((e) => e.date))
  ).sort((a, b) => b.localeCompare(a));

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const mostRecent = dates[0];

  // Streak can only start from today or yesterday (otherwise they skipped a day)
  let startDate: string;
  if (mostRecent === today) {
    startDate = today;
  } else if (mostRecent === yesterday) {
    startDate = yesterday;
  } else {
    return 0;
  }

  const dateSet = new Set(dates);
  let count = 0;
  let d = new Date(startDate + "T12:00:00");

  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (!dateSet.has(dateStr)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }

  return count;
}

const MILESTONES: { minDays: number; message: string }[] = [
  { minDays: 30, message: "Amazing habit!" },
  { minDays: 7, message: "One week strong!" },
  { minDays: 3, message: "Building consistency!" },
  { minDays: 1, message: "Great start!" },
];

const DEFAULT_MESSAGE = "You're building a great habit!";

/**
 * Returns a short message for the given streak count (for 1, 3, 7, 30 day milestones).
 */
export function getMoodStreakMessage(count: number): string {
  if (count < 1) return "";
  for (const { minDays, message } of MILESTONES) {
    if (count >= minDays) return message;
  }
  return DEFAULT_MESSAGE;
}
