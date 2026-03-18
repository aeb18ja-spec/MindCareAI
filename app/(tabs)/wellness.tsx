import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { BMICategory } from "@/lib/bmi";
import { getBMICategoryColor, getBMICategoryDescription } from "@/lib/bmi";
import { generateInsights, type WellnessInsight } from "@/lib/insights";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Activity,
    ArrowDown,
    ArrowUp,
    Brain,
    Heart,
    Lightbulb,
    Moon,
    Ruler,
    Scale,
    Sparkles,
    TrendingUp,
    Weight,
    Zap,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Animated,
    DimensionValue,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BMI_RANGES = [
  { label: "Underweight", max: 18.5, color: "#FFB020" },
  { label: "Normal", max: 25, color: "#4CAF50" },
  { label: "Overweight", max: 30, color: "#FF9800" },
  { label: "Obese", max: 50, color: "#F44336" },
] as const;

function getGaugePercent(bmi: number): number {
  // Map BMI 10-40 to 0-100%
  const clamped = Math.max(10, Math.min(40, bmi));
  return ((clamped - 10) / 30) * 100;
}

export default function WellnessScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { moodEntries, weightLogs, refetchMoods, refetchWeightLogs } = useMood();
  const { colors, isDarkMode } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMoods(), refetchWeightLogs()]);
    setRefreshing(false);
  }, [refetchMoods, refetchWeightLogs]);

  const bmi = currentUser?.bmi ?? null;
  const bmiCategory = (currentUser?.bmiCategory ?? null) as BMICategory | null;
  const bmiColor = getBMICategoryColor(bmiCategory);
  const bmiDescription = getBMICategoryDescription(bmiCategory);
  const weight = currentUser?.weight ?? 0;
  const height = currentUser?.height ?? 0;
  const sleepHours = currentUser?.sleepingHours ?? 0;

  const insights = useMemo<WellnessInsight[]>(() => {
    return generateInsights({
      moodEntries,
      sleepHours,
      bmi,
      bmiCategory,
    });
  }, [moodEntries, sleepHours, bmi, bmiCategory]);

  const cardStyle = isDarkMode
    ? { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
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

  const insightIcon = (type: WellnessInsight["icon"]) => {
    switch (type) {
      case "sleep": return Moon;
      case "bmi": return Scale;
      case "activity": return Activity;
      case "trend": return TrendingUp;
      case "stress": return Zap;
      case "tip": return Lightbulb;
      default: return Sparkles;
    }
  };

  const insightIconColor = (sentiment: WellnessInsight["sentiment"]) => {
    switch (sentiment) {
      case "positive": return colors.success;
      case "negative": return "#FF6B6B";
      default: return colors.primary;
    }
  };

  const recentWeightLogs = (weightLogs ?? []).slice(0, 7).reverse();

  return (
    <ScreenLayout gradientKey="insights">
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.headerIconWrap,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Heart color={colors.primary} size={20} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Wellness
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              Your health at a glance
            </Text>
          </View>
        </View>
      </View>

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
        {/* ── BMI Card ── */}
        <View style={[styles.bmiCard, cardStyle, cardShadow]}>
          <View style={styles.bmiHeader}>
            <View style={styles.chartTitleRow}>
              <Scale color={colors.primary} size={18} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                BODY MASS INDEX
              </Text>
            </View>
            {bmiCategory && (
              <View
                style={[
                  styles.bmiBadge,
                  { backgroundColor: bmiColor + "20" },
                ]}
              >
                <Text style={[styles.bmiBadgeText, { color: bmiColor }]}>
                  {bmiCategory}
                </Text>
              </View>
            )}
          </View>

          {bmi != null ? (
            <>
              {/* Large BMI number */}
              <View style={styles.bmiValueRow}>
                <Text style={[styles.bmiValue, { color: colors.text }]}>
                  {bmi.toFixed(1)}
                </Text>
                <Text style={[styles.bmiUnit, { color: colors.textMuted }]}>
                  kg/m²
                </Text>
              </View>

              {/* BMI Gauge Bar */}
              <View style={styles.gaugeContainer}>
                <View
                  style={[
                    styles.gaugeBg,
                    {
                      backgroundColor: isDarkMode
                        ? colors.surface
                        : colors.borderLight,
                    },
                  ]}
                >
                  {BMI_RANGES.map((range, i) => {
                    const prevMax = i === 0 ? 10 : BMI_RANGES[i - 1].max;
                    const widthPct = ((range.max - prevMax) / 30) * 100;
                    return (
                      <View
                        key={range.label}
                        style={{
                          width: `${Math.min(widthPct, 100)}%` as DimensionValue,
                          height: "100%",
                          backgroundColor: range.color + "40",
                        }}
                      />
                    );
                  })}
                </View>
                {/* Indicator */}
                <View
                  style={[
                    styles.gaugeIndicator,
                    {
                      left: `${getGaugePercent(bmi)}%` as DimensionValue,
                      backgroundColor: bmiColor,
                    },
                  ]}
                />
                {/* Range labels */}
                <View style={styles.gaugeLabels}>
                  <Text
                    style={[styles.gaugeLabel, { color: colors.textMuted }]}
                  >
                    10
                  </Text>
                  <Text
                    style={[styles.gaugeLabel, { color: colors.textMuted }]}
                  >
                    18.5
                  </Text>
                  <Text
                    style={[styles.gaugeLabel, { color: colors.textMuted }]}
                  >
                    25
                  </Text>
                  <Text
                    style={[styles.gaugeLabel, { color: colors.textMuted }]}
                  >
                    30
                  </Text>
                  <Text
                    style={[styles.gaugeLabel, { color: colors.textMuted }]}
                  >
                    40
                  </Text>
                </View>
              </View>

              {/* Description */}
              <Text
                style={[
                  styles.bmiDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {bmiDescription}
              </Text>

              {/* Height / Weight pills */}
              <View style={styles.bmiMetaRow}>
                <View
                  style={[
                    styles.bmiMetaPill,
                    {
                      backgroundColor: isDarkMode
                        ? colors.surface
                        : colors.borderLight,
                    },
                  ]}
                >
                  <Ruler color={colors.primary} size={14} />
                  <Text
                    style={[
                      styles.bmiMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {height} cm
                  </Text>
                </View>
                <View
                  style={[
                    styles.bmiMetaPill,
                    {
                      backgroundColor: isDarkMode
                        ? colors.surface
                        : colors.borderLight,
                    },
                  ]}
                >
                  <Weight color="#FF6B6B" size={14} />
                  <Text
                    style={[
                      styles.bmiMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {weight} kg
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.bmiEmptyState}>
              <Text
                style={[styles.bmiEmptyText, { color: colors.textSecondary }]}
              >
                Complete your profile with height and weight to see your BMI.
              </Text>
            </View>
          )}
        </View>

        {/* ── Sleep Card ── */}
        <View style={[styles.sleepCard, cardStyle, cardShadow]}>
          <View style={styles.chartTitleRow}>
            <Moon color="#8B5CF6" size={18} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              SLEEP
            </Text>
          </View>
          <View style={styles.sleepContent}>
            <Text style={[styles.sleepValue, { color: colors.text }]}>
              {sleepHours > 0 ? sleepHours.toFixed(1) : "—"}
            </Text>
            <Text style={[styles.sleepUnit, { color: colors.textMuted }]}>
              hrs/night
            </Text>
          </View>
          {sleepHours > 0 && (
            <View
              style={[
                styles.sleepQualityBadge,
                {
                  backgroundColor:
                    sleepHours < 6
                      ? colors.dangerLight
                      : sleepHours <= 9
                        ? colors.successLight
                        : colors.warningLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.sleepQualityText,
                  {
                    color:
                      sleepHours < 6
                        ? colors.danger
                        : sleepHours <= 9
                          ? colors.success
                          : colors.warning,
                  },
                ]}
              >
                {sleepHours < 6
                  ? "Below recommended"
                  : sleepHours <= 9
                    ? "Healthy range"
                    : "Above average"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Weight Trend ── */}
        <View style={[styles.weightCard, cardStyle, cardShadow]}>
          <View style={styles.weightHeader}>
            <View style={styles.chartTitleRow}>
              <TrendingUp color={colors.primary} size={18} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                WEIGHT TREND
              </Text>
            </View>
          </View>

          {recentWeightLogs.length > 0 ? (
            <View style={styles.weightChartContainer}>
              {/* Simple bar chart for weight logs */}
              <View style={styles.weightBarsRow}>
                {recentWeightLogs.map((log, i) => {
                  const allWeights = recentWeightLogs.map((l) => l.weight);
                  const minW = Math.min(...allWeights) - 2;
                  const maxW = Math.max(...allWeights) + 2;
                  const range = maxW - minW || 1;
                  const barHeight = Math.max(
                    20,
                    ((log.weight - minW) / range) * 120
                  );
                  const isLatest = i === recentWeightLogs.length - 1;
                  return (
                    <View key={log.id} style={styles.weightBarCol}>
                      <Text
                        style={[
                          styles.weightBarValue,
                          {
                            color: isLatest
                              ? colors.primary
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {log.weight}
                      </Text>
                      <LinearGradient
                        colors={
                          isLatest
                            ? (colors.gradient.primary as [string, string])
                            : ([colors.borderLight, colors.borderLight] as [
                                string,
                                string,
                              ])
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.weightBar, { height: barHeight }]}
                      />
                      <Text
                        style={[
                          styles.weightBarDate,
                          { color: colors.textMuted },
                        ]}
                      >
                        {new Date(log.logDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {/* Weight change indicator */}
              {recentWeightLogs.length >= 2 && (
                <View style={styles.weightChangeRow}>
                  {(() => {
                    const first = recentWeightLogs[0].weight;
                    const last =
                      recentWeightLogs[recentWeightLogs.length - 1].weight;
                    const diff = last - first;
                    const isUp = diff > 0;
                    return (
                      <View
                        style={[
                          styles.weightChangeBadge,
                          {
                            backgroundColor: isUp
                              ? colors.dangerLight
                              : colors.successLight,
                          },
                        ]}
                      >
                        {isUp ? (
                          <ArrowUp color={colors.danger} size={14} />
                        ) : (
                          <ArrowDown color={colors.success} size={14} />
                        )}
                        <Text
                          style={[
                            styles.weightChangeText,
                            {
                              color: isUp ? colors.danger : colors.success,
                            },
                          ]}
                        >
                          {Math.abs(diff).toFixed(1)} kg
                        </Text>
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.weightEmptyState}>
              <Text
                style={[
                  styles.weightEmptyText,
                  { color: colors.textSecondary },
                ]}
              >
                Start logging your weight to see trends over time.
              </Text>
            </View>
          )}
        </View>

        {/* ── Wellness Insights ── */}
        <View style={styles.insightsSection}>
          <View style={styles.chartTitleRow}>
            <Brain color={colors.primary} size={18} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              WELLNESS INSIGHTS
            </Text>
          </View>

          {insights.map((insight) => {
            const IconComponent = insightIcon(insight.icon);
            const iconColor = insightIconColor(insight.sentiment);
            return (
              <View
                key={insight.id}
                style={[styles.insightCard, cardStyle, cardShadow]}
              >
                <View style={styles.insightRow}>
                  <View
                    style={[
                      styles.insightIconWrap,
                      { backgroundColor: iconColor + "18" },
                    ]}
                  >
                    <IconComponent color={iconColor} size={18} />
                  </View>
                  <View style={styles.insightTextWrap}>
                    <Text
                      style={[styles.insightTitle, { color: colors.text }]}
                    >
                      {insight.title}
                    </Text>
                    <Text
                      style={[
                        styles.insightDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {insight.description}
                    </Text>
                    {(insight.id === "no-data"
                      || insight.id === "tracking-progress"
                      || insight.id === "starter-unlock") && (
                      <View style={styles.insightActions}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/index",
                              params: {
                                focus: "body-sleep",
                                focusToken: Date.now().toString(),
                              },
                            })
                          }
                          activeOpacity={0.8}
                          style={[
                            styles.insightActionButton,
                            { backgroundColor: colors.primaryLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.insightActionText,
                              { color: colors.primary },
                            ]}
                          >
                            Check in now
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
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

  /* ── Scroll ── */
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 18,
  },

  /* ── Section Title Row ── */
  chartTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
  },

  /* ── BMI Card ── */
  bmiCard: {
    borderRadius: 24,
    padding: 22,
  },
  bmiHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  bmiBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bmiBadgeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  bmiValueRow: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
    marginBottom: 20,
    gap: 6,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: "900" as const,
    letterSpacing: -2,
  },
  bmiUnit: {
    fontSize: 16,
    fontWeight: "600" as const,
  },

  /* Gauge */
  gaugeContainer: {
    marginBottom: 16,
    position: "relative" as const,
  },
  gaugeBg: {
    height: 12,
    borderRadius: 6,
    flexDirection: "row" as const,
    overflow: "hidden" as const,
  },
  gaugeIndicator: {
    position: "absolute" as const,
    top: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gaugeLabels: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 6,
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: "500" as const,
  },
  bmiDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  bmiMetaRow: {
    flexDirection: "row" as const,
    gap: 10,
  },
  bmiMetaPill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bmiMetaText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  bmiEmptyState: {
    paddingVertical: 20,
    alignItems: "center" as const,
  },
  bmiEmptyText: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 22,
  },

  /* ── Sleep Card ── */
  sleepCard: {
    borderRadius: 24,
    padding: 22,
  },
  sleepContent: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
    gap: 6,
    marginTop: 14,
    marginBottom: 10,
  },
  sleepValue: {
    fontSize: 40,
    fontWeight: "900" as const,
    letterSpacing: -1,
  },
  sleepUnit: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  sleepQualityBadge: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sleepQualityText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },

  /* ── Weight Card ── */
  weightCard: {
    borderRadius: 24,
    padding: 22,
  },
  weightHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  logWeightButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logWeightText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  weightChartContainer: {
    gap: 12,
  },
  weightBarsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    alignItems: "flex-end" as const,
    height: 160,
    paddingTop: 20,
  },
  weightBarCol: {
    alignItems: "center" as const,
    flex: 1,
    gap: 4,
  },
  weightBarValue: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  weightBar: {
    width: 24,
    borderRadius: 8,
    minHeight: 20,
  },
  weightBarDate: {
    fontSize: 10,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  weightChangeRow: {
    alignItems: "center" as const,
  },
  weightChangeBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  weightChangeText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  weightEmptyState: {
    paddingVertical: 20,
    alignItems: "center" as const,
  },
  weightEmptyText: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 22,
  },

  /* ── Insights ── */
  insightsSection: {
    gap: 12,
  },
  insightCard: {
    borderRadius: 20,
    padding: 18,
  },
  insightRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 14,
  },
  insightIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 2,
  },
  insightTextWrap: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  insightActions: {
    marginTop: 10,
    alignSelf: "flex-start" as const,
  },
  insightActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  insightActionText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },

  /* ── Weight Modal ── */
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center" as const,
    gap: 20,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center" as const,
    lineHeight: 24,
    marginBottom: 8,
  },
  weightInput: {
    width: "100%",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: "700" as const,
    textAlign: "center" as const,
  },
  saveButtonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden" as const,
    marginTop: 8,
  },
  saveButton: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});
