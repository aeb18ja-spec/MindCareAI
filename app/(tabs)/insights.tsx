import ScreenLayout from "@/components/ScreenLayout";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getMoodScore, MOOD_CONFIG, MoodType } from "@/types/mood";
import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Brain,
  Calendar,
  Flame,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Animated,
  DimensionValue,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PERIODS = ["7D", "14D", "30D", "90D"] as const;
const CHART_HEIGHT = 180;

export default function InsightsScreen() {
  const { moodEntries, refetchMoods, moodStreak, moodStreakMessage } =
    useMood();
  const { colors, isDarkMode } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<(typeof PERIODS)[number]>("7D");

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
        moodTrend: "neutral",
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

  const cardStyle = isDarkMode
    ? {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
      }
    : { backgroundColor: colors.card };

  const cardShadow = isDarkMode
    ? {}
    : {
        shadowColor: "#6C63FF",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      };

  /* ── Period filter pills ── */
  const renderPeriodFilter = () => (
    <View style={styles.periodRow}>
      {PERIODS.map((period) => {
        const isSelected = period === selectedPeriod;
        return isSelected ? (
          <TouchableOpacity
            key={period}
            activeOpacity={0.8}
            onPress={() => setSelectedPeriod(period)}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={colors.gradient.button as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.periodPill}
            >
              <Text style={styles.periodTextSelected}>{period}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            key={period}
            activeOpacity={0.7}
            style={[
              styles.periodPill,
              {
                flex: 1,
                backgroundColor: isDarkMode
                  ? colors.surface
                  : colors.borderLight,
              },
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[styles.periodText, { color: colors.textSecondary }]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  /* ── EMPTY STATE ── */
  if (moodEntries.length === 0) {
    return (
      <ScreenLayout gradientKey="insights">
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.headerIconWrap,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Sparkles color={colors.primary} size={20} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Insights
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Your wellness analytics
              </Text>
            </View>
          </View>
        </View>
        {renderPeriodFilter()}
        <View style={styles.emptyState}>
          <LinearGradient
            colors={colors.gradient.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconCircle}
          >
            <BarChart3 color="#FFFFFF" size={44} />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Data Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start tracking your mood daily to unlock powerful insights and
            patterns about your mental health journey.
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <ScreenLayout gradientKey="insights">
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.headerIconWrap,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Sparkles color={colors.primary} size={20} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Insights
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              Your wellness analytics
            </Text>
          </View>
        </View>
      </View>

      {renderPeriodFilter()}

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Streak Banner ── */}
        <LinearGradient
          colors={colors.gradient.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakLeft}>
            <View style={styles.streakIconWrap}>
              <Flame color="#FFFFFF" size={28} />
            </View>
            <View style={styles.streakTextWrap}>
              <Text style={styles.streakCount}>
                {moodStreak} Day{moodStreak !== 1 ? "s" : ""} Streak
              </Text>
              <Text style={styles.streakMessage}>
                {moodStreak > 0
                  ? moodStreakMessage
                  : "Log a mood today to start!"}
              </Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Zap color="#FFD700" size={18} fill="#FFD700" />
          </View>
        </LinearGradient>

        {/* ── Quick Stats Row ── */}
        <View style={styles.statsGrid}>
          {/* Weekly Average */}
          <View style={[styles.statCard, cardStyle, cardShadow]}>
            <LinearGradient
              colors={colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconCircle}
            >
              <TrendingUp color="#FFFFFF" size={18} />
            </LinearGradient>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {weeklyAverage}
              <Text style={[styles.statUnit, { color: colors.textMuted }]}>
                /5
              </Text>
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              Weekly Avg
            </Text>
            {stats.moodTrend !== "neutral" && (
              <View
                style={[
                  styles.statTrendBadge,
                  {
                    backgroundColor:
                      stats.moodTrend === "up"
                        ? colors.successLight
                        : colors.dangerLight,
                  },
                ]}
              >
                {stats.moodTrend === "up" ? (
                  <ArrowUp
                    color={colors.success}
                    size={12}
                    strokeWidth={3}
                  />
                ) : (
                  <ArrowDown
                    color={colors.danger}
                    size={12}
                    strokeWidth={3}
                  />
                )}
              </View>
            )}
          </View>

          {/* Avg Stress */}
          <View style={[styles.statCard, cardStyle, cardShadow]}>
            <LinearGradient
              colors={colors.gradient.secondary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconCircle}
            >
              <Activity color="#FFFFFF" size={18} />
            </LinearGradient>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stats.averageStress}
              <Text style={[styles.statUnit, { color: colors.textMuted }]}>
                /10
              </Text>
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              Avg Stress
            </Text>
          </View>

          {/* Mood Trend */}
          <View style={[styles.statCard, cardStyle, cardShadow]}>
            <LinearGradient
              colors={colors.gradient.accent as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconCircle}
            >
              <Target color="#FFFFFF" size={18} />
            </LinearGradient>
            <Text
              style={[
                styles.statTrendText,
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
                ? "Up"
                : stats.moodTrend === "down"
                  ? "Down"
                  : "Stable"}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              Trend
            </Text>
          </View>

          {/* Total Entries */}
          <View style={[styles.statCard, cardStyle, cardShadow]}>
            <View
              style={[
                styles.statIconCircle,
                { backgroundColor: colors.successLight },
              ]}
            >
              <Calendar color={colors.success} size={18} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stats.totalEntries}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              Entries
            </Text>
          </View>
        </View>

        {/* ── 7-Day Mood Trend Chart ── */}
        {stats.weeklyTrend.length > 0 && (
          <View style={[styles.chartCard, cardStyle, cardShadow]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleRow}>
                <BarChart3 color={colors.primary} size={18} />
                <Text
                  style={[styles.sectionTitle, { color: colors.primary }]}
                >
                  MOOD TREND
                </Text>
              </View>
              <View
                style={[
                  styles.chartBadge,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text
                  style={[styles.chartBadgeText, { color: colors.primary }]}
                >
                  Last {stats.weeklyTrend.length}d
                </Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
              {/* Y-axis labels */}
              <View style={styles.yAxis}>
                {[5, 4, 3, 2, 1].map((val) => (
                  <Text
                    key={val}
                    style={[styles.yAxisLabel, { color: colors.textMuted }]}
                  >
                    {val}
                  </Text>
                ))}
              </View>

              {/* Chart body */}
              <View style={styles.chartBody}>
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={`grid-${i}`}
                    style={[
                      styles.gridLine,
                      {
                        top: (i / 4) * CHART_HEIGHT,
                        backgroundColor: isDarkMode
                          ? colors.border
                          : colors.borderLight,
                      },
                    ]}
                  />
                ))}

                {/* Bars */}
                <View style={styles.barsRow}>
                  {stats.weeklyTrend.map((entry) => {
                    const score = getMoodScore(entry.mood);
                    const barHeight = (score / 5) * CHART_HEIGHT;
                    const moodColor = MOOD_CONFIG[entry.mood].color;
                    return (
                      <View key={entry.id} style={styles.barColumn}>
                        <Text style={styles.barEmoji}>
                          {MOOD_CONFIG[entry.mood].emoji}
                        </Text>
                        <LinearGradient
                          colors={
                            [moodColor, `${moodColor}99`] as [string, string]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={[styles.bar, { height: barHeight }]}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Day labels */}
            <View style={styles.dayLabelsRow}>
              <View style={styles.yAxisSpacer} />
              {stats.weeklyTrend.map((entry) => {
                const date = new Date(entry.date);
                const dayLabel = date.toLocaleDateString("en-US", {
                  weekday: "short",
                });
                return (
                  <View key={entry.id} style={styles.dayLabelCell}>
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

        {/* ── Mood Distribution ── */}
        <View style={[styles.distributionCard, cardStyle, cardShadow]}>
          <View style={styles.chartTitleRow}>
            <Brain color={colors.primary} size={18} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              MOOD DISTRIBUTION
            </Text>
          </View>
          <View style={styles.distributionList}>
            {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mood) => {
              const count = stats.moodDistribution[mood];
              const percentage = (count / stats.totalEntries) * 100;
              const percentageStr = Math.round(percentage).toString();
              const moodColor = MOOD_CONFIG[mood].color;
              return (
                <View key={mood} style={styles.distributionRow}>
                  <View style={styles.distributionLabel}>
                    <View
                      style={[
                        styles.distributionEmojiWrap,
                        { backgroundColor: `${moodColor}18` },
                      ]}
                    >
                      <Text style={styles.distributionEmoji}>
                        {MOOD_CONFIG[mood].emoji}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.distributionText,
                        { color: colors.text },
                      ]}
                    >
                      {MOOD_CONFIG[mood].label}
                    </Text>
                  </View>
                  <View style={styles.distributionBarArea}>
                    <View
                      style={[
                        styles.distributionBarBg,
                        {
                          backgroundColor: isDarkMode
                            ? colors.background
                            : colors.borderLight,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={
                          [moodColor, `${moodColor}AA`] as [string, string]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.distributionBarFill,
                          {
                            width: `${Math.max(percentage, 3)}%` as DimensionValue,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.distributionPercent,
                      { color: colors.text },
                    ]}
                  >
                    {percentageStr}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Most Common Mood ── */}
        {stats.mostCommonMood && (
          <View style={[styles.highlightCard, cardStyle, cardShadow]}>
            <View style={styles.highlightRow}>
              <View
                style={[
                  styles.highlightEmojiWrap,
                  {
                    backgroundColor: `${MOOD_CONFIG[stats.mostCommonMood].color}20`,
                  },
                ]}
              >
                <Text style={styles.highlightEmoji}>
                  {MOOD_CONFIG[stats.mostCommonMood].emoji}
                </Text>
              </View>
              <View style={styles.highlightTextWrap}>
                <Text
                  style={[
                    styles.highlightLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  MOST COMMON MOOD
                </Text>
                <Text style={[styles.highlightValue, { color: colors.text }]}>
                  {MOOD_CONFIG[stats.mostCommonMood].label}
                </Text>
              </View>
              <View
                style={[
                  styles.highlightCountBadge,
                  {
                    backgroundColor:
                      MOOD_CONFIG[stats.mostCommonMood].color + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.highlightCount,
                    { color: MOOD_CONFIG[stats.mostCommonMood].color },
                  ]}
                >
                  {stats.moodDistribution[stats.mostCommonMood]}x
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Tip Card ── */}
        <LinearGradient
          colors={
            isDarkMode
              ? ([colors.surface, colors.card] as [string, string])
              : (["#F0EDFF", "#FFF0F0"] as [string, string])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.tipCard,
            isDarkMode && { borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <View
            style={[
              styles.tipIconWrap,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Lightbulb color={colors.primary} size={20} />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipLabel, { color: colors.primary }]}>
              Pro Tip
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Regular mood tracking helps identify patterns and triggers.
              Check in daily for the best insights!
            </Text>
          </View>
        </LinearGradient>
      </Animated.ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  /* ── Header ── */
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginTop: 1,
  },

  /* ── Period Filter ── */
  periodRow: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
    flexDirection: "row" as const,
  },
  periodPill: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  periodTextSelected: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },

  /* ── Scroll ── */
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  /* ── Streak Card ── */
  streakCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  streakLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  streakIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 16,
  },
  streakTextWrap: {
    flex: 1,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  streakMessage: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginTop: 4,
    color: "rgba(255, 255, 255, 0.85)",
  },
  streakBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  /* ── Stats Grid (2x2) ── */
  statsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "47%" as DimensionValue,
    borderRadius: 22,
    padding: 18,
    alignItems: "center" as const,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 14,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  statTrendText: {
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  statTrendBadge: {
    position: "absolute" as const,
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  /* ── Chart Card ── */
  chartCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  chartTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  chartBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  chartBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
  chartWrapper: {
    flexDirection: "row" as const,
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: 24,
    height: CHART_HEIGHT,
    justifyContent: "space-between" as const,
    alignItems: "flex-end" as const,
    paddingRight: 6,
  },
  yAxisLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    lineHeight: 14,
  },
  chartBody: {
    flex: 1,
    height: CHART_HEIGHT,
  },
  gridLine: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    height: 1,
  },
  barsRow: {
    flex: 1,
    flexDirection: "row" as const,
  },
  barColumn: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
  },
  bar: {
    width: 32,
    borderRadius: 12,
  },
  barEmoji: {
    fontSize: 14,
    marginBottom: 6,
  },
  dayLabelsRow: {
    flexDirection: "row" as const,
    marginTop: 10,
  },
  yAxisSpacer: {
    width: 24,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: "center" as const,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
  },

  /* ── Mood Distribution ── */
  distributionCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  distributionList: {
    gap: 14,
    marginTop: 20,
  },
  distributionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  distributionLabel: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    width: 110,
  },
  distributionEmojiWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  distributionEmoji: {
    fontSize: 16,
  },
  distributionText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  distributionBarArea: {
    flex: 1,
    marginHorizontal: 12,
  },
  distributionBarBg: {
    height: 20,
    borderRadius: 10,
    overflow: "hidden" as const,
  },
  distributionBarFill: {
    height: "100%" as DimensionValue,
    borderRadius: 10,
  },
  distributionPercent: {
    fontSize: 14,
    fontWeight: "700" as const,
    width: 42,
    textAlign: "right" as const,
  },

  /* ── Highlight Card ── */
  highlightCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  highlightEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  highlightEmoji: {
    fontSize: 28,
  },
  highlightTextWrap: {
    flex: 1,
    marginLeft: 16,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
  },
  highlightCountBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  highlightCount: {
    fontSize: 16,
    fontWeight: "800" as const,
  },

  /* ── Empty State ── */
  emptyState: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 28,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center" as const,
    lineHeight: 23,
  },

  /* ── Tip Card ── */
  tipCard: {
    borderRadius: 22,
    flexDirection: "row" as const,
    padding: 20,
    marginTop: 4,
    marginBottom: 16,
    alignItems: "flex-start" as const,
    gap: 14,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  tipContent: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
