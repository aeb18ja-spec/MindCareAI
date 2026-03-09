import type { MoodEntry, MoodType } from "@/types/mood";
import { supabase } from "@/lib/supabase";

export type MoodRow = {
  id: string;
  user_id: string;
  mood: string;
  note: string | null;
  mood_date: string | null;
  stress_level: number;
  activities: string[] | null;
  created_at: string;
};

function rowToMoodEntry(row: MoodRow): MoodEntry {
  const date = row.mood_date ?? row.created_at.slice(0, 10);
  return {
    id: row.id,
    date,
    mood: row.mood as MoodType,
    stressLevel: row.stress_level ?? 0,
    note: row.note ?? undefined,
    activities: row.activities ?? undefined,
    createdAt: row.created_at,
  };
}

export type InsertMoodInput = {
  mood: string;
  note?: string | null;
  stressLevel?: number;
  activities?: string[];
  date?: string;
};

/**
 * Inserts a new mood record for the currently logged-in user.
 * Uses session from Supabase auth; filters by user_id in DB.
 */
export async function insertMood(input: InsertMoodInput): Promise<MoodEntry> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("You must be logged in to record a mood.");

  const date = input.date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("moods")
    .insert({
      user_id: user.id,
      mood: input.mood.trim(),
      note: input.note?.trim() || null,
      mood_date: date,
      stress_level: input.stressLevel ?? 0,
      activities: input.activities ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create mood record.");

  return rowToMoodEntry(data as MoodRow);
}

/**
 * Fetches all mood records for the currently logged-in user, newest first.
 */
export async function fetchMoods(): Promise<MoodEntry[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) return [];

  const { data, error } = await supabase
    .from("moods")
    .select("id, user_id, mood, note, mood_date, stress_level, activities, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToMoodEntry(row as MoodRow));
}

export type UpdateMoodInput = {
  mood?: string;
  note?: string | null;
  stressLevel?: number;
  activities?: string[];
  date?: string;
};

/**
 * Updates an existing mood record. Only the current user's moods can be updated (RLS).
 */
export async function updateMood(
  id: string,
  input: UpdateMoodInput
): Promise<MoodEntry> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("You must be logged in to update a mood.");

  const payload: Record<string, unknown> = {};
  if (input.mood !== undefined) payload.mood = input.mood.trim();
  if (input.note !== undefined) payload.note = input.note?.trim() || null;
  if (input.stressLevel !== undefined) payload.stress_level = input.stressLevel;
  if (input.activities !== undefined) payload.activities = input.activities;
  if (input.date !== undefined) payload.mood_date = input.date;

  const { data, error } = await supabase
    .from("moods")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to update mood record.");
  return rowToMoodEntry(data as MoodRow);
}

/**
 * Deletes a mood record. Only the current user's moods can be deleted (RLS).
 */
export async function deleteMood(id: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("You must be logged in to delete a mood.");

  const { error } = await supabase
    .from("moods")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
