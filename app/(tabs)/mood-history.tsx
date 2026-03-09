import MoodCalendarView from "@/components/MoodCalendarView";
import ScreenLayout from "@/components/ScreenLayout";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { MoodEntry } from "@/types/mood";
import { MOOD_CONFIG } from "@/types/mood";
import { useRouter } from "expo-router";
import { Calendar as CalendarIcon, History, List, LayoutGrid } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  return t.length <= maxLen ? t : t.slice(0, maxLen) + "…";
}

function filterEntriesByRange(
  entries: MoodEntry[],
  filter: MoodHistoryFilter
): MoodEntry[] {
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
      padding: 12px;
      font-size: 16px;
      border-radius: 8px;
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
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.calendarModalHeader}>
            <Text style={[styles.calendarModalTitle, { color: colors.text }]}>
              Select date
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
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
  index,
}: {
  entry: MoodEntry;
  onPress: () => void;
  colors: Record<string, string>;
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
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.entryRow}>
          <Text style={styles.entryEmoji}>{config?.emoji ?? "😐"}</Text>
          <View style={styles.entryMain}>
            <Text style={[styles.entryMood, { color: colors.text }]}>
              {config?.label ?? entry.mood} — {timeStr || "—"}
            </Text>
            <Text
              style={[styles.entryStress, { color: colors.textSecondary }]}
            >
              Stress: {entry.stressLevel}/10
            </Text>
            {entry.activities && entry.activities.length > 0 ? (
              <Text
                style={[styles.entryActivities, { color: colors.textSecondary }]}
              >
                Activities: {entry.activities.join(", ")}
              </Text>
            ) : null}
            {preview ? (
              <Text
                style={[styles.entryNote, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                Note: {preview}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MoodHistoryScreen() {
  const { moodEntries, refetchMoods, isLoading } = useMood();
  const { colors } = useTheme();
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
    await refetchMoods();
    setRefreshing(false);
  }, [refetchMoods]);

  const filteredEntries = useMemo(() => {
    const byRange = filterEntriesByRange(moodEntries, filter);
    if (selectedCalendarDate) {
      return byRange.filter((e) => e.date === selectedCalendarDate);
    }
    return byRange;
  }, [moodEntries, filter, selectedCalendarDate]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, MoodEntry[]>();
    for (const entry of filteredEntries) {
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
  }, [filteredEntries]);

  const sections = useMemo(() => {
    const map = new Map<string, MoodEntry[]>();
    for (const entry of filteredEntries) {
      const label = getDateLabel(entry.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(entry);
    }
    return { map, order: groupedByDate };
  }, [filteredEntries, groupedByDate]);

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

  if (moodEntries.length === 0 && !isLoading) {
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
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Mood History
            </Text>
            <TouchableOpacity
              onPress={openCalendar}
              style={[styles.calendarIconBtn, { backgroundColor: colors.background }]}
              accessibilityLabel="Open calendar to search by date"
            >
              <CalendarIcon color={colors.primary} size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.viewModeRow}>
            <TouchableOpacity
              onPress={() => setViewMode("timeline")}
              style={[
                styles.viewModeBtn,
                {
                  backgroundColor:
                    viewMode === "timeline" ? colors.primary : colors.background,
                  borderColor:
                    viewMode === "timeline" ? colors.primary : colors.border,
                },
              ]}
            >
              <List
                color={viewMode === "timeline" ? "#FFFFFF" : colors.textSecondary}
                size={18}
              />
              <Text
                style={[
                  styles.viewModeBtnText,
                  {
                    color:
                      viewMode === "timeline" ? "#FFFFFF" : colors.textSecondary,
                  },
                ]}
              >
                Timeline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("calendar")}
              style={[
                styles.viewModeBtn,
                {
                  backgroundColor:
                    viewMode === "calendar" ? colors.primary : colors.background,
                  borderColor:
                    viewMode === "calendar" ? colors.primary : colors.border,
                },
              ]}
            >
              <LayoutGrid
                color={viewMode === "calendar" ? "#FFFFFF" : colors.textSecondary}
                size={18}
              />
              <Text
                style={[
                  styles.viewModeBtnText,
                  {
                    color:
                      viewMode === "calendar" ? "#FFFFFF" : colors.textSecondary,
                  },
                ]}
              >
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {viewMode === "calendar" ? (
          <MoodCalendarView onSelectDateForTimeline={handleSelectDateForTimeline} />
        ) : (
          <View style={styles.emptyState}>
            <History color={colors.primary} size={64} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No mood entries yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Your mood check-ins from Home will appear here in a timeline.
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
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mood History
          </Text>
          <TouchableOpacity
            onPress={openCalendar}
            style={[styles.calendarIconBtn, { backgroundColor: colors.background }]}
            accessibilityLabel="Open calendar to search by date"
          >
            <CalendarIcon color={colors.primary} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.viewModeRow}>
          <TouchableOpacity
            onPress={() => setViewMode("timeline")}
            style={[
              styles.viewModeBtn,
              {
                backgroundColor:
                  viewMode === "timeline" ? colors.primary : colors.background,
                borderColor: viewMode === "timeline" ? colors.primary : colors.border,
              },
            ]}
          >
            <List
              color={viewMode === "timeline" ? "#FFFFFF" : colors.textSecondary}
              size={18}
            />
            <Text
              style={[
                styles.viewModeBtnText,
                {
                  color: viewMode === "timeline" ? "#FFFFFF" : colors.textSecondary,
                },
              ]}
            >
              Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("calendar")}
            style={[
              styles.viewModeBtn,
              {
                backgroundColor:
                  viewMode === "calendar" ? colors.primary : colors.background,
                borderColor: viewMode === "calendar" ? colors.primary : colors.border,
              },
            ]}
          >
            <LayoutGrid
              color={viewMode === "calendar" ? "#FFFFFF" : colors.textSecondary}
              size={18}
            />
            <Text
              style={[
                styles.viewModeBtnText,
                {
                  color: viewMode === "calendar" ? "#FFFFFF" : colors.textSecondary,
                },
              ]}
            >
              Calendar
            </Text>
          </TouchableOpacity>
        </View>
        {viewMode === "timeline" && (
          <>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {filteredEntries.length}{" "}
              {filteredEntries.length === 1 ? "entry" : "entries"}
            </Text>
            {selectedCalendarDate ? (
              <View style={styles.dateFilterRow}>
                <Text
                  style={[styles.dateFilterLabel, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Showing moods for {formatCalendarDateLabel(selectedCalendarDate)}
                </Text>
                <TouchableOpacity
                  onPress={clearCalendarFilter}
                  style={[styles.clearFilterBtn, { borderColor: colors.primary }]}
                >
                  <Text style={[styles.clearFilterText, { color: colors.primary }]}>
                    Clear filter
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.filterRow}>
              {FILTER_BTNS.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setFilter(key)}
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor:
                        filter === key ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      {
                        color: filter === key ? "#FFFFFF" : colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

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
                  { color: colors.textSecondary },
                ]}
              >
                {dateLabel}
              </Text>
              {entries.map((entry, idx) => (
                <MoodCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  colors={colors}
                  onPress={() => handleEntryPress(entry.id)}
                />
              ))}
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  calendarIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  viewModeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewModeBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  dateFilterLabel: {
    fontSize: 14,
    flex: 1,
    minWidth: 0,
  },
  clearFilterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  entryCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  entryEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  entryMain: {
    flex: 1,
  },
  entryMood: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  entryStress: {
    fontSize: 14,
    marginBottom: 2,
  },
  entryActivities: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 2,
  },
  entryNote: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  calendarModalContent: {
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
  },
  calendarModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  calendarModalClose: {
    fontSize: 16,
    fontWeight: "600",
  },
  webDatePickerWrap: {
    minHeight: 48,
    paddingHorizontal: 4,
  },
});
