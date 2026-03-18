import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MOOD_CONFIG, MoodType } from "@/types/mood";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle, Moon, Scale, Sparkles } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
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

const bodySleepCheckinKeyForUser = (userId: string) =>
  `@mindcare_body_sleep_checkin:${userId}`;

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const isSameLocalDay = (a: Date, b: Date) => getLocalDateKey(a) === getLocalDateKey(b);

const getNextMidnight = () => {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next;
};

const formatCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
};

export default function HomeScreen() {
  const params = useLocalSearchParams<{ focus?: string; focusToken?: string }>();
  const focusTarget = Array.isArray(params.focus) ? params.focus[0] : params.focus;
  const focusToken = Array.isArray(params.focusToken)
    ? params.focusToken[0]
    : params.focusToken;
  const { getTodayMood, addMoodEntry, addWeightLog, addSleepLog, moodStreak, moodStreakMessage } = useMood();
  const { colors, isDarkMode } = useTheme();
  const { currentUser, updateProfile } = useAuth();
  const todayMood = getTodayMood();
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyWeight, setDailyWeight] = useState<string>("");
  const [dailySleep, setDailySleep] = useState<string>("");
  const [bodySleepError, setBodySleepError] = useState<string | null>(null);
  const [isSavingBodySleep, setIsSavingBodySleep] = useState(false);
  const [bodySleepLastCheckinAt, setBodySleepLastCheckinAt] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState<number>(Date.now());
  const [bodySleepSectionY, setBodySleepSectionY] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadBodySleepCheckin = async () => {
      if (!currentUser?.id) {
        if (!cancelled) {
          setBodySleepLastCheckinAt(null);
        }
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(
          bodySleepCheckinKeyForUser(currentUser.id),
        );

        if (cancelled) {
          return;
        }

        if (!stored) {
          setBodySleepLastCheckinAt(null);
          return;
        }

        const parsed = Number(stored);
        setBodySleepLastCheckinAt(Number.isFinite(parsed) ? parsed : null);
      } catch {
        if (!cancelled) {
          setBodySleepLastCheckinAt(null);
        }
      }
    };

    void loadBodySleepCheckin();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const hasBodySleepCheckedToday =
    bodySleepLastCheckinAt != null
      ? isSameLocalDay(new Date(bodySleepLastCheckinAt), new Date(countdownNow))
      : false;

  const nextBodySleepEntryAt = hasBodySleepCheckedToday
    ? getNextMidnight()
    : null;

  const nextBodySleepEntryInMs = nextBodySleepEntryAt
    ? nextBodySleepEntryAt.getTime() - countdownNow
    : null;

  const nextBodySleepEntryLabel = nextBodySleepEntryAt
    ? nextBodySleepEntryAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const nextBodySleepCountdownLabel =
    nextBodySleepEntryInMs != null
      ? formatCountdown(nextBodySleepEntryInMs)
      : null;

  useEffect(() => {
    if (!hasBodySleepCheckedToday) {
      return;
    }

    const timer = setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [hasBodySleepCheckedToday]);

  useEffect(() => {
    if (focusTarget !== "body-sleep" || bodySleepSectionY == null) {
      return;
    }

    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, bodySleepSectionY - 16),
        animated: true,
      });
    }, 80);

    return () => {
      clearTimeout(timeout);
    };
  }, [focusTarget, focusToken, bodySleepSectionY]);

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

  const handleSaveBodySleep = async () => {
    if (hasBodySleepCheckedToday) {
      setBodySleepError(
        nextBodySleepEntryLabel
          ? `Body & Sleep check-in already completed today. Next entry at ${nextBodySleepEntryLabel}.`
          : "Body & Sleep check-in already completed today.",
      );
      return;
    }

    const trimmedWeight = dailyWeight.trim();
    const trimmedSleep = dailySleep.trim();
    const parsedWeight = Number(dailyWeight);
    const parsedSleep = Number(dailySleep);

    if (!trimmedWeight && !trimmedSleep) {
      setBodySleepError("Please enter weight or sleep hours.");
      return;
    }

    if (
      trimmedWeight &&
      (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || parsedWeight > 500)
    ) {
      setBodySleepError("Please enter a valid weight (1-500 kg).");
      return;
    }

    if (
      trimmedSleep &&
      (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24)
    ) {
      setBodySleepError("Please enter valid sleeping hours (0-24).");
      return;
    }

    setBodySleepError(null);
    setIsSavingBodySleep(true);

    try {
      const profileUpdates: {
        weight?: number;
        sleepingHours?: number;
      } = {};

      if (trimmedWeight) {
        profileUpdates.weight = parsedWeight;
      }

      if (trimmedSleep) {
        profileUpdates.sleepingHours = parsedSleep;
      }

      await updateProfile(profileUpdates);

      if (trimmedWeight) {
        try {
          await addWeightLog(parsedWeight);
        } catch {}
      }

      if (trimmedSleep) {
        try {
          await addSleepLog(parsedSleep);
        } catch {}
      }

      const checkinTimestamp = Date.now();
      setBodySleepLastCheckinAt(checkinTimestamp);

      if (currentUser?.id) {
        try {
          await AsyncStorage.setItem(
            bodySleepCheckinKeyForUser(currentUser.id),
            String(checkinTimestamp),
          );
        } catch {}
      }

      setDailyWeight("");
      setDailySleep("");
    } catch (e) {
      setBodySleepError(
        e instanceof Error ? e.message : "Failed to save body & sleep.",
      );
    } finally {
      setIsSavingBodySleep(false);
    }
  };

  const stressColor =
    stressLevel <= 3
      ? colors.success
      : stressLevel <= 6
        ? colors.warning
        : colors.danger;

  const cardStyle = {
    backgroundColor: colors.card,
    ...(isDarkMode
      ? { borderColor: colors.border, borderWidth: 1 }
      : {}),
  };

  const cardShadow = isDarkMode
    ? {}
    : {
        shadowColor: "#6C63FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      };

  const gradientPrimary: [string, string, ...string[]] =
    Array.isArray(colors.gradient.primary) &&
    colors.gradient.primary.length >= 2
      ? (colors.gradient.primary as [string, string, ...string[]])
      : ["#6C63FF", "#8B5CF6"];

  const gradientAccent: [string, string, ...string[]] =
    Array.isArray(colors.gradient.accent) &&
    colors.gradient.accent.length >= 2
      ? (colors.gradient.accent as [string, string, ...string[]])
      : ["#00D2FF", "#7B68EE"];

  const gradientButton: [string, string, ...string[]] =
    Array.isArray(colors.gradient.button) &&
    colors.gradient.button.length >= 2
      ? (colors.gradient.button as [string, string, ...string[]])
      : ["#6C63FF", "#8B5CF6"];

  const moodCardWidth = (width - 40 - 12 * 4) / 5;

  return (
    <ScreenLayout gradientKey="home">
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome Banner ── */}
        <LinearGradient
          colors={gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeBanner}
        >
          <View style={styles.welcomeBannerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeDate}>{today}</Text>
              <Text style={styles.welcomeGreeting}>{greeting}</Text>
              <Text style={styles.welcomeSubtitle}>
                How are you feeling today?
              </Text>
            </View>
            <View style={styles.welcomeIconOuter}>
              <View style={styles.welcomeIconInner}>
                <Sparkles color="#FFFFFF" size={28} strokeWidth={2} />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Streak Card ── */}
        <LinearGradient
          colors={gradientAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.streakCard, cardShadow]}
        >
          <View style={styles.streakLeft}>
            <View style={styles.streakNumberRow}>
              <Text style={styles.streakNumber}>{moodStreak}</Text>
              <Text style={styles.streakEmoji}>{"\uD83D\uDD25"}</Text>
            </View>
            <Text style={styles.streakLabel}>
              day{moodStreak !== 1 ? "s" : ""} streak
            </Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakRight}>
            <Text style={styles.streakMessage}>
              {moodStreak > 0 ? moodStreakMessage : "Log a mood today to start!"}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Today's Check-in Completed Card ── */}
        {todayMood && (
          <View
            style={[
              styles.completedCard,
              cardStyle,
              cardShadow,
              { borderLeftWidth: 4, borderLeftColor: colors.success },
            ]}
          >
            <View style={styles.completedHeader}>
              <View
                style={[
                  styles.completedIconWrap,
                  { backgroundColor: colors.successLight },
                ]}
              >
                <CheckCircle color={colors.success} size={22} />
              </View>
              <View style={styles.completedHeaderText}>
                <Text style={[styles.completedTitle, { color: colors.text }]}>
                  Today's check-in
                </Text>
                <View
                  style={[
                    styles.completedBadge,
                    { backgroundColor: colors.successLight },
                  ]}
                >
                  <Text
                    style={[styles.completedBadgeText, { color: colors.success }]}
                  >
                    Completed
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.todayMoodDisplay,
                {
                  backgroundColor: isDarkMode
                    ? colors.surface
                    : `${MOOD_CONFIG[todayMood.mood].color}12`,
                },
              ]}
            >
              <Text style={styles.todayMoodEmoji}>
                {MOOD_CONFIG[todayMood.mood].emoji}
              </Text>
              <View
                style={[
                  styles.todayMoodPill,
                  {
                    backgroundColor: `${MOOD_CONFIG[todayMood.mood].color}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.todayMoodLabel,
                    { color: MOOD_CONFIG[todayMood.mood].color },
                  ]}
                >
                  Feeling {MOOD_CONFIG[todayMood.mood].label.toLowerCase()}
                </Text>
              </View>
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
                { color: colors.textMuted },
              ]}
            >
              You can log another mood anytime below.
            </Text>
          </View>
        )}

        {/* ── Mood Selector ── */}
        <View style={[styles.card, cardStyle, cardShadow]}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            CHECK IN
          </Text>
          <View style={styles.moodGrid}>
            {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mood) => {
              const config = MOOD_CONFIG[mood];
              const isSelected = selectedMood === mood;
              return (
                <TouchableOpacity
                  key={mood}
                  activeOpacity={0.7}
                  onPress={() => handleMoodSelect(mood)}
                  style={{ width: moodCardWidth }}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.moodCard,
                        { transform: [{ scale: 1.05 }] },
                      ]}
                    >
                      <Text style={styles.moodEmoji}>{config.emoji}</Text>
                      <Text style={[styles.moodLabel, { color: "#FFFFFF" }]}>
                        {config.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.moodCard,
                        {
                          backgroundColor: isDarkMode
                            ? colors.surface
                            : colors.card,
                        },
                        isDarkMode
                          ? { borderColor: colors.border, borderWidth: 1 }
                          : {
                              shadowColor: "#6C63FF",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.05,
                              shadowRadius: 8,
                              elevation: 2,
                            },
                      ]}
                    >
                      <Text style={styles.moodEmoji}>{config.emoji}</Text>
                      <Text
                        style={[
                          styles.moodLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Stress Level ── */}
        {selectedMood && (
          <View style={[styles.card, cardStyle, cardShadow]}>
            <View style={styles.stressHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                STRESS LEVEL
              </Text>
              <View
                style={[
                  styles.stressBadge,
                  { backgroundColor: stressColor + "18" },
                ]}
              >
                <Text
                  style={[styles.stressBadgeText, { color: stressColor }]}
                >
                  {stressLevel}/10
                </Text>
              </View>
            </View>

            <View style={styles.stressCirclesRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                const isActive = stressLevel === level;
                const circleSize = (width - 40 - 48 - 9 * 8) / 10;
                return isActive ? (
                  <TouchableOpacity
                    key={level}
                    activeOpacity={0.7}
                    onPress={() => setStressLevel(level)}
                    style={[
                      styles.stressCircleWrap,
                      { width: circleSize, height: circleSize },
                    ]}
                  >
                    <LinearGradient
                      colors={gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.stressCircle,
                        { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
                      ]}
                    >
                      <Text style={styles.stressCircleTextActive}>
                        {level}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={level}
                    activeOpacity={0.7}
                    onPress={() => setStressLevel(level)}
                    style={[
                      styles.stressCircleInactive,
                      {
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize / 2,
                        backgroundColor: isDarkMode
                          ? colors.surface
                          : colors.borderLight,
                      },
                      isDarkMode
                        ? { borderColor: colors.border, borderWidth: 1 }
                        : {},
                    ]}
                  >
                    <Text
                      style={[
                        styles.stressCircleText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Visual stress bar */}
            <View style={styles.stressBarWrap}>
              <View
                style={[
                  styles.stressBarBg,
                  {
                    backgroundColor: isDarkMode
                      ? colors.surface
                      : colors.borderLight,
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    stressLevel <= 3
                      ? ([colors.success, "#6EE7B7"] as [string, string])
                      : stressLevel <= 6
                        ? ([colors.warning, "#FFD166"] as [string, string])
                        : ([colors.danger, "#FF8E8E"] as [string, string])
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.stressBarFill,
                    { width: `${stressLevel * 10}%` as `${number}%` },
                  ]}
                />
              </View>
              <View style={styles.stressBarLabels}>
                <Text
                  style={[styles.stressBarLabel, { color: colors.textMuted }]}
                >
                  Low
                </Text>
                <Text
                  style={[styles.stressBarLabel, { color: colors.textMuted }]}
                >
                  High
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Activities ── */}
        {selectedMood && (
          <View style={[styles.card, cardStyle, cardShadow]}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>
              ACTIVITIES
            </Text>
            <View style={styles.activityGrid}>
              {ACTIVITIES.map((activity) => {
                const isSelected = selectedActivities.includes(activity);
                return (
                  <TouchableOpacity
                    key={activity}
                    activeOpacity={0.7}
                    onPress={() => toggleActivity(activity)}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={gradientPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activityPill}
                      >
                        <Text style={styles.activityTextSelected}>
                          {activity}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.activityPill,
                          {
                            backgroundColor: isDarkMode
                              ? colors.surface
                              : colors.borderLight,
                          },
                          isDarkMode
                            ? { borderColor: colors.border, borderWidth: 1 }
                            : {},
                        ]}
                      >
                        <Text
                          style={[
                            styles.activityText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {activity}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Note Input ── */}
        {selectedMood && (
          <View style={[styles.card, cardStyle, cardShadow]}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>
              QUICK NOTE
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: isDarkMode
                    ? colors.surface
                    : colors.borderLight,
                  color: colors.text,
                },
                isDarkMode
                  ? { borderColor: colors.border, borderWidth: 1 }
                  : {},
              ]}
              placeholder="What's on your mind today..."
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* ── Daily Weight & Sleep ── */}
        <View
          style={[styles.card, cardStyle, cardShadow]}
          onLayout={(event) => setBodySleepSectionY(event.nativeEvent.layout.y)}
        >
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            BODY & SLEEP
          </Text>
          {hasBodySleepCheckedToday ? (
            <View
              style={[
                styles.bodyCheckinDoneBox,
                {
                  backgroundColor: isDarkMode
                    ? colors.surface
                    : colors.borderLight,
                },
              ]}
            >
              <Text style={[styles.bodyCheckinDoneTitle, { color: colors.success }]}>
                Checked in for today
              </Text>
              {nextBodySleepEntryLabel && (
                <Text
                  style={[styles.bodyCheckinDoneTime, { color: colors.textMuted }]}
                >
                  Next entry at {nextBodySleepEntryLabel}
                </Text>
              )}
              {nextBodySleepCountdownLabel && (
                <Text
                  style={[
                    styles.bodyCheckinDoneCountdown,
                    { color: colors.textMuted },
                  ]}
                >
                  Next entry in {nextBodySleepCountdownLabel}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.bodySubtext, { color: colors.textMuted }]}>
              Optional — helps generate better wellness insights
            </Text>
          )}
          <View style={styles.bodyRow}>
            <View style={styles.bodyInputCol}>
              <View style={styles.bodyLabelRow}>
                <Scale color={colors.primary} size={14} />
                <Text
                  style={[styles.bodyLabel, { color: colors.textSecondary }]}
                >
                  Weight (kg)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.bodyInput,
                  hasBodySleepCheckedToday && styles.bodyInputDisabled,
                  {
                    backgroundColor: isDarkMode
                      ? colors.surface
                      : colors.borderLight,
                    color: colors.text,
                  },
                  isDarkMode
                    ? { borderColor: colors.border, borderWidth: 1 }
                    : {},
                ]}
                placeholder={currentUser?.weight ? `${currentUser.weight}` : "e.g. 70"}
                placeholderTextColor={colors.textMuted}
                value={dailyWeight}
                onChangeText={setDailyWeight}
                keyboardType="numeric"
                editable={!hasBodySleepCheckedToday}
              />
            </View>
            <View style={styles.bodyInputCol}>
              <View style={styles.bodyLabelRow}>
                <Moon color="#8B5CF6" size={14} />
                <Text
                  style={[styles.bodyLabel, { color: colors.textSecondary }]}
                >
                  Sleep (hrs)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.bodyInput,
                  hasBodySleepCheckedToday && styles.bodyInputDisabled,
                  {
                    backgroundColor: isDarkMode
                      ? colors.surface
                      : colors.borderLight,
                    color: colors.text,
                  },
                  isDarkMode
                    ? { borderColor: colors.border, borderWidth: 1 }
                    : {},
                ]}
                placeholder={currentUser?.sleepingHours ? `${currentUser.sleepingHours}` : "e.g. 7"}
                placeholderTextColor={colors.textMuted}
                value={dailySleep}
                onChangeText={setDailySleep}
                keyboardType="numeric"
                editable={!hasBodySleepCheckedToday}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.bodySaveButtonWrap}
            onPress={handleSaveBodySleep}
            disabled={isSavingBodySleep || hasBodySleepCheckedToday}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.bodySaveGradient,
                (isSavingBodySleep || hasBodySleepCheckedToday) && styles.submitDisabled,
              ]}
            >
              <Text style={styles.bodySaveText}>
                {hasBodySleepCheckedToday
                  ? "Checked in for today"
                  : isSavingBodySleep
                    ? "Saving..."
                    : "Save Body & Sleep"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {bodySleepError && (
            <Text style={[styles.bodyErrorText, { color: colors.danger }]}>
              {bodySleepError}
            </Text>
          )}
        </View>

        {/* ── Submit Error ── */}
        {submitError && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: colors.dangerLight },
            ]}
          >
            <Text style={[styles.submitError, { color: colors.danger }]}>
              {submitError}
            </Text>
          </View>
        )}

        {/* ── Check-In Button ── */}
        {selectedMood && (
          <TouchableOpacity
            style={styles.submitButtonWrap}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.submitGradient,
                (isSubmitting || !selectedMood) && styles.submitDisabled,
              ]}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? "Saving..." : "Check In"}
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
    paddingBottom: 120,
    gap: 18,
  },

  /* ── Welcome Banner ── */
  welcomeBanner: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  welcomeBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingVertical: 28,
  },
  welcomeDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  welcomeGreeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  welcomeIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  welcomeIconInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Streak Card ── */
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#00D2FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  streakLeft: {
    alignItems: "center",
    paddingRight: 20,
  },
  streakNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakNumber: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  streakEmoji: {
    fontSize: 26,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginRight: 20,
  },
  streakRight: {
    flex: 1,
  },
  streakMessage: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },

  /* ── Completed Card ── */
  completedCard: {
    borderRadius: 24,
    padding: 22,
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  completedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  completedHeaderText: {
    marginLeft: 12,
    gap: 5,
  },
  completedTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  completedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  todayMoodDisplay: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  todayMoodEmoji: {
    fontSize: 38,
  },
  todayMoodPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 50,
  },
  todayMoodLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  todayNote: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 14,
    paddingHorizontal: 4,
    lineHeight: 21,
  },
  encouragementText: {
    fontSize: 12,
    marginTop: 10,
    fontWeight: "500",
  },

  /* ── Generic Card ── */
  card: {
    borderRadius: 24,
    padding: 22,
  },

  /* ── Section Label ── */
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 16,
    textTransform: "uppercase",
  },

  /* ── Mood Grid ── */
  moodGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  moodCard: {
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  /* ── Stress Level ── */
  stressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stressBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stressCirclesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  stressCircleWrap: {
    borderRadius: 100,
    overflow: "hidden",
  },
  stressCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  stressCircleTextActive: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stressCircleInactive: {
    alignItems: "center",
    justifyContent: "center",
  },
  stressCircleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  stressBarWrap: {
    marginTop: 18,
  },
  stressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  stressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  stressBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  stressBarLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  /* ── Activities ── */
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  activityPill: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 50,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activityTextSelected: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* ── Note Input ── */
  noteInput: {
    borderRadius: 16,
    padding: 18,
    fontSize: 15,
    textAlignVertical: "top",
    minHeight: 100,
    lineHeight: 22,
  },

  /* ── Body & Sleep ── */
  bodySubtext: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: -8,
    marginBottom: 14,
  },
  bodyCheckinDoneBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: -8,
    marginBottom: 14,
    gap: 2,
  },
  bodyCheckinDoneTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  bodyCheckinDoneTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  bodyCheckinDoneCountdown: {
    fontSize: 12,
    fontWeight: "600",
  },
  bodyRow: {
    flexDirection: "row",
    gap: 12,
  },
  bodyInputCol: {
    flex: 1,
    gap: 8,
  },
  bodyLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bodyLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  bodyInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "500",
  },
  bodyInputDisabled: {
    opacity: 0.7,
  },
  bodySaveButtonWrap: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 14,
  },
  bodySaveGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  bodySaveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  bodyErrorText: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 10,
  },

  /* ── Submit ── */
  errorContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  submitError: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButtonWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 16,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
