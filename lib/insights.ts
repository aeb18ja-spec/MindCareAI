import type { BMICategory } from "@/lib/bmi";
import type { MoodEntry } from "@/types/mood";
import { getMoodScore } from "@/types/mood";

// ─── Types ──────────────────────────────────────────────────

export type WellnessInsight = {
  id: string;
  icon: "sleep" | "bmi" | "activity" | "trend" | "stress" | "tip";
  title: string;
  description: string;
  sentiment: "positive" | "negative" | "neutral";
};

export type InsightInput = {
  moodEntries: MoodEntry[];
  sleepHours: number;
  bmi: number | null;
  bmiCategory: BMICategory | null;
};

// ─── Helpers ────────────────────────────────────────────────

function averageMoodScore(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, e) => acc + getMoodScore(e.mood), 0);
  return sum / entries.length;
}

function averageStress(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, e) => acc + (e.stressLevel ?? 0), 0);
  return sum / entries.length;
}

/**
 * Returns entries from the last N days.
 */
function entriesInLastDays(entries: MoodEntry[], days: number): MoodEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return entries.filter((e) => e.date >= cutoffStr);
}

// ─── Main Insight Generator ─────────────────────────────────

/**
 * Generates wellness insights based on mood entries, sleep, and BMI data.
 * Uses simple statistical correlations (no ML).
 */
export function generateInsights(input: InsightInput): WellnessInsight[] {
  const { moodEntries, sleepHours, bmi, bmiCategory } = input;
  const insights: WellnessInsight[] = [];
  const totalEntries = moodEntries.length;

  if (totalEntries === 0) {
    insights.push({
      id: "no-data",
      icon: "tip",
      title: "Start Tracking",
      description:
        "Log your mood daily to unlock personalized wellness insights. Progress: 0/3 for starter insights, 0/7 for trend insights.",
      sentiment: "neutral",
    });
    return insights;
  }

  const last7 = entriesInLastDays(moodEntries, 7);
  const last14 = entriesInLastDays(moodEntries, 14);

  if (totalEntries < 7) {
    const remainingForTrend = Math.max(0, 7 - totalEntries);
    insights.push({
      id: "tracking-progress",
      icon: "tip",
      title: "Tracking Progress",
      description:
        remainingForTrend > 0
          ? `${totalEntries}/7 mood entries logged. Add ${remainingForTrend} more to unlock weekly trend insights.`
          : "7/7 mood entries logged. Trend insights unlocked.",
      sentiment: "neutral",
    });
  }

  if (totalEntries < 3) {
    const remainingForStarter = Math.max(0, 3 - totalEntries);
    insights.push({
      id: "starter-unlock",
      icon: "tip",
      title: "Building your baseline",
      description: `You\'ve logged ${totalEntries}/3 mood check-ins. Add ${remainingForStarter} more to unlock sleep and stress insights.`,
      sentiment: "neutral",
    });
    return insights;
  }

  // ── 1. Mood Trend (7-day vs previous 7-day) ────────────
  if (totalEntries >= 7 && last14.length >= 4) {
    const recent7Avg = averageMoodScore(last7);
    const older = last14.filter(
      (e) => !last7.some((r) => r.id === e.id)
    );
    if (older.length >= 2) {
      const olderAvg = averageMoodScore(older);
      const diff = recent7Avg - olderAvg;
      if (diff > 0.5) {
        insights.push({
          id: "trend-up",
          icon: "trend",
          title: "Mood Improving! 🎉",
          description: `Your average mood this week (${recent7Avg.toFixed(1)}/5) is higher than the previous week (${olderAvg.toFixed(1)}/5). Keep it up!`,
          sentiment: "positive",
        });
      } else if (diff < -0.5) {
        insights.push({
          id: "trend-down",
          icon: "trend",
          title: "Mood Dipping",
          description: `Your average mood this week (${recent7Avg.toFixed(1)}/5) is lower than the previous week (${olderAvg.toFixed(1)}/5). Be gentle with yourself. 💙`,
          sentiment: "negative",
        });
      } else {
        insights.push({
          id: "trend-stable",
          icon: "trend",
          title: "Stable Mood",
          description: `Your mood has been consistent at around ${recent7Avg.toFixed(1)}/5 this week. Stability is a strength!`,
          sentiment: "neutral",
        });
      }
    }
  }

  // ── 2. Sleep vs Mood Correlation ───────────────────────
  if (totalEntries >= 3 && sleepHours > 0 && last7.length >= 2) {
    const avgMood7 = averageMoodScore(last7);
    if (sleepHours < 6) {
      if (avgMood7 < 3) {
        insights.push({
          id: "sleep-low-mood-low",
          icon: "sleep",
          title: "Sleep May Affect Your Mood",
          description: `You average ${sleepHours} hrs of sleep and your mood has been lower this week (${avgMood7.toFixed(1)}/5). Try getting 7-8 hours tonight! 🌙`,
          sentiment: "negative",
        });
      } else {
        insights.push({
          id: "sleep-low",
          icon: "sleep",
          title: "Consider More Sleep",
          description: `At ${sleepHours} hrs/night, you're below the recommended 7-8 hours. More sleep could help maintain your ${avgMood7.toFixed(1)}/5 mood! 😴`,
          sentiment: "neutral",
        });
      }
    } else if (sleepHours >= 7 && sleepHours <= 9) {
      insights.push({
        id: "sleep-good",
        icon: "sleep",
        title: "Great Sleep Habits! 😊",
        description: `You're getting ${sleepHours} hrs of sleep — right in the sweet spot. This likely contributes to your mood stability.`,
        sentiment: "positive",
      });
    }
  }

  // ── 3. BMI & Mood Correlation ──────────────────────────
  if (totalEntries >= 3 && bmi != null && bmiCategory) {
    if (bmiCategory === "Normal") {
      insights.push({
        id: "bmi-normal",
        icon: "bmi",
        title: "Healthy BMI Range ✅",
        description: `Your BMI of ${bmi} is in the healthy range. Research shows a healthy BMI is associated with better mood and energy levels.`,
        sentiment: "positive",
      });
    } else if (bmiCategory === "Underweight") {
      insights.push({
        id: "bmi-under",
        icon: "bmi",
        title: "BMI Below Healthy Range",
        description: `Your BMI of ${bmi} is below 18.5. Being underweight can affect energy and mood. Consider a nutrient-rich diet. 🥗`,
        sentiment: "neutral",
      });
    } else if (bmiCategory === "Overweight") {
      insights.push({
        id: "bmi-over",
        icon: "bmi",
        title: "BMI Slightly Elevated",
        description: `Your BMI of ${bmi} is slightly above the healthy range (25+). Regular activity and balanced meals can help. 🏃`,
        sentiment: "neutral",
      });
    } else {
      insights.push({
        id: "bmi-obese",
        icon: "bmi",
        title: "BMI Above Healthy Range",
        description: `Your BMI of ${bmi} is above 30. This can impact mood and energy. Consider consulting a healthcare provider for personalized guidance. 🩺`,
        sentiment: "negative",
      });
    }
  }

  // ── 4. Activity vs Mood Correlation ────────────────────
  if (totalEntries >= 7 && last7.length >= 3) {
    const withActivity: Record<string, number[]> = {};
    const withoutActivity: Record<string, number[]> = {};
    const allActivities = new Set<string>();

    last7.forEach((e) => {
      const score = getMoodScore(e.mood);
      const acts = e.activities ?? [];
      acts.forEach((a) => allActivities.add(a));
      allActivities.forEach((activity) => {
        if (acts.includes(activity)) {
          (withActivity[activity] ??= []).push(score);
        } else {
          (withoutActivity[activity] ??= []).push(score);
        }
      });
    });

    for (const activity of allActivities) {
      const withScores = withActivity[activity] ?? [];
      const withoutScores = withoutActivity[activity] ?? [];

      if (withScores.length >= 2 && withoutScores.length >= 1) {
        const avgWith =
          withScores.reduce((a, b) => a + b, 0) / withScores.length;
        const avgWithout =
          withoutScores.reduce((a, b) => a + b, 0) / withoutScores.length;

        if (avgWith - avgWithout > 0.5) {
          insights.push({
            id: `activity-${activity.toLowerCase()}`,
            icon: "activity",
            title: `${activity} Boosts Your Mood! 💪`,
            description: `Your mood averages ${avgWith.toFixed(1)}/5 on days with ${activity} vs ${avgWithout.toFixed(1)}/5 without. Keep it up!`,
            sentiment: "positive",
          });
          break; // Only show top activity insight
        }
      }
    }
  }

  // ── 5. Stress Insight ──────────────────────────────────
  if (totalEntries >= 3 && last7.length >= 3) {
    const avgStress7 = averageStress(last7);
    if (avgStress7 >= 7) {
      insights.push({
        id: "stress-high",
        icon: "stress",
        title: "High Stress Detected",
        description: `Your average stress this week is ${avgStress7.toFixed(1)}/10. Try deep breathing, meditation, or a short walk to decompress. 🧘`,
        sentiment: "negative",
      });
    } else if (avgStress7 <= 3) {
      insights.push({
        id: "stress-low",
        icon: "stress",
        title: "Low Stress — Great! 🌟",
        description: `Your average stress level this week is only ${avgStress7.toFixed(1)}/10. Whatever you're doing is working!`,
        sentiment: "positive",
      });
    }
  }

  // ── 6. Tip if few insights ─────────────────────────────
  if (insights.length < 2) {
    insights.push({
      id: "tip-log-more",
      icon: "tip",
      title: "Pro Tip",
      description:
        "Log mood entries daily with activities and notes for richer, more personalized insights!",
      sentiment: "neutral",
    });
  }

  return insights;
}
