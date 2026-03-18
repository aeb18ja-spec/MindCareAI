export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export type MoodEntry = {
  id: string;
  date: string;
  mood: MoodType;
  stressLevel: number;
  note?: string;
  activities?: string[];
  /** ISO timestamp for display (e.g. time in timeline). */
  createdAt?: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  title: string;
  content: string;
  emotions: string[];
  aiInsights?: string;
};

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  great: { emoji: '😄', label: 'Great', color: '#4CAF50' },
  good: { emoji: '🙂', label: 'Good', color: '#8BC34A' },
  okay: { emoji: '😐', label: 'Okay', color: '#FFC107' },
  bad: { emoji: '😔', label: 'Bad', color: '#FF9800' },
  terrible: { emoji: '😢', label: 'Terrible', color: '#F44336' },
};

/** Numeric score for mood (1–5) for trends and averages. */
export function getMoodScore(mood: MoodType): number {
  const scores: Record<MoodType, number> = {
    great: 5,
    good: 4,
    okay: 3,
    bad: 2,
    terrible: 1,
  };
  return scores[mood];
}

export type WeightLog = {
  id: string;
  weight: number;
  logDate: string;
  createdAt?: string;
};

export type SleepLog = {
  id: string;
  sleepHours: number;
  logDate: string;
  note?: string;
  createdAt?: string;
};
