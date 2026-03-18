import { supabase } from "@/lib/supabase";
import type { SleepLog } from "@/types/mood";

type SleepLogRow = {
  id: string;
  user_id: string;
  log_date: string;
  sleep_hours: number;
  note: string | null;
  created_at: string;
};

function rowToSleepLog(row: SleepLogRow): SleepLog {
  return {
    id: row.id,
    sleepHours: row.sleep_hours,
    logDate: row.log_date,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export async function insertSleepLog(sleepHours: number, note?: string): Promise<SleepLog> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("You must be logged in to log sleep.");

  const { data, error } = await supabase
    .from("sleep_logs")
    .insert({
      user_id: user.id,
      sleep_hours: sleepHours,
      log_date: new Date().toISOString().slice(0, 10),
      note: note?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create sleep log.");

  return rowToSleepLog(data as SleepLogRow);
}

export async function fetchSleepLogs(): Promise<SleepLog[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) return [];

  const { data, error } = await supabase
    .from("sleep_logs")
    .select("id, user_id, log_date, sleep_hours, note, created_at")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => rowToSleepLog(row as SleepLogRow));
}
