import { useAuth } from "@/contexts/AuthContext";
import { fetchWeightLogs, insertWeightLog as insertWeightLogApi } from "@/lib/bmi";
import { fetchSleepLogs, insertSleepLog as insertSleepLogApi } from "@/lib/sleep";
import { fetchJournals, insertJournal } from "@/lib/journals";
import {
  deleteMood,
  fetchMoods,
  insertMood,
  updateMood,
} from "@/lib/moods";
import { calculateMoodStreak, getMoodStreakMessage } from "@/lib/streak";
import type { MoodEntry, JournalEntry, SleepLog, WeightLog } from "@/types/mood";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useMemo } from "react";

export const [MoodProvider, useMood] = createContextHook(() => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = currentUser?.id ?? null;

  const moodsQuery = useQuery({
    queryKey: ["moods", userId],
    queryFn: fetchMoods,
    enabled: !!userId,
  });

  const journalQuery = useQuery({
    queryKey: ["journal", userId],
    queryFn: fetchJournals,
    enabled: !!userId,
  });

  const weightLogsQuery = useQuery({
    queryKey: ["weight_logs", userId],
    queryFn: fetchWeightLogs,
    enabled: !!userId,
  });

  const sleepLogsQuery = useQuery({
    queryKey: ["sleep_logs", userId],
    queryFn: fetchSleepLogs,
    enabled: !!userId,
  });

  const moodEntries: MoodEntry[] = moodsQuery.data ?? [];
  const journalEntries: JournalEntry[] = journalQuery.data ?? [];
  const weightLogs: WeightLog[] = weightLogsQuery.data ?? [];
  const sleepLogs: SleepLog[] = sleepLogsQuery.data ?? [];

  const addMoodEntry = useCallback(
    async (entry: Omit<MoodEntry, "id">) => {
      if (!userId) return;
      await insertMood({
        mood: entry.mood,
        note: entry.note,
        stressLevel: entry.stressLevel,
        activities: entry.activities,
        date: entry.date,
      });
      await queryClient.invalidateQueries({ queryKey: ["moods", userId] });
    },
    [userId, queryClient],
  );

  const addJournalEntry = useCallback(
    async (entry: Omit<JournalEntry, "id">) => {
      if (!userId) return;
      await insertJournal({
        title: entry.title,
        content: entry.content,
        emotions: entry.emotions,
        aiInsights: entry.aiInsights,
      });
      await queryClient.invalidateQueries({ queryKey: ["journal", userId] });
    },
    [userId, queryClient],
  );

  /** Returns the most recent mood entry for today (moodEntries are ordered by created_at DESC). */
  const getTodayMood = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return moodEntries.find((e) => e.date === today) ?? null;
  }, [moodEntries]);

  const refetchMoods = useCallback(async () => {
    if (userId) await queryClient.refetchQueries({ queryKey: ["moods", userId] });
  }, [userId, queryClient]);

  const refetchJournal = useCallback(async () => {
    if (userId) await queryClient.refetchQueries({ queryKey: ["journal", userId] });
  }, [userId, queryClient]);

  const updateMoodEntry = useCallback(
    async (id: string, entry: Partial<Omit<MoodEntry, "id" | "createdAt">>) => {
      if (!userId) return;
      await updateMood(id, {
        mood: entry.mood,
        note: entry.note,
        stressLevel: entry.stressLevel,
        activities: entry.activities,
        date: entry.date,
      });
      await queryClient.invalidateQueries({ queryKey: ["moods", userId] });
    },
    [userId, queryClient]
  );

  const deleteMoodEntry = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteMood(id);
      await queryClient.invalidateQueries({ queryKey: ["moods", userId] });
    },
    [userId, queryClient]
  );

  const addWeightLog = useCallback(
    async (weight: number) => {
      if (!userId) return;
      await insertWeightLogApi(weight);
      await queryClient.invalidateQueries({ queryKey: ["weight_logs", userId] });
    },
    [userId, queryClient]
  );

  const refetchWeightLogs = useCallback(async () => {
    if (userId) await queryClient.refetchQueries({ queryKey: ["weight_logs", userId] });
  }, [userId, queryClient]);

  const addSleepLog = useCallback(
    async (sleepHours: number, note?: string) => {
      if (!userId) return;
      await insertSleepLogApi(sleepHours, note);
      await queryClient.invalidateQueries({ queryKey: ["sleep_logs", userId] });
    },
    [userId, queryClient]
  );

  const refetchSleepLogs = useCallback(async () => {
    if (userId) await queryClient.refetchQueries({ queryKey: ["sleep_logs", userId] });
  }, [userId, queryClient]);

  const getMoodById = useCallback(
    (id: string) => moodEntries.find((e) => e.id === id) ?? null,
    [moodEntries]
  );

  const moodStreak = useMemo(
    () => calculateMoodStreak(moodEntries),
    [moodEntries]
  );
  const moodStreakMessage = useMemo(
    () => getMoodStreakMessage(moodStreak),
    [moodStreak]
  );

  return {
    moodEntries,
    journalEntries,
    weightLogs,
    sleepLogs,
    addMoodEntry,
    addJournalEntry,
    addWeightLog,
    addSleepLog,
    updateMoodEntry,
    deleteMoodEntry,
    getMoodById,
    getTodayMood,
    moodStreak,
    moodStreakMessage,
    refetchMoods,
    refetchJournal,
    refetchWeightLogs,
    refetchSleepLogs,
    isLoading:
      moodsQuery.isLoading
      || journalQuery.isLoading
      || weightLogsQuery.isLoading
      || sleepLogsQuery.isLoading,
  };
});
