import MoodCalendarView from "@/components/MoodCalendarView";
import ScreenLayout from "@/components/ScreenLayout";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { MoodEntry, SleepLog, WeightLog } from "@/types/mood";
import { MOOD_CONFIG } from "@/types/mood";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Calendar as CalendarIcon, History, LayoutGrid, List, Moon, Scale } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export type MoodHistoryFilter = "all" | "7" | "30";
export type MoodHistoryViewMode = "timeline" | "calendar";

const todayStr = () => new Date().toISOString().split("T")[0];
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

function getDateLabel(dateStr: string): string {
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCalendarDateLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function notePreview(note: string | undefined, maxLen: number): string {
  if (!note?.trim()) return "";
  const t = note.trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + "\u2026";
}

function filterEntriesByRange<T extends { date: string; createdAt?: string }>(
  entries: T[],
  filter: MoodHistoryFilter
): T[] {
  if (filter === "all") return entries;
  const now = Date.now();
  const days = filter === "7" ? 7 : 30;
  const since = now - days * 24 * 60 * 60 * 1000;
  return entries.filter((e) => {
    const created = e.createdAt ? new Date(e.createdAt).getTime() : new Date(e.date + "T12:00:00").getTime();
    return created >= since;
  });
}

const FILTER_BTNS: { key: MoodHistoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "7", label: "Last 7 Days" },
  { key: "30", label: "Last 30 Days" },
];

function CalendarModal({
  visible,
  onClose,
  onSelectDate,
  colors,
  initialDate,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  colors: Record<string, string>;
  initialDate?: Date;
}) {
  const [value, setValue] = useState(() => initialDate ?? new Date());
  const webContainerRef = useRef<View>(null);
  const webInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialDate ?? new Date());
    }
  }, [visible, initialDate]);

  // On web, DateTimePicker doesn't render; mount a native <input type="date"> instead.
  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;
    const container = typeof document !== "undefined" ? document.getElementById("web-date-picker-container") : null;
    if (!container || typeof container.appendChild !== "function") return;
    const input = document.createElement("input");
    input.type = "date";
    input.value = value.toISOString().split("T")[0];
    input.style.cssText = `
      width: 100%;
      padding: 14px;
      font-size: 16px;
      border-radius: 14px;
      border: 1px solid ${colors.border};
      background-color: ${colors.background};
      color: ${colors.text};
      box-sizing: border-box;
    `;
    const handleChange = (e: Event) => {
      const dateStr = (e.target as HTMLInputElement).value;
      if (dateStr) {
        onSelectDate(dateStr);
        onClose();
      }
    };
    input.addEventListener("change", handleChange);
    container.appendChild(input);
    webInputRef.current = input;
    return () => {
      input.removeEventListener("change", handleChange);
      try {
        container.removeChild(input);
      } catch {
        // already removed
      }
      webInputRef.current = null;
    };
  }, [visible, colors.border, colors.background, colors.text, onSelectDate, onClose]);

  // Keep web input value in sync when initialDate/value changes while modal is open
  useEffect(() => {
    if (Platform.OS === "web" && visible && webInputRef.current) {
      webInputRef.current.value = value.toISOString().split("T")[0];
    }
  }, [visible, value]);

  const handleChange = useCallback(
    (_event: unknown, date: Date | undefined) => {
      if (date) {
        const dateStr = date.toISOString().split("T")[0];
        onSelectDate(dateStr);
      }
      onClose();
    },
    [onSelectDate, onClose]
  );

  if (!visible) return null;

  const isWeb = Platform.OS === "web";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.calendarOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.calendarModalContent,
            { backgroundColor: colors.card },
            Platform.OS !== "web" && {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.calendarModalHeader}>
            <Text style={[styles.calendarModalTitle, { color: colors.text }]}>
              Select date
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={[styles.calendarDoneBtn, { backgroundColor: colors.primaryLight }]}
            >
              <Text
                style={[styles.calendarModalClose, { color: colors.primary }]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
          {isWeb ? (
            <View nativeID="web-date-picker-container" ref={webContainerRef} style={styles.webDatePickerWrap} collapsable={false} />
          ) : (
            <DateTimePicker
              value={value}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "spinner"}
              onChange={handleChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const NOTE_PREVIEW_LEN = 60;

function MoodCard({
  entry,
  onPress,
  colors,
  isDarkMode,
  index,
}: {
  entry: MoodEntry;
  onPress: () => void;
  colors: Record<string, string>;
  isDarkMode: boolean;
  index: number;
}) {
  const config = MOOD_CONFIG[entry.mood];
  const timeStr = formatTime(entry.createdAt);
  const preview = notePreview(entry.note, NOTE_PREVIEW_LEN);
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(animTranslate, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [index, animOpacity, animTranslate]);

  return (
    <Animated.View
      style={[
        {
          opacity: animOpacity,
          transform: [{ translateY: animTranslate }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          styles.entryCard,
          {
            backgroundColor: colors.card,
          },
          isDarkMode
            ? { borderColor: colors.border, borderWidth: 1 }
            : {
                shadowColor: '#6C63FF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              },
        ]}
      >
        <View style={styles.entryRow}>
          <View style={[styles.emojiContainer, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.entryEmoji}>{config?.emoji ?? "\uD83D\uDE10"}</Text>
          </View>
          <View style={styles.entryMain}>
            <Text style={[styles.entryMood, { color: colors.text }]}>
              {config?.label ?? entry.mood}
            </Text>
            <Text style={[styles.entryTime, { color: colors.textMuted }]}>
              {timeStr || "\u2014"}
            </Text>
            <View style={styles.entryDetails}>
              <View style={[styles.stressPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.stressPillText, { color: colors.primary }]}>
                  Stress {entry.stressLevel}/10
                </Text>
              </View>
              {entry.activities && entry.activities.length > 0 ? (
                <Text
                  style={[styles.entryActivities, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {entry.activities.join(", ")}
                </Text>
              ) : null}
            </View>
            {preview ? (
              <Text
                style={[styles.entryNote, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {preview}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

type WellnessHistoryEntry = {
  id: string;
  date: string;
  createdAt?: string;
  weight?: number;
  sleepHours?: number;
};

type TimelineEntry =
  | {
      kind: "mood";
      id: string;
      date: string;
      createdAt?: string;
      moodEntry: MoodEntry;
    }
  | {
      kind: "wellness";
      id: string;
      date: string;
      createdAt?: string;
      wellnessEntry: WellnessHistoryEntry;
    };

function WellnessCard({
  entry,
  colors,
  isDarkMode,
  index,
}: {
  entry: WellnessHistoryEntry;
  colors: Record<string, string>;
  isDarkMode: boolean;
  index: number;
}) {
  const timeStr = formatTime(entry.createdAt);
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(animTranslate, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [index, animOpacity, animTranslate]);

  return (
    <Animated.View
      style={[
        {
          opacity: animOpacity,
          transform: [{ translateY: animTranslate }],
        },
      ]}
    >
      <View
        style={[
          styles.entryCard,
          {
            backgroundColor: colors.card,
          },
          isDarkMode
            ? { borderColor: colors.border, borderWidth: 1 }
            : {
                shadowColor: "#6C63FF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              },
        ]}
      >
        <View style={styles.entryRow}>
          <View
            style={[styles.emojiContainer, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={styles.entryEmoji}>🧩</Text>
          </View>
          <View style={styles.entryMain}>
            <Text style={[styles.entryMood, { color: colors.text }]}>Body & Sleep Check-in</Text>
            <Text style={[styles.entryTime, { color: colors.textMuted }]}>
              {timeStr || "—"}
            </Text>
            <View style={styles.wellnessPillsRow}>
              {entry.weight != null ? (
                <View
                  style={[
                    styles.wellnessPill,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Scale color={colors.primary} size={12} />
                  <Text
                    style={[styles.wellnessPillText, { color: colors.primary }]}
                  >
                    {entry.weight.toFixed(1)} kg
                  </Text>
                </View>
              ) : null}

              {entry.sleepHours != null ? (
                <View
                  style={[
                    styles.wellnessPill,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Moon color={colors.primary} size={12} />
                  <Text
                    style={[styles.wellnessPillText, { color: colors.primary }]}
                  >
                    {entry.sleepHours.toFixed(1)} hrs
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function MoodHistoryScreen() {
  const {
    moodEntries,
    weightLogs,
    sleepLogs,
    refetchMoods,
    refetchWeightLogs,
    refetchSleepLogs,
    isLoading,
  } = useMood();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<MoodHistoryFilter>("all");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(
    null
  );
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<MoodHistoryViewMode>("timeline");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMoods(), refetchWeightLogs(), refetchSleepLogs()]);
    setRefreshing(false);
  }, [refetchMoods, refetchWeightLogs, refetchSleepLogs]);

  const wellnessEntries = useMemo<WellnessHistoryEntry[]>(() => {
    const byDate = new Map<string, WellnessHistoryEntry>();

    const applyCreatedAt = (
      existing: WellnessHistoryEntry,
      candidateCreatedAt: string | undefined,
      date: string,
    ) => {
      const candidate = candidateCreatedAt ?? `${date}T12:00:00`;
      if (!existing.createdAt) {
        existing.createdAt = candidate;
        return;
      }

      if (new Date(candidate).getTime() > new Date(existing.createdAt).getTime()) {
        existing.createdAt = candidate;
      }
    };

    for (const weightLog of weightLogs as WeightLog[]) {
      const existing = byDate.get(weightLog.logDate) ?? {
        id: `wellness-${weightLog.logDate}`,
        date: weightLog.logDate,
      };
      existing.weight = weightLog.weight;
      applyCreatedAt(existing, weightLog.createdAt, weightLog.logDate);
      byDate.set(weightLog.logDate, existing);
    }

    for (const sleepLog of sleepLogs as SleepLog[]) {
      const existing = byDate.get(sleepLog.logDate) ?? {
        id: `wellness-${sleepLog.logDate}`,
        date: sleepLog.logDate,
      };
      existing.sleepHours = sleepLog.sleepHours;
      applyCreatedAt(existing, sleepLog.createdAt, sleepLog.logDate);
      byDate.set(sleepLog.logDate, existing);
    }

    return Array.from(byDate.values()).sort((a, b) => {
      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : new Date(a.date + "T12:00:00").getTime();
      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : new Date(b.date + "T12:00:00").getTime();
      return bTime - aTime;
    });
  }, [weightLogs, sleepLogs]);

  const filteredMoodEntries = useMemo(() => {
    const byRange = filterEntriesByRange(moodEntries, filter);
    if (selectedCalendarDate) {
      return byRange.filter((e) => e.date === selectedCalendarDate);
    }
    return byRange;
  }, [moodEntries, filter, selectedCalendarDate]);

  const filteredWellnessEntries = useMemo(() => {
    const byRange = filterEntriesByRange(wellnessEntries, filter);
    if (selectedCalendarDate) {
      return byRange.filter((e) => e.date === selectedCalendarDate);
    }
    return byRange;
  }, [wellnessEntries, filter, selectedCalendarDate]);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const moodTimeline: TimelineEntry[] = filteredMoodEntries.map((entry) => ({
      kind: "mood",
      id: entry.id,
      date: entry.date,
      createdAt: entry.createdAt,
      moodEntry: entry,
    }));

    const wellnessTimeline: TimelineEntry[] = filteredWellnessEntries.map((entry) => ({
      kind: "wellness",
      id: entry.id,
      date: entry.date,
      createdAt: entry.createdAt,
      wellnessEntry: entry,
    }));

    return [...moodTimeline, ...wellnessTimeline].sort((a, b) => {
      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : new Date(a.date + "T12:00:00").getTime();
      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : new Date(b.date + "T12:00:00").getTime();
      return bTime - aTime;
    });
  }, [filteredMoodEntries, filteredWellnessEntries]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();
    for (const entry of timelineEntries) {
      const label = getDateLabel(entry.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(entry);
    }
    const today = "Today";
    const yesterday = "Yesterday";
    const keys = Array.from(map.keys());
    const rest = keys
      .filter((k) => k !== today && k !== yesterday)
      .sort((a, b) => {
        const dateA = map.get(a)![0].date;
        const dateB = map.get(b)![0].date;
        return dateB.localeCompare(dateA);
      });
    return [today, yesterday, ...rest].filter((k) => map.has(k));
  }, [timelineEntries]);

  const sections = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();
    for (const entry of timelineEntries) {
      const label = getDateLabel(entry.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(entry);
    }
    return { map, order: groupedByDate };
  }, [timelineEntries, groupedByDate]);

  const handleEntryPress = useCallback(
    (id: string) => {
      router.push(`/mood-detail/${id}`);
    },
    [router]
  );

  const openCalendar = useCallback(() => setCalendarModalVisible(true), []);
  const clearCalendarFilter = useCallback(() => setSelectedCalendarDate(null), []);

  const handleSelectDateForTimeline = useCallback((dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    setViewMode("timeline");
  }, []);

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
        },
        !isDarkMode && {
          shadowColor: '#6C63FF',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        },
        isDarkMode && {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Mood History
        </Text>
        <TouchableOpacity
          onPress={openCalendar}
          style={[
            styles.calendarIconBtn,
            { backgroundColor: colors.primaryLight },
          ]}
          accessibilityLabel="Open calendar to search by date"
        >
          <CalendarIcon color={colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      {/* Segmented View Mode Toggle */}
      <View style={[styles.viewModeRow, { backgroundColor: colors.background, borderRadius: 16 }]}>
        <TouchableOpacity
          onPress={() => setViewMode("timeline")}
          style={styles.viewModeBtnWrap}
          activeOpacity={0.8}
        >
          {viewMode === "timeline" ? (
            <LinearGradient
              colors={colors.gradient?.primary ?? ['#6C63FF', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewModeBtn}
            >
              <List color="#FFFFFF" size={16} />
              <Text style={[styles.viewModeBtnText, { color: '#FFFFFF' }]}>
                Timeline
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.viewModeBtn}>
              <List color={colors.textMuted} size={16} />
              <Text style={[styles.viewModeBtnText, { color: colors.textMuted }]}>
                Timeline
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode("calendar")}
          style={styles.viewModeBtnWrap}
          activeOpacity={0.8}
        >
          {viewMode === "calendar" ? (
            <LinearGradient
              colors={colors.gradient?.primary ?? ['#6C63FF', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewModeBtn}
            >
              <LayoutGrid color="#FFFFFF" size={16} />
              <Text style={[styles.viewModeBtnText, { color: '#FFFFFF' }]}>
                Calendar
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.viewModeBtn}>
              <LayoutGrid color={colors.textMuted} size={16} />
              <Text style={[styles.viewModeBtnText, { color: colors.textMuted }]}>
                Calendar
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {viewMode === "timeline" && (
        <>
          <View style={styles.filterRow}>
            {FILTER_BTNS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setFilter(key)}
                activeOpacity={0.8}
              >
                {filter === key ? (
                  <LinearGradient
                    colors={colors.gradient?.primary ?? ['#6C63FF', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterBtnActive}
                  >
                    <Text style={[styles.filterBtnText, { color: '#FFFFFF' }]}>
                      {label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.filterBtn,
                      { backgroundColor: colors.background, borderColor: colors.borderLight },
                    ]}
                  >
                    <Text
                      style={[styles.filterBtnText, { color: colors.textSecondary }]}
                    >
                      {label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text
            style={[styles.headerSubtitle, { color: colors.textMuted }]}
          >
            {timelineEntries.length}{" "}
            {timelineEntries.length === 1 ? "entry" : "entries"}
          </Text>

          {selectedCalendarDate ? (
            <View style={styles.dateFilterRow}>
              <View style={[styles.dateFilterPill, { backgroundColor: colors.primaryLight }]}>
                <Text
                  style={[styles.dateFilterLabel, { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {formatCalendarDateLabel(selectedCalendarDate)}
                </Text>
                <TouchableOpacity
                  onPress={clearCalendarFilter}
                  hitSlop={8}
                  style={styles.clearFilterBtn}
                >
                  <Text style={[styles.clearFilterText, { color: colors.primary }]}>
                    {"\u00D7"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  if (moodEntries.length === 0 && wellnessEntries.length === 0 && !isLoading) {
    return (
      <ScreenLayout gradientKey="insights">
        {renderHeader()}
        {viewMode === "calendar" ? (
          <MoodCalendarView onSelectDateForTimeline={handleSelectDateForTimeline} />
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
              <History color={colors.primary} size={40} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No history entries yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Your mood and wellness check-ins from Home will appear here in a timeline.
            </Text>
          </View>
        )}
        <CalendarModal
          visible={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          onSelectDate={(dateStr) => {
            setSelectedCalendarDate(dateStr);
            setCalendarModalVisible(false);
          }}
          colors={colors}
          initialDate={
            selectedCalendarDate
              ? new Date(selectedCalendarDate + "T12:00:00")
              : undefined
          }
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout gradientKey="insights">
      {renderHeader()}

      {viewMode === "calendar" ? (
        <MoodCalendarView onSelectDateForTimeline={handleSelectDateForTimeline} />
      ) : (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {sections.order.map((dateLabel) => {
          const entries = sections.map.get(dateLabel) ?? [];
          if (entries.length === 0) return null;
          return (
            <View key={dateLabel} style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.textMuted },
                ]}
              >
                {dateLabel}
              </Text>
              {entries.map((entry, idx) => {
                if (entry.kind === "mood") {
                  return (
                    <MoodCard
                      key={entry.id}
                      entry={entry.moodEntry}
                      index={idx}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      onPress={() => handleEntryPress(entry.id)}
                    />
                  );
                }

                return (
                  <WellnessCard
                    key={entry.id}
                    entry={entry.wellnessEntry}
                    index={idx}
                    colors={colors}
                    isDarkMode={isDarkMode}
                  />
                );
              })}
            </View>
          );
        })}
      </ScrollView>
      )}
      <CalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={(dateStr) => {
          setSelectedCalendarDate(dateStr);
          setCalendarModalVisible(false);
        }}
        colors={colors}
        initialDate={
          selectedCalendarDate
            ? new Date(selectedCalendarDate + "T12:00:00")
            : undefined
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    flex: 1,
  },
  calendarIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  viewModeRow: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 16,
  },
  viewModeBtnWrap: {
    flex: 1,
  },
  viewModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  viewModeBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
  },
  filterBtnActive: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  dateFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  dateFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 50,
    gap: 6,
  },
  dateFilterLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  clearFilterBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clearFilterText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  entryCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  entryEmoji: {
    fontSize: 24,
  },
  entryMain: {
    flex: 1,
  },
  entryMood: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  entryDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  stressPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 50,
  },
  stressPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  entryActivities: {
    fontSize: 13,
    flex: 1,
  },
  entryNote: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    lineHeight: 20,
  },
  wellnessPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  wellnessPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  wellnessPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 29, 46, 0.5)",
    justifyContent: "center",
    padding: 24,
  },
  calendarModalContent: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  calendarModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calendarModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  calendarDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  calendarModalClose: {
    fontSize: 15,
    fontWeight: "600",
  },
  webDatePickerWrap: {
    minHeight: 48,
    paddingHorizontal: 4,
  },
});
