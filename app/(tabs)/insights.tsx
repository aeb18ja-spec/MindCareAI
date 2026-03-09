import ScreenLayout from "@/components/ScreenLayout";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getMoodScore, MOOD_CONFIG, MoodType } from "@/types/mood";
import {
    Activity,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Calendar,
    Target,
    TrendingUp,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Animated,
    DimensionValue,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
export default function InsightsScreen() {
  const { moodEntries, refetchMoods, moodStreak, moodStreakMessage } = useMood();
  const { colors, isDarkMode } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchMoods();
    setRefreshing(false);
  }, [refetchMoods]);

  const stats = useMemo(() => {
    if (moodEntries.length === 0) {
      return {
        totalEntries: 0,
        averageStress: 0,
        moodDistribution: {} as Record<MoodType, number>,
        weeklyTrend: [],
        mostCommonMood: null as MoodType | null,
        moodTrend: "neutral", // 'up', 'down', 'neutral'
      };
    }

    const moodCounts: Record<MoodType, number> = {
      great: 0,
      good: 0,
      okay: 0,
      bad: 0,
      terrible: 0,
    };

    let totalStress = 0;

    moodEntries.forEach((entry) => {
      moodCounts[entry.mood]++;
      totalStress += entry.stressLevel;
    });

    const mostCommon = (Object.keys(moodCounts) as MoodType[]).reduce((a, b) =>
      moodCounts[a] > moodCounts[b] ? a : b,
    );

    const last7Days = moodEntries.slice(0, 7).reverse();

    // Calculate mood trend
    let moodTrend: "up" | "down" | "neutral" = "neutral";
    if (last7Days.length >= 2) {
      const recentMoodScore = getMoodScore(last7Days[0].mood);
      const previousMoodScore = getMoodScore(
        last7Days[Math.min(1, last7Days.length - 1)].mood,
      );

      if (recentMoodScore > previousMoodScore) {
        moodTrend = "up";
      } else if (recentMoodScore < previousMoodScore) {
        moodTrend = "down";
      }
    }

    return {
      totalEntries: moodEntries.length,
      averageStress: (totalStress / moodEntries.length).toFixed(1),
      moodDistribution: moodCounts,
      weeklyTrend: last7Days,
      mostCommonMood: mostCommon,
      moodTrend,
    };
  }, [moodEntries]);

  const weeklyAverage = useMemo(() => {
    if (stats.weeklyTrend.length === 0) return 0;
    const sum = stats.weeklyTrend.reduce(
      (acc, entry) => acc + getMoodScore(entry.mood),
      0,
    );
    return (sum / stats.weeklyTrend.length).toFixed(1);
  }, [stats.weeklyTrend]);

  // Animation for content loading
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

  if (moodEntries.length === 0) {
    return (
      <ScreenLayout gradientKey="insights">
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Insights
          </Text>
        </View>
        <View style={styles.emptyState}>
          <BarChart3
            color={colors.primary}
            size={64}
            style={styles.emptyEmoji}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Data Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start tracking your mood daily to see insights and patterns about
            your mental health journey.
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout gradientKey="insights">
      <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Insights
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {stats.totalEntries} days tracked
          </Text>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              title="Pull to refresh"
              titleColor={colors.text}
            />
          }
        >
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

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(124, 58, 237, 0.1)",
                  },
                ]}
              >
                <TrendingUp color={colors.primary} size={24} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Weekly Average
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {weeklyAverage}/5.0
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(245, 158, 11, 0.1)",
                  },
                ]}
              >
                <Activity color={colors.warning} size={24} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg Stress
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.averageStress}/10
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(16, 185, 129, 0.1)",
                },
              ]}
            >
              {stats.moodTrend === "up" ? (
                <ArrowUp color={colors.success} size={24} />
              ) : stats.moodTrend === "down" ? (
                <ArrowDown color={colors.danger} size={24} />
              ) : (
                <TrendingUp color={colors.primary} size={24} />
              )}
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Mood Trend
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    stats.moodTrend === "up"
                      ? colors.success
                      : stats.moodTrend === "down"
                        ? colors.danger
                        : colors.text,
                },
              ]}
            >
              {stats.moodTrend === "up"
                ? "Improving"
                : stats.moodTrend === "down"
                  ? "Declining"
                  : "Stable"}
            </Text>
          </View>

          {stats.mostCommonMood && (
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
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Most Common Mood
              </Text>
              <View style={styles.moodHighlight}>
                <Text style={styles.moodHighlightEmoji}>
                  {MOOD_CONFIG[stats.mostCommonMood].emoji}
                </Text>
                <Text
                  style={[styles.moodHighlightLabel, { color: colors.text }]}
                >
                  {MOOD_CONFIG[stats.mostCommonMood].label}
                </Text>
                <Text
                  style={[
                    styles.moodHighlightCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {stats.moodDistribution[stats.mostCommonMood]} times
                </Text>
              </View>
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
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Mood Distribution
            </Text>
            <View style={styles.distributionContainer}>
              {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mood) => {
                const count = stats.moodDistribution[mood];
                const percentage = (count / stats.totalEntries) * 100;
                const percentageStr = Math.round(percentage).toString();
                return (
                  <View key={mood} style={styles.distributionRow}>
                    <View style={styles.distributionLabel}>
                      <Text style={styles.distributionEmoji}>
                        {MOOD_CONFIG[mood].emoji}
                      </Text>
                      <Text
                        style={[
                          styles.distributionText,
                          { color: colors.text },
                        ]}
                      >
                        {MOOD_CONFIG[mood].label}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.distributionBarContainer,
                        {
                          backgroundColor: isDarkMode
                            ? colors.background
                            : "#F3F4F6",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.distributionBar,
                          {
                            width: `${percentage}%` as DimensionValue,
                            backgroundColor: MOOD_CONFIG[mood].color,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.distributionPercentage,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {percentageStr}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {stats.weeklyTrend.length > 0 && (
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
              <View style={styles.cardHeader}>
                <Calendar color={colors.primary} size={20} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Last 7 Days
                </Text>
              </View>
              <View style={styles.weeklyChart}>
                {stats.weeklyTrend.map((entry) => {
                  const date = new Date(entry.date);
                  const dayLabel = date.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  return (
                    <View key={entry.id} style={styles.dayColumn}>
                      <View
                        style={[
                          styles.moodBar,
                          {
                            backgroundColor: isDarkMode
                              ? colors.background
                              : "#F3F4F6",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.moodBarFill,
                            {
                              height: `${(getMoodScore(entry.mood) / 5) * 100}%` as DimensionValue,
                              backgroundColor: MOOD_CONFIG[entry.mood].color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.moodBarEmoji}>
                        {MOOD_CONFIG[entry.mood].emoji}
                      </Text>
                      <Text
                        style={[
                          styles.dayLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {dayLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: isDarkMode
                  ? "rgba(124, 58, 237, 0.1)"
                  : "rgba(240, 244, 255, 0.7)",
                borderLeftColor: colors.primary,
                borderLeftWidth: 4,
              },
            ]}
          >
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              💡 Tip: Regular mood tracking helps identify patterns and
              triggers. Keep checking in daily for the best insights!
            </Text>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeElements}>
            <Target
              color={isDarkMode ? colors.primary : colors.primary}
              size={24}
              style={styles.decorativeElement1}
            />
            <TrendingUp
              color={isDarkMode ? colors.secondary : colors.secondary}
              size={20}
              style={styles.decorativeElement2}
            />
          </View>
        </Animated.ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 16,
  },
  moodHighlight: {
    alignItems: "center",
    paddingVertical: 20,
  },
  moodHighlightEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  moodHighlightLabel: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  moodHighlightCount: {
    fontSize: 15,
  },
  distributionContainer: {
    gap: 12,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  distributionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 100,
  },
  distributionEmoji: {
    fontSize: 20,
  },
  distributionText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  distributionBarContainer: {
    flex: 1,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  distributionBar: {
    height: "100%",
    borderRadius: 12,
  },
  distributionPercentage: {
    fontSize: 14,
    fontWeight: "600" as const,
    width: 40,
    textAlign: "right",
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
  },
  dayColumn: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  moodBar: {
    width: 32,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  moodBarFill: {
    width: "100%",
    borderRadius: 8,
  },
  moodBarEmoji: {
    fontSize: 16,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  noteCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  decorativeElements: {
    position: "relative",
    height: 100,
    marginTop: 20,
  },
  decorativeElement1: {
    position: "absolute",
    top: 10,
    left: 20,
  },
  decorativeElement2: {
    position: "absolute",
    top: 30,
    right: 40,
  },
});
