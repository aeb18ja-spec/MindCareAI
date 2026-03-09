import Header from "@/components/Header";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MOOD_CONFIG, MoodType } from "@/types/mood";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACTIVITIES = [
  "Work",
  "Exercise",
  "Social",
  "Sleep",
  "Meditation",
  "Hobbies",
  "Family",
];

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { getMoodById, updateMoodEntry, deleteMoodEntry, refetchMoods, isLoading } =
    useMood();

  const entry = id ? getMoodById(id) : null;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editMood, setEditMood] = useState<MoodType | null>(null);
  const [editStress, setEditStress] = useState(5);
  const [editNote, setEditNote] = useState("");
  const [editActivities, setEditActivities] = useState<string[]>([]);

  const openEdit = useCallback(() => {
    if (!entry) return;
    setEditMood(entry.mood);
    setEditStress(entry.stressLevel);
    setEditNote(entry.note ?? "");
    setEditActivities(entry.activities ?? []);
    setEditModalVisible(true);
  }, [entry]);

  const closeEdit = useCallback(() => {
    setEditModalVisible(false);
  }, []);

  const toggleActivity = useCallback((activity: string) => {
    setEditActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!id || !editMood) return;
    setSaving(true);
    try {
      await updateMoodEntry(id, {
        mood: editMood,
        stressLevel: editStress,
        note: editNote.trim() || undefined,
        activities:
          editActivities.length > 0 ? editActivities : undefined,
      });
      await refetchMoods();
      closeEdit();
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to update mood."
      );
    } finally {
      setSaving(false);
    }
  }, [
    id,
    editMood,
    editStress,
    editNote,
    editActivities,
    updateMoodEntry,
    refetchMoods,
    closeEdit,
  ]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      "Delete mood entry",
      "Are you sure you want to delete this mood entry? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteMoodEntry(id);
              router.back();
            } catch (e) {
              Alert.alert(
                "Error",
                e instanceof Error ? e.message : "Failed to delete mood."
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [id, deleteMoodEntry, router]);

  const goBack = useCallback(() => router.back(), [router]);

  if (id === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Invalid mood</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.notFound, { color: colors.textSecondary }]}>
              Loading…
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.notFound, { color: colors.text }]}>
              Mood entry not found
            </Text>
            <TouchableOpacity
              onPress={goBack}
              style={[styles.backBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.backBtnText}>Go back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const config = MOOD_CONFIG[entry.mood];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header onBurgerPress={goBack} onProfilePress={() => {}} />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
            <View style={styles.moodHeader}>
              <Text style={styles.emoji}>{config?.emoji ?? "😐"}</Text>
              <Text style={[styles.moodLabel, { color: colors.text }]}>
                {config?.label ?? entry.mood}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {formatDate(entry.date)}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                Time
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {formatTime(entry.createdAt)}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                Stress level
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {entry.stressLevel}/10
              </Text>
            </View>
            {entry.activities && entry.activities.length > 0 && (
              <View style={styles.meta}>
                <Text
                  style={[styles.metaLabel, { color: colors.textSecondary }]}
                >
                  Activities
                </Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {entry.activities.join(", ")}
                </Text>
              </View>
            )}
            {entry.note ? (
              <View style={styles.meta}>
                <Text
                  style={[styles.metaLabel, { color: colors.textSecondary }]}
                >
                  Note
                </Text>
                <Text style={[styles.noteText, { color: colors.text }]}>
                  {entry.note}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={openEdit}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Pencil color="#FFFFFF" size={20} />
              <Text style={styles.actionBtnText}>Edit mood</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: "transparent",
                  borderColor: colors.danger,
                },
              ]}
            >
              <Trash2 color={colors.danger} size={20} />
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>
                {deleting ? "Deleting…" : "Delete mood"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeEdit}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <SafeAreaView edges={["bottom"]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit mood
              </Text>
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  Mood
                </Text>
                <View style={styles.moodRow}>
                  {(Object.keys(MOOD_CONFIG) as MoodType[]).map((m) => {
                    const c = MOOD_CONFIG[m];
                    const selected = editMood === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setEditMood(m)}
                        style={[
                          styles.moodChip,
                          {
                            backgroundColor: selected
                              ? colors.primary
                              : isDarkMode
                                ? colors.background
                                : "#F9FAFB",
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <Text style={styles.moodChipEmoji}>{c.emoji}</Text>
                        <Text
                          style={[
                            styles.moodChipLabel,
                            { color: selected ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  Stress (1–10)
                </Text>
                <View style={styles.stressRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setEditStress(n)}
                      style={[
                        styles.stressBtn,
                        {
                          backgroundColor:
                            editStress === n ? colors.primary : colors.background,
                          borderColor:
                            editStress === n ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stressBtnText,
                          {
                            color:
                              editStress === n ? "#FFFFFF" : colors.textSecondary,
                          },
                        ]}
                      >
                        {n}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  Activities
                </Text>
                <View style={styles.activitiesRow}>
                  {ACTIVITIES.map((a) => {
                    const selected = editActivities.includes(a);
                    return (
                      <TouchableOpacity
                        key={a}
                        onPress={() => toggleActivity(a)}
                        style={[
                          styles.activityChip,
                          {
                            backgroundColor: selected
                              ? colors.primary
                              : colors.background,
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.activityChipText,
                            {
                              color: selected ? "#FFFFFF" : colors.textSecondary,
                            },
                          ]}
                        >
                          {a}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                  Note
                </Text>
                <TextInput
                  value={editNote}
                  onChangeText={setEditNote}
                  placeholder="How were you feeling?"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={closeEdit}
                  style={[
                    styles.modalBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={saving || !editMood}
                  style={[
                    styles.modalBtn,
                    { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>
                    {saving ? "Saving…" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFound: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginRight: 16,
  },
  moodLabel: {
    fontSize: 24,
    fontWeight: "700",
  },
  meta: {
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalScroll: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  moodChipEmoji: {
    fontSize: 18,
  },
  moodChipLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  stressRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stressBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stressBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
