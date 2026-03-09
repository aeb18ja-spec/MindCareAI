import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { MoodEntry } from "@/types/mood";
import { MOOD_CONFIG } from "@/types/mood";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  /** When user taps "View in timeline" for a date, switch to timeline with this date selected */
  onSelectDateForTimeline?: (dateStr: string) => void;
};

export default function MoodCalendarView({
  onSelectDateForTimeline,
}: MoodCalendarViewProps) {
  const { moodEntries } = useMood();
  const { colors } = useTheme();
  const router = useRouter();
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [modalDate, setModalDate] = useState<string | null>(null);

  /** Map dateStr -> most recent mood entry (moodEntries are already ordered by created_at DESC) */
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
    <View style={styles.container}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goPrev} style={styles.navBtn} hitSlop={12}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {monthLabel}
        </Text>
        <TouchableOpacity onPress={goNext} style={styles.navBtn} hitSlop={12}>
          <ChevronRight color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <Text
            key={d}
            style={[styles.weekdayCell, { color: colors.textSecondary }]}
          >
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          const entry = moodByDate.get(cell.dateStr);
          const moodColor = entry
            ? MOOD_CONFIG[entry.mood]?.color ?? colors.border
            : null;
          const isCurrentMonth = cell.type === "current";
          return (
            <TouchableOpacity
              key={`${cell.dateStr}-${index}`}
              onPress={() => handleDayPress(cell.dateStr)}
              style={[
                styles.dayCell,
                {
                  backgroundColor: moodColor ?? (isCurrentMonth ? colors.background : "transparent"),
                  borderColor: colors.border,
                  opacity: isCurrentMonth ? 1 : 0.5,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  {
                    color: isCurrentMonth ? colors.text : colors.textSecondary,
                  },
                ]}
              >
                {cell.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.legend, { borderColor: colors.border }]}>
        <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>
          Mood
        </Text>
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

      <Modal
        visible={modalDate !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {modalDate ? formatDateLabel(modalDate) : ""}
            </Text>
            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {entriesForModal.length === 0 ? (
                <Text
                  style={[styles.modalEmpty, { color: colors.textSecondary }]}
                >
                  No mood entries this day
                </Text>
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
                      style={[
                        styles.modalEntry,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.modalEntryEmoji}>
                        {config?.emoji ?? "😐"}
                      </Text>
                      <View style={styles.modalEntryBody}>
                        <Text
                          style={[styles.modalEntryMood, { color: colors.text }]}
                        >
                          {config?.label ?? entry.mood} —{" "}
                          {formatTime(entry.createdAt)}
                        </Text>
                        <Text
                          style={[
                            styles.modalEntryStress,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Stress: {entry.stressLevel}/10
                        </Text>
                      </View>
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
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={viewInTimeline}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>
                  View in timeline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    maxWidth: 44,
    maxHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: "600",
  },
  legend: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    padding: 20,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "70%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalScroll: {
    maxHeight: 280,
    marginBottom: 16,
  },
  modalEmpty: {
    fontSize: 15,
  },
  modalEntry: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalEntryEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  modalEntryBody: {
    flex: 1,
  },
  modalEntryMood: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalEntryStress: {
    fontSize: 13,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
