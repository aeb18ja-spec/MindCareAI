import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { MoodEntry } from "@/types/mood";
import { MOOD_CONFIG } from "@/types/mood";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Clock, Zap } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function formatTime(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type Cell = { type: "current" | "adjacent"; dateStr: string; day: number };

function getCalendarCells(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const total = 42;
  const cells: Cell[] = [];
  const y = year;
  const m = month;
  const mStr = String(m + 1).padStart(2, "0");

  for (let i = 0; i < startPad; i++) {
    const d = new Date(y, m, -startPad + i + 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ type: "adjacent", dateStr, day: d.getDate() });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${mStr}-${String(d).padStart(2, "0")}`;
    cells.push({ type: "current", dateStr, day: d });
  }
  const remaining = total - cells.length;
  for (let i = 0; i < remaining; i++) {
    const d = new Date(y, month + 1, i + 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ type: "adjacent", dateStr, day: d.getDate() });
  }
  return cells;
}

export type MoodCalendarViewProps = {
  onSelectDateForTimeline?: (dateStr: string) => void;
};

export default function MoodCalendarView({
  onSelectDateForTimeline,
}: MoodCalendarViewProps) {
  const { moodEntries } = useMood();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [modalDate, setModalDate] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const moodByDate = useMemo(() => {
    const map = new Map<string, MoodEntry>();
    for (const e of moodEntries) {
      if (!map.has(e.date)) map.set(e.date, e);
    }
    return map;
  }, [moodEntries]);

  const cells = useMemo(
    () => getCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [viewYear, viewMonth]
  );

  const goPrev = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goNext = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleDayPress = useCallback((dateStr: string) => {
    setModalDate(dateStr);
  }, []);

  const closeModal = useCallback(() => setModalDate(null), []);

  const viewInTimeline = useCallback(() => {
    if (modalDate) {
      onSelectDateForTimeline?.(modalDate);
      closeModal();
    }
  }, [modalDate, onSelectDateForTimeline, closeModal]);

  const entriesForModal = useMemo(() => {
    if (!modalDate) return [];
    return moodEntries.filter((e) => e.date === modalDate);
  }, [modalDate, moodEntries]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.containerContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Navigation */}
      <View
        style={[
          styles.monthNav,
          { backgroundColor: isDarkMode ? colors.card : colors.surface },
          !isDarkMode && {
            shadowColor: "#6C63FF",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          },
          isDarkMode && { borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        <TouchableOpacity
          onPress={goPrev}
          style={[styles.navBtn, { backgroundColor: colors.primaryLight }]}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <ChevronLeft color={colors.primary} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {monthLabel}
        </Text>
        <TouchableOpacity
          onPress={goNext}
          style={[styles.navBtn, { backgroundColor: colors.primaryLight }]}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <ChevronRight color={colors.primary} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                { color: i === 0 || i === 6 ? colors.primary : colors.textMuted },
              ]}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {cells.map((cell, index) => {
          const entry = moodByDate.get(cell.dateStr);
          const moodColor =
            entry != null
              ? (MOOD_CONFIG[entry.mood]?.color ?? colors.border)
              : colors.border;
          const isCurrentMonth = cell.type === "current";
          const isToday = cell.dateStr === todayStr;
          const hasMood = entry != null;

          return (
            <TouchableOpacity
              key={`${cell.dateStr}-${index}`}
              onPress={() => handleDayPress(cell.dateStr)}
              activeOpacity={0.6}
              style={styles.dayCellWrap}
            >
              <View
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: hasMood
                      ? moodColor + "20"
                      : isCurrentMonth
                        ? isDarkMode
                          ? colors.surface
                          : colors.surface
                        : "transparent",
                    borderColor: isToday
                      ? colors.primary
                      : hasMood
                        ? moodColor + "40"
                        : "transparent",
                    borderWidth: isToday ? 2 : hasMood ? 1.5 : 0,
                    opacity: isCurrentMonth ? 1 : 0.35,
                  },
                  !isDarkMode &&
                    isCurrentMonth &&
                    !hasMood && {
                      shadowColor: "#6C63FF",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                    },
                ]}
              >
                {hasMood && (
                  <Text style={styles.moodEmoji}>
                    {MOOD_CONFIG[entry.mood]?.emoji}
                  </Text>
                )}
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: isToday
                        ? colors.primary
                        : hasMood
                          ? moodColor
                          : isCurrentMonth
                            ? colors.text
                            : colors.textMuted,
                      fontWeight: isToday || hasMood ? "700" : "500",
                    },
                  ]}
                >
                  {cell.day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View
        style={[
          styles.legend,
          {
            backgroundColor: isDarkMode ? colors.card : colors.surface,
            borderColor: isDarkMode ? colors.border : "transparent",
            borderWidth: isDarkMode ? 1 : 0,
          },
          !isDarkMode && {
            shadowColor: "#6C63FF",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          },
        ]}
      >
        <View style={styles.legendRow}>
          {(["great", "good", "okay", "bad", "terrible"] as const).map(
            (mood) => (
              <View key={mood} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: MOOD_CONFIG[mood].color },
                  ]}
                />
                <Text
                  style={[styles.legendText, { color: colors.textSecondary }]}
                >
                  {MOOD_CONFIG[mood].label}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Day Detail Modal */}
      <Modal
        visible={modalDate !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
              },
              isDarkMode
                ? { borderColor: colors.border, borderWidth: 1 }
                : {
                    shadowColor: "#6C63FF",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.15,
                    shadowRadius: 32,
                    elevation: 16,
                  },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalDate ? formatDateLabel(modalDate) : ""}
              </Text>
              <View
                style={[
                  styles.modalEntryCount,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text
                  style={[styles.modalEntryCountText, { color: colors.primary }]}
                >
                  {entriesForModal.length}{" "}
                  {entriesForModal.length === 1 ? "entry" : "entries"}
                </Text>
              </View>
            </View>

            {/* Gradient divider */}
            <LinearGradient
              colors={colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalDivider}
            />

            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {entriesForModal.length === 0 ? (
                <View style={styles.modalEmptyWrap}>
                  <Text
                    style={[styles.modalEmpty, { color: colors.textSecondary }]}
                  >
                    No mood entries this day
                  </Text>
                </View>
              ) : (
                entriesForModal.map((entry) => {
                  const config = MOOD_CONFIG[entry.mood];
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      onPress={() => {
                        closeModal();
                        router.push(`/mood-detail/${entry.id}`);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.modalEntry,
                        {
                          backgroundColor: isDarkMode
                            ? colors.surface
                            : config.color + "08",
                        },
                        isDarkMode && {
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.modalEntryEmojiWrap,
                          { backgroundColor: config.color + "18" },
                        ]}
                      >
                        <Text style={styles.modalEntryEmoji}>
                          {config?.emoji ?? "\uD83D\uDE10"}
                        </Text>
                      </View>
                      <View style={styles.modalEntryBody}>
                        <Text
                          style={[
                            styles.modalEntryMood,
                            { color: colors.text },
                          ]}
                        >
                          {config?.label ?? entry.mood}
                        </Text>
                        <View style={styles.modalEntryMeta}>
                          <View style={styles.modalMetaItem}>
                            <Clock
                              size={12}
                              color={colors.textMuted}
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.modalEntryTime,
                                { color: colors.textMuted },
                              ]}
                            >
                              {formatTime(entry.createdAt) || "\u2014"}
                            </Text>
                          </View>
                          <View style={styles.modalMetaItem}>
                            <Zap
                              size={12}
                              color={colors.textMuted}
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.modalEntryStress,
                                { color: colors.textMuted },
                              ]}
                            >
                              Stress {entry.stressLevel}/10
                            </Text>
                          </View>
                        </View>
                      </View>
                      <ChevronRight
                        size={16}
                        color={colors.textMuted}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeModal}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: isDarkMode
                      ? colors.surface
                      : colors.borderLight,
                  },
                  isDarkMode && {
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={viewInTimeline} activeOpacity={0.85}>
                <LinearGradient
                  colors={colors.gradient.button as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalBtnGradient}
                >
                  <Text style={styles.modalBtnTextWhite}>
                    View in timeline
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 20,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 2,
  },
  dayCellWrap: {
    width: "14.28%",
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  dayCell: {
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  moodEmoji: {
    fontSize: 14,
    marginBottom: -2,
  },
  dayNum: {
    fontSize: 12,
  },
  legend: {
    marginTop: 20,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 28,
    maxHeight: "75%",
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  modalEntryCount: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modalEntryCountText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalDivider: {
    height: 2,
    marginHorizontal: 24,
    borderRadius: 1,
    opacity: 0.4,
  },
  modalScroll: {
    maxHeight: 300,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  modalEmptyWrap: {
    paddingVertical: 28,
    alignItems: "center",
  },
  modalEmpty: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalEntry: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    gap: 14,
  },
  modalEntryEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEntryEmoji: {
    fontSize: 24,
  },
  modalEntryBody: {
    flex: 1,
  },
  modalEntryMood: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalEntryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  modalMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalEntryTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalEntryStress: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  modalBtnGradient: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalBtnTextWhite: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
