import type { JournalEntry } from "@/types/mood";
import { supabase } from "@/lib/supabase";

export type JournalRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  emotions: string[];
  ai_insights: string | null;
  created_at: string;
};

function rowToJournalEntry(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    date: row.created_at,
    title: row.title,
    content: row.content,
    emotions: row.emotions ?? [],
    aiInsights: row.ai_insights ?? undefined,
  };
}

export type InsertJournalInput = {
  title: string;
  content: string;
  emotions: string[];
  aiInsights?: string | null;
};

/**
 * Inserts a journal entry for the currently logged-in user.
 */
export async function insertJournal(input: InsertJournalInput): Promise<JournalEntry> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("You must be logged in to create a journal entry.");

  const { data, error } = await supabase
    .from("journals")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      content: input.content.trim(),
      emotions: input.emotions ?? [],
      ai_insights: input.aiInsights?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create journal entry.");

  return rowToJournalEntry(data as JournalRow);
}

/**
 * Fetches all journal entries for the currently logged-in user, newest first.
 */
export async function fetchJournals(): Promise<JournalEntry[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) return [];

  const { data, error } = await supabase
    .from("journals")
    .select("id, user_id, title, content, emotions, ai_insights, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToJournalEntry(row as JournalRow));
}
