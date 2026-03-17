import Header from "@/components/Header";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MOOD_CONFIG, MoodType } from "@/types/mood";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
    View
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
  if (!iso) return "\u2014";
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
              Loading\u2026
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.notFound, { color: colors.text }]}>
              Mood entry not found
            </Text>
            <TouchableOpacity
              onPress={goBack}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradient?.button ?? ['#6C63FF', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.backBtn}
              >
                <Text style={styles.backBtnText}>Go back</Text>
              </LinearGradient>
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
          {/* Main Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
              },
              isDarkMode
                ? { borderColor: colors.border, borderWidth: 1 }
                : {
                    shadowColor: '#6C63FF',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    elevation: 5,
                  },
            ]}
          >
            {/* Mood Header */}
            <View style={styles.moodHeader}>
              <View style={[styles.emojiWrap, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.emoji}>{config?.emoji ?? "\uD83D\uDE10"}</Text>
              </View>
              <View style={styles.moodHeaderText}>
                <Text style={[styles.moodLabel, { color: colors.text }]}>
                  {config?.label ?? entry.mood}
                </Text>
                <Text style={[styles.moodSub, { color: colors.textMuted }]}>
                  Current mood
                </Text>
              </View>
            </View>

            {/* Separator */}
            <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

            {/* Meta Rows */}
            <View style={styles.metaSection}>
              <View style={styles.meta}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                  DATE
                </Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {formatDate(entry.date)}
                </Text>
              </View>
              <View style={[styles.metaSeparator, { backgroundColor: colors.borderLight }]} />

              <View style={styles.meta}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                  TIME
                </Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {formatTime(entry.createdAt)}
                </Text>
              </View>
              <View style={[styles.metaSeparator, { backgroundColor: colors.borderLight }]} />

              <View style={styles.meta}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                  STRESS LEVEL
                </Text>
                <View style={styles.stressValueRow}>
                  <Text style={[styles.metaValue, { color: colors.text }]}>
                    {entry.stressLevel}
                  </Text>
                  <Text style={[styles.stressMax, { color: colors.textMuted }]}>
                    /10
                  </Text>
                </View>
              </View>

              {entry.activities && entry.activities.length > 0 && (
                <>
                  <View style={[styles.metaSeparator, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.meta}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                      ACTIVITIES
                    </Text>
                    <View style={styles.activityTagsRow}>
                      {entry.activities.map((act) => (
                        <View key={act} style={[styles.activityTag, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.activityTagText, { color: colors.primary }]}>
                            {act}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {entry.note ? (
                <>
                  <View style={[styles.metaSeparator, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.meta}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                      NOTE
                    </Text>
                    <Text style={[styles.noteText, { color: colors.text }]}>
                      {entry.note}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={openEdit}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradient?.button ?? ['#6C63FF', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.editBtn}
              >
                <Pencil color="#FFFFFF" size={18} />
                <Text style={styles.editBtnText}>Edit mood</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.7}
              style={[
                styles.deleteBtn,
                { backgroundColor: colors.dangerLight },
              ]}
            >
              <Trash2 color={colors.danger} size={18} />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
                {deleting ? "Deleting\u2026" : "Delete mood"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeEdit}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
              },
              isDarkMode
                ? { borderColor: colors.border, borderWidth: 1 }
                : {
                    shadowColor: '#6C63FF',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 24,
                    elevation: 12,
                  },
            ]}
          >
            <SafeAreaView edges={["bottom"]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Edit mood
                </Text>
                <View style={[styles.modalHeaderBar, { backgroundColor: colors.border }]} />
              </View>

              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                {/* Mood Selection */}
                <Text style={[styles.editLabel, { color: colors.textMuted }]}>
                  MOOD
                </Text>
                <View style={styles.moodRow}>
                  {(Object.keys(MOOD_CONFIG) as MoodType[]).map((m) => {
                    const c = MOOD_CONFIG[m];
                    const selected = editMood === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setEditMood(m)}
                        activeOpacity={0.8}
                      >
                        {selected ? (
                          <LinearGradient
                            colors={colors.gradient?.primary ?? ['#6C63FF', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.moodChip}
                          >
                            <Text style={styles.moodChipEmoji}>{c.emoji}</Text>
                            <Text style={[styles.moodChipLabel, { color: '#FFFFFF' }]}>
                              {c.label}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View
                            style={[
                              styles.moodChip,
                              {
                                backgroundColor: isDarkMode
                                  ? colors.background
                                  : colors.borderLight,
                              },
                            ]}
                          >
                            <Text style={styles.moodChipEmoji}>{c.emoji}</Text>
                            <Text
                              style={[styles.moodChipLabel, { color: colors.text }]}
                            >
                              {c.label}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Stress Selection */}
                <Text style={[styles.editLabel, { color: colors.textMuted }]}>
                  STRESS (1\u201310)
                </Text>
                <View style={styles.stressRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setEditStress(n)}
                      activeOpacity={0.8}
                    >
                      {editStress === n ? (
                        <LinearGradient
                          colors={colors.gradient?.primary ?? ['#6C63FF', '#8B5CF6']}
                          style={styles.stressBtn}
                        >
                          <Text style={[styles.stressBtnText, { color: '#FFFFFF' }]}>
                            {n}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.stressBtn,
                            {
                              backgroundColor: isDarkMode
                                ? colors.background
                                : colors.borderLight,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.stressBtnText, { color: colors.textSecondary }]}
                          >
                            {n}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Activities Selection */}
                <Text style={[styles.editLabel, { color: colors.textMuted }]}>
                  ACTIVITIES
                </Text>
                <View style={styles.activitiesRow}>
                  {ACTIVITIES.map((a) => {
                    const selected = editActivities.includes(a);
                    return (
                      <TouchableOpacity
                        key={a}
                        onPress={() => toggleActivity(a)}
                        activeOpacity={0.8}
                      >
                        {selected ? (
                          <LinearGradient
                            colors={colors.gradient?.primary ?? ['#6C63FF', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.activityChip}
                          >
                            <Text style={[styles.activityChipText, { color: '#FFFFFF' }]}>
                              {a}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View
                            style={[
                              styles.activityChip,
                              {
                                backgroundColor: isDarkMode
                                  ? colors.background
                                  : colors.borderLight,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.activityChipText, { color: colors.textSecondary }]}
                            >
                              {a}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Note Input */}
                <Text style={[styles.editLabel, { color: colors.textMuted }]}>
                  NOTE
                </Text>
                <TextInput
                  value={editNote}
                  onChangeText={setEditNote}
                  placeholder="How were you feeling?"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: isDarkMode ? colors.background : colors.borderLight,
                      color: colors.text,
                    },
                  ]}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              {/* Modal Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={closeEdit}
                  style={[
                    styles.modalCancelBtn,
                    { backgroundColor: isDarkMode ? colors.background : colors.borderLight },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={saving || !editMood}
                  activeOpacity={0.8}
                  style={styles.modalSaveBtnWrap}
                >
                  <LinearGradient
                    colors={colors.gradient?.button ?? ['#6C63FF', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.modalSaveBtn,
                      (saving || !editMood) && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={styles.modalSaveBtnText}>
                      {saving ? "Saving\u2026" : "Save"}
                    </Text>
                  </LinearGradient>
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
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  emojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  emoji: {
    fontSize: 40,
  },
  moodHeaderText: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  moodSub: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginBottom: 20,
  },
  metaSection: {},
  meta: {
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  stressValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  stressMax: {
    fontSize: 14,
    fontWeight: "500",
  },
  metaSeparator: {
    height: 1,
    marginVertical: 14,
  },
  activityTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  activityTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
  },
  activityTagText: {
    fontSize: 13,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  modalHeaderBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    alignSelf: "flex-start",
  },
  modalScroll: {
    maxHeight: 400,
    paddingHorizontal: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveBtnWrap: {
    flex: 1,
  },
  modalSaveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  editLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 16,
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  noteInput: {
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
