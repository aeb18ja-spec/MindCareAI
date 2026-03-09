import type { MoodEntry } from "@/types/mood";
import { MOOD_CONFIG } from "@/types/mood";

export type ChatUserContext = {
  last7DaysMoods: MoodEntry[];
  stressLevel: number;
  latestJournal: string;
  moodStreak: number;
};

const BASE_SYSTEM_PROMPT = `You are a supportive, empathetic, and human-like mental wellness assistant inside a mood tracking app.

Your main goals are:
- Acknowledge the user's feelings first in every response.
- Use the user's personal data to make replies specific and helpful (last 7 days of moods, current stress levels, latest journal entries, mood streaks).
- Suggest simple coping strategies when appropriate, such as breathing exercises, short walks, journaling, or mindfulness techniques.
- Celebrate progress and motivate the user in a warm, encouraging way.
- Always respond in a caring, friendly, and human-like tone.
- Use gentle emojis to add emotional warmth when appropriate.
- Never give medical diagnoses or act as a professional therapist.
- Respond naturally and conversationally, like a real-life wellness coach.
- Tailor your tone based on the user's current emotional state:
  - If stress is high → show empathy and support
  - If mood is low → acknowledge feelings and offer encouragement
  - If mood is improving → celebrate and motivate
  - If mood is happy → reinforce positive feelings
- Reference the user's mood history, stress trends, journal entries, or streaks in your replies to make them personalized.
- Optionally ask gentle, supportive questions to continue the conversation when appropriate.`;

function formatLast7Moods(entries: MoodEntry[]): string {
  if (entries.length === 0) return "No mood entries in the last 7 days.";
  const lines = entries.slice(0, 7).map((e) => {
    const label = MOOD_CONFIG[e.mood]?.label ?? e.mood;
    const date = e.date;
    const stress = e.stressLevel != null ? `, stress ${e.stressLevel}/10` : "";
    const note = e.note ? ` — "${e.note.slice(0, 80)}${e.note.length > 80 ? "…" : ""}"` : "";
    return `- ${date}: ${label}${stress}${note}`;
  });
  return lines.join("\n");
}

/**
 * Builds the full system prompt for the wellness chat, including current user context.
 */
export function buildWellnessSystemPrompt(context: ChatUserContext): string {
  const moodBlock = formatLast7Moods(context.last7DaysMoods);
  const journalBlock =
    context.latestJournal.trim().length > 0
      ? context.latestJournal.slice(0, 500) + (context.latestJournal.length > 500 ? "…" : "")
      : "No recent journal entry.";

  const contextSection = `
User context (use this to personalize your reply):
- Last 7 days moods:
${moodBlock}
- Stress level: ${context.stressLevel}/10
- Latest journal entry: "${journalBlock}"
- Mood streak: ${context.moodStreak} day(s)
`;

  return BASE_SYSTEM_PROMPT + "\n" + contextSection;
}
