import ScreenLayout from "@/components/ScreenLayout";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { generateText } from "@rork-ai/toolkit-sdk";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
    Calendar,
    Clock,
    Feather,
    MoreVertical,
    Plus,
    Sparkles,
    X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    Animated,
    FlatList,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMOTION_TAGS = [
  "Happy",
  "Sad",
  "Anxious",
  "Grateful",
  "Angry",
  "Peaceful",
  "Excited",
  "Overwhelmed",
];

export default function JournalScreen() {
  const { journalEntries, addJournalEntry, refetchJournal } = useMood();
  const { colors, isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [refreshing, setRefreshing] = useState(false);

  const analyzeEmotionsMutation = useMutation({
    mutationFn: async (text: string) => {
      const result = await generateText({
        messages: [
          {
            role: "user",
            content: `Analyze this journal entry and provide a brief, supportive insight (max 2 sentences):\n\n"${text}"`,
          },
        ],
      });
      return result;
    },
  });

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    let aiInsights: string | undefined;
    if (content.length > 50) {
      try {
        aiInsights = await analyzeEmotionsMutation.mutateAsync(content);
      } catch (error) {
        console.log("Failed to generate insights:", error);
      }
    }

    try {
      await addJournalEntry({
        date: new Date().toISOString(),
        title: title.trim(),
        content: content.trim(),
        emotions: selectedEmotions,
        aiInsights,
      });
      setTitle("");
      setContent("");
      setSelectedEmotions([]);
      setModalVisible(false);
    } catch (err) {
      console.error("Failed to save journal entry:", err);
    }
  };

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchJournal();
    setRefreshing(false);
  }, [refetchJournal]);

  // Animation for new entries
  React.useEffect(() => {
    if (journalEntries.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    }
  }, [journalEntries.length]);

  return (
    <ScreenLayout gradientKey="journal">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Sparkles color={colors.primary} size={26} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Journal
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButtonWrapper,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
          onPress={() => setModalVisible(true)}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <LinearGradient
            colors={colors.gradient.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <Plus color="#FFFFFF" size={24} />
          </LinearGradient>
        </Pressable>
      </View>

      {journalEntries.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyState}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Feather color={colors.primary} size={56} />
            </View>
          </Animated.View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Start Your Journey
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Write down your thoughts, feelings, and experiences. Your journal
            is a safe space for reflection and growth.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.emptyActionWrapper,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyActionButton}
            >
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.emptyActionText}>Write your first entry</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        /* Entry List */
        <FlatList
          data={journalEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.entriesContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              title="Pull to refresh"
              titleColor={colors.text}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              style={[
                styles.entryCard,
                {
                  backgroundColor: colors.card,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
                isDarkMode
                  ? { borderWidth: 1, borderColor: colors.border }
                  : {
                      boxShadow:
                        "0px 2px 16px rgba(108, 99, 255, 0.08)",
                      elevation: 3,
                    },
              ]}
            >
              {/* Title Row */}
              <View style={styles.entryHeader}>
                <View style={styles.entryTitleRow}>
                  <Text
                    style={[styles.entryTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <TouchableOpacity style={styles.menuButton}>
                    <MoreVertical color={colors.textMuted} size={20} />
                  </TouchableOpacity>
                </View>

                {/* Date/Time Pill */}
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.metaPill,
                      {
                        backgroundColor: isDarkMode
                          ? colors.primaryLight
                          : colors.borderLight,
                      },
                    ]}
                  >
                    <Calendar color={colors.textMuted} size={13} />
                    <Text
                      style={[styles.metaPillText, { color: colors.textSecondary }]}
                    >
                      {formatDate(item.date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metaPill,
                      {
                        backgroundColor: isDarkMode
                          ? colors.primaryLight
                          : colors.borderLight,
                      },
                    ]}
                  >
                    <Clock color={colors.textMuted} size={13} />
                    <Text
                      style={[styles.metaPillText, { color: colors.textSecondary }]}
                    >
                      {formatTime(item.date)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Emotion Tags */}
              {item.emotions.length > 0 && (
                <View style={styles.emotionTags}>
                  {item.emotions.map((emotion, idx) => (
                    <LinearGradient
                      key={`${item.id}-${idx}-${emotion}`}
                      colors={colors.gradient.accent as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.emotionTagGradient}
                    >
                      <Text style={styles.emotionTagText}>{emotion}</Text>
                    </LinearGradient>
                  ))}
                </View>
              )}

              {/* Content Preview */}
              <Text
                style={[styles.entryContent, { color: colors.textSecondary }]}
                numberOfLines={4}
              >
                {item.content}
              </Text>

              {/* AI Insight */}
              {item.aiInsights && (
                <View style={styles.aiInsightContainer}>
                  <LinearGradient
                    colors={colors.gradient.primary as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.aiInsightBorder}
                  />
                  <View
                    style={[
                      styles.aiInsightContent,
                      {
                        backgroundColor: isDarkMode
                          ? colors.primaryLight
                          : colors.shimmer,
                      },
                    ]}
                  >
                    <View style={styles.aiInsightHeader}>
                      <Sparkles color={colors.primary} size={15} />
                      <Text
                        style={[
                          styles.aiInsightTitle,
                          { color: colors.primary },
                        ]}
                      >
                        AI Insight
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.aiInsightText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.aiInsights}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        />
      )}

      {/* New Entry Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={
            isDarkMode ? colors.gradient.journal : colors.gradient.journal
          }
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New Entry
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(108, 99, 255, 0.08)",
                  },
                  { transform: [{ scale: pressed ? 0.92 : 1 }] },
                ]}
              >
                <X color={colors.textSecondary} size={22} />
              </Pressable>
            </View>
            {/* Gradient Divider */}
            <LinearGradient
              colors={colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalDivider}
            />

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Title
                </Text>
                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      backgroundColor: isDarkMode
                        ? colors.surface
                        : colors.borderLight,
                      color: colors.text,
                    },
                    isDarkMode && {
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Give your entry a meaningful title..."
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  accessibilityLabel="Entry title"
                  accessibilityHint="Give your journal entry a title"
                />
              </View>

              {/* Emotion Selector */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  How are you feeling?
                </Text>
                <View style={styles.emotionGrid}>
                  {EMOTION_TAGS.map((emotion) => {
                    const isSelected = selectedEmotions.includes(emotion);
                    return isSelected ? (
                      <Pressable
                        key={emotion}
                        style={({ pressed }) => [
                          styles.emotionButtonOuter,
                          { transform: [{ scale: pressed ? 0.93 : 1 }] },
                        ]}
                        onPress={() => toggleEmotion(emotion)}
                        android_ripple={{
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        <LinearGradient
                          colors={colors.gradient.primary as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.emotionButtonGradient}
                        >
                          <Text style={styles.emotionButtonTextSelected}>
                            {emotion}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    ) : (
                      <Pressable
                        key={emotion}
                        style={({ pressed }) => [
                          styles.emotionButtonUnselected,
                          {
                            backgroundColor: isDarkMode
                              ? colors.surface
                              : colors.borderLight,
                          },
                          isDarkMode && {
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                          { transform: [{ scale: pressed ? 0.93 : 1 }] },
                        ]}
                        onPress={() => toggleEmotion(emotion)}
                        android_ripple={{
                          color: "rgba(0,0,0,0.1)",
                        }}
                      >
                        <Text
                          style={[
                            styles.emotionButtonText,
                            { color: colors.text },
                          ]}
                        >
                          {emotion}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Thoughts Textarea */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Your Thoughts
                </Text>
                <TextInput
                  style={[
                    styles.thoughtsInput,
                    {
                      backgroundColor: isDarkMode
                        ? colors.surface
                        : colors.borderLight,
                      color: colors.text,
                    },
                    isDarkMode && {
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Express your thoughts freely..."
                  placeholderTextColor={colors.textMuted}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Journal content"
                  accessibilityHint="Write your thoughts and feelings"
                />
              </View>

              {/* Save Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  (!title.trim() || !content.trim()) && styles.disabledButton,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
                onPress={handleSave}
                disabled={
                  !title.trim() ||
                  !content.trim() ||
                  analyzeEmotionsMutation.isPending
                }
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                accessibilityLabel="Save journal entry"
                accessibilityRole="button"
                accessibilityHint="Save your journal entry"
              >
                <LinearGradient
                  colors={colors.gradient.button as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {analyzeEmotionsMutation.isPending
                      ? "Analyzing Thoughts..."
                      : "Save Entry"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  /* ---- Header ---- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  addButtonWrapper: {
    borderRadius: 26,
    overflow: "hidden",
  },
  addButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 14px rgba(108, 99, 255, 0.35)",
    elevation: 4,
  },

  /* ---- Empty State ---- */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 44,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 36,
  },
  emptyActionWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },

  /* ---- Entry List ---- */
  entriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* ---- Entry Card ---- */
  entryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  entryHeader: {
    marginBottom: 14,
  },
  entryTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  entryTitle: {
    fontSize: 19,
    fontWeight: "700" as const,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  menuButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },

  /* ---- Emotion Tags (on cards) ---- */
  emotionTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  emotionTagGradient: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  emotionTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600" as const,
  },

  /* ---- Entry Content ---- */
  entryContent: {
    fontSize: 15,
    lineHeight: 24,
  },

  /* ---- AI Insight ---- */
  aiInsightContainer: {
    marginTop: 16,
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
  },
  aiInsightBorder: {
    width: 4,
  },
  aiInsightContent: {
    flex: 1,
    padding: 14,
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  aiInsightTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  aiInsightText: {
    fontSize: 14,
    lineHeight: 22,
  },

  /* ---- Modal ---- */
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: {
    height: 2,
    marginHorizontal: 24,
    borderRadius: 1,
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* ---- Form ---- */
  formSection: {
    marginBottom: 28,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  titleInput: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
  },

  /* ---- Emotion Selector (in modal) ---- */
  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emotionButtonOuter: {
    borderRadius: 50,
    overflow: "hidden",
  },
  emotionButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 50,
  },
  emotionButtonUnselected: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 50,
  },
  emotionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  emotionButtonTextSelected: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },

  /* ---- Thoughts Input ---- */
  thoughtsInput: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 200,
    lineHeight: 24,
  },

  /* ---- Save Button ---- */
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.45,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});
