import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MOOD_CONFIG, MoodType } from "@/types/mood";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const ACTIVITIES = [
  "Work",
  "Exercise",
  "Social",
  "Sleep",
  "Meditation",
  "Hobbies",
  "Family",
];

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { getTodayMood, addMoodEntry, moodStreak, moodStreakMessage } = useMood();
  const { colors, isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const todayMood = getTodayMood();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentHour = new Date().getHours();
  // include user name if available
  const baseGreeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
        ? "Good Afternoon"
        : "Good Evening";
  const name = currentUser?.name?.trim();
  const greeting = name ? `${baseGreeting}, ${name}` : baseGreeting;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
  };

  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await addMoodEntry({
        date: new Date().toISOString().split("T")[0],
        mood: selectedMood,
        stressLevel,
        note: note || undefined,
        activities:
          selectedActivities.length > 0 ? selectedActivities : undefined,
      });
      setSelectedMood(null);
      setStressLevel(5);
      setNote("");
      setSelectedActivities([]);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save mood.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <ScreenLayout gradientKey="home">
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {greeting}
              </Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {today}
              </Text>
            </View>

        <View
          style={[
            styles.streakCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakTextWrap}>
            <Text style={[styles.streakCount, { color: colors.text }]}>
              {moodStreak} Day{moodStreak !== 1 ? "s" : ""} Streak
            </Text>
            <Text style={[styles.streakMessage, { color: colors.textSecondary }]}>
              {moodStreak > 0 ? moodStreakMessage : "Log a mood today to start!"}
            </Text>
          </View>
        </View>

        {todayMood && (
            <View
              style={[
                styles.completedCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <CheckCircle color={colors.success} size={40} />
              <Text style={[styles.completedTitle, { color: colors.text }]}>
                Your latest check-in today
              </Text>
              <View style={styles.todayMoodDisplay}>
                <Text style={styles.todayMoodEmoji}>
                  {MOOD_CONFIG[todayMood.mood].emoji}
                </Text>
                <Text
                  style={[
                    styles.todayMoodLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Feeling {MOOD_CONFIG[todayMood.mood].label.toLowerCase()}
                </Text>
              </View>
              {todayMood.note && (
                <Text
                  style={[styles.todayNote, { color: colors.textSecondary }]}
                >
                  &quot;{todayMood.note}&quot;
                </Text>
              )}
              <Text
                style={[
                  styles.encouragementText,
                  { color: colors.textSecondary },
                  { marginTop: 12, fontSize: 14 },
                ]}
              >
                You can log another mood anytime below.
              </Text>
            </View>
        )}

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              How are you feeling today?
            </Text>
            <View style={styles.moodGrid}>
              {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mood) => {
                const config = MOOD_CONFIG[mood];
                const isSelected = selectedMood === mood;
                return (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodButton,
                      {
                        backgroundColor: isDarkMode
                          ? isSelected
                            ? config.color + "30"
                            : colors.background
                          : isSelected
                            ? config.color + "20"
                            : "#F9FAFB",
                        borderColor: isSelected ? config.color : colors.border,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => handleMoodSelect(mood)}
                  >
                    <Text
                      style={[
                        styles.moodEmoji,
                        { color: isSelected ? config.color : colors.text },
                      ]}
                    >
                      {config.emoji}
                    </Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        {
                          color: isSelected
                            ? config.color
                            : colors.textSecondary,
                        },
                        isSelected && { fontWeight: "700" as const },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {selectedMood && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Stress Level
              </Text>
              <View style={styles.stressContainer}>
                <View
                  style={[
                    styles.stressBar,
                    {
                      backgroundColor: isDarkMode
                        ? colors.background
                        : "#E5E7EB",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.stressBarFill,
                      {
                        width: `${(stressLevel / 10) * 100}%`,
                        backgroundColor:
                          stressLevel <= 3
                            ? colors.success
                            : stressLevel <= 6
                              ? colors.warning
                              : colors.danger,
                      },
                    ]}
                  />
                </View>
                <View style={styles.stressButtons}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.stressButton,
                        {
                          backgroundColor: isDarkMode
                            ? stressLevel === level
                              ? colors.primary
                              : colors.background
                            : stressLevel === level
                              ? colors.primary
                              : "#F9FAFB",
                          borderColor:
                            stressLevel === level
                              ? colors.primary
                              : colors.border,
                        },
                        stressLevel === level && styles.stressButtonActive,
                      ]}
                      onPress={() => setStressLevel(level)}
                    >
                      <Text
                        style={[
                          styles.stressButtonText,
                          {
                            color:
                              stressLevel === level
                                ? isDarkMode
                                  ? "#FFFFFF"
                                  : "#FFFFFF"
                                : colors.textSecondary,
                          },
                          stressLevel === level &&
                            styles.stressButtonTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {selectedMood && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Activities
              </Text>
              <View style={styles.activityGrid}>
                {ACTIVITIES.map((activity) => {
                  const isSelected = selectedActivities.includes(activity);
                  return (
                    <TouchableOpacity
                      key={activity}
                      style={[
                        styles.activityChip,
                        {
                          backgroundColor: isDarkMode
                            ? isSelected
                              ? colors.primary
                              : colors.background
                            : isSelected
                              ? colors.primary
                              : "#F9FAFB",
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                        isSelected && styles.activityChipActive,
                      ]}
                      onPress={() => toggleActivity(activity)}
                    >
                      <Text
                        style={[
                          styles.activityText,
                          {
                            color: isSelected
                              ? "#FFFFFF"
                              : colors.textSecondary,
                          },
                          isSelected && styles.activityTextActive,
                        ]}
                      >
                        {activity}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {selectedMood && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Quick Note (Optional)
              </Text>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: isDarkMode ? colors.background : "#F9FAFB",
                    color: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          {submitError && (
            <Text style={[styles.submitError, { color: colors.danger }]}>
              {submitError}
            </Text>
          )}

          {selectedMood && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={
                  Array.isArray(colors.gradient.primary) &&
                  colors.gradient.primary.length >= 2
                    ? (colors.gradient.primary as [string, string, ...string[]])
                    : ["#7C3AED", "#A78BFA"]
                }
                style={[styles.submitGradient, isSubmitting && styles.submitButtonDisabled]}
              >
                <Text style={styles.submitText}>
                  {isSubmitting ? "Saving…" : "Save Today's Check-in"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  streakTextWrap: {
    flex: 1,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: "700",
  },
  streakMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moodButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: (width - 60) / 5, // Show 5 moods per row on small screens
    margin: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  stressContainer: {
    gap: 16,
  },
  stressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  stressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  stressButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  stressButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  stressButtonActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  stressButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  stressButtonTextActive: {
    color: "#FFFFFF",
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  activityChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  activityTextActive: {
    color: "#FFFFFF",
  },
  noteInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
  submitError: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600" as const,
  },
  completedCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    boxShadow: "0px 4px 12px rgba(124, 58, 237, 0.1)",
    elevation: 4,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    marginTop: 16,
    marginBottom: 20,
  },
  todayMoodDisplay: {
    alignItems: "center",
    gap: 8,
  },
  todayMoodEmoji: {
    fontSize: 64,
  },
  todayMoodLabel: {
    fontSize: 18,
    fontWeight: "500" as const,
  },
  todayNote: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  encouragementCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
  },
  encouragementText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
