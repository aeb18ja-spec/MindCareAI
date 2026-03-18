import { supabase } from "@/lib/supabase";

// ─── BMI Calculation ────────────────────────────────────────

export type BMICategory = "Underweight" | "Normal" | "Overweight" | "Obese";

/**
 * Calculates BMI from weight (kg) and height (cm).
 * Returns null if inputs are invalid.
 */
export function calculateBMI(
  weightKg: number,
  heightCm: number
): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Returns the BMI category string for a given BMI value.
 */
export function getBMICategory(bmi: number | null): BMICategory | null {
  if (bmi == null) return null;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/**
 * Returns a color hex for each BMI category (for UI badges/tags).
 */
export function getBMICategoryColor(category: BMICategory | null): string {
  switch (category) {
    case "Underweight":
      return "#FFB020";
    case "Normal":
      return "#4CAF50";
    case "Overweight":
      return "#FF9800";
    case "Obese":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
}

/**
 * Returns an emoji icon for each BMI category.
 */
export function getBMICategoryEmoji(category: BMICategory | null): string {
  switch (category) {
    case "Underweight":
      return "⚖️";
    case "Normal":
      return "✅";
    case "Overweight":
      return "⚠️";
    case "Obese":
      return "🔴";
    default:
      return "❓";
  }
}

/**
 * Returns a brief description for each BMI category.
 */
export function getBMICategoryDescription(
  category: BMICategory | null
): string {
  switch (category) {
    case "Underweight":
      return "Below the healthy range. Consider a balanced, nutrient-rich diet.";
    case "Normal":
      return "You're in a healthy range. Keep up the great work!";
    case "Overweight":
      return "Slightly above the healthy range. Regular activity can help.";
    case "Obese":
      return "Above the healthy range. Consider consulting a healthcare provider.";
    default:
      return "Complete your profile to see your BMI.";
  }
}

// ─── Weight Log CRUD ────────────────────────────────────────

export type WeightLog = {
  id: string;
  weight: number;
  logDate: string;
  createdAt?: string;
};

type WeightLogRow = {
  id: string;
  user_id: string;
  weight: number;
  log_date: string;
  created_at: string;
};

function rowToWeightLog(row: WeightLogRow): WeightLog {
  return {
    id: row.id,
    weight: row.weight,
    logDate: row.log_date,
    createdAt: row.created_at,
  };
}

/**
 * Inserts a new weight log for the current user.
 * Also updates the user's profile weight so BMI is recalculated.
 */
export async function insertWeightLog(weight: number): Promise<WeightLog> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("You must be logged in to log weight.");

  // Insert weight log
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({
      user_id: user.id,
      weight,
      log_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create weight log.");

  // Also update profile weight (triggers BMI recalculation via DB trigger)
  await supabase.from("profiles").update({ weight }).eq("id", user.id);

  return rowToWeightLog(data as WeightLogRow);
}

/**
 * Fetches all weight logs for the current user, newest first.
 */
export async function fetchWeightLogs(): Promise<WeightLog[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) return [];

  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, user_id, weight, log_date, created_at")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToWeightLog(row as WeightLogRow));
}
