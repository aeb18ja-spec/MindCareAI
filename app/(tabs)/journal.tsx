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
    Heart,
    MoreVertical,
    Plus,
    Smile,
    Sparkles,
    ThumbsUp,
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
      <View style={styles.header}>
          <View style={styles.headerContent}>
            <Sparkles color={colors.primary} size={28} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Journal
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.secondary },
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
            onPress={() => setModalVisible(true)}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          >
            <Plus color="#FFFFFF" size={26} />
          </Pressable>
        </View>

        {journalEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Feather
                color={colors.primary}
                size={80}
                style={styles.emptyEmoji}
              />
            </Animated.View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Start Your Journey
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Write down your thoughts, feelings, and experiences. Your journal
              is a safe space for reflection.
            </Text>
            <View style={styles.emptyFooter}>
              <Heart
                color={colors.primary}
                size={24}
                style={styles.emptyHeart}
              />
              <Text
                style={[styles.emptyCaption, { color: colors.textSecondary }]}
              >
                Every thought matters
              </Text>
            </View>
          </View>
        ) : (
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
                  { backgroundColor: colors.card },
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryTitleContainer}>
                    <Text
                      style={[styles.entryTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <TouchableOpacity>
                      <MoreVertical color={colors.textSecondary} size={20} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.entryMeta}>
                    <View style={styles.metaItem}>
                      <Calendar color={colors.textSecondary} size={16} />
                      <Text
                        style={[
                          styles.metaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatDate(item.date)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock color={colors.textSecondary} size={16} />
                      <Text
                        style={[
                          styles.metaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatTime(item.date)}
                      </Text>
                    </View>
                  </View>
                </View>

                {item.emotions.length > 0 && (
                  <View style={styles.emotionTags}>
                    {item.emotions.map((emotion, index) => (
                      <View
                        key={`${item.id}-${index}-${emotion}`}
                        style={[
                          styles.emotionTag,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(124, 58, 237, 0.15)"
                              : "rgba(255, 247, 237, 0.8)",
                            borderColor: colors.secondary,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.emotionText,
                            { color: colors.secondary },
                          ]}
                        >
                          {emotion}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text
                  style={[styles.entryContent, { color: colors.textSecondary }]}
                  numberOfLines={4}
                >
                  {item.content}
                </Text>

                {item.aiInsights && (
                  <View
                    style={[
                      styles.aiInsight,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(124, 58, 237, 0.1)"
                          : "rgba(240, 244, 255, 0.7)",
                        borderLeftColor: colors.primary,
                      },
                    ]}
                  >
                    <View style={styles.aiInsightHeader}>
                      <Sparkles color={colors.primary} size={16} />
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
                )}
              </Animated.View>
            )}
          />
        )}

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
            <View
              style={[
                styles.modalHeader,
                { borderBottomWidth: 1, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New Entry
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  },
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <X color={colors.textSecondary} size={26} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Title
                </Text>
                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      backgroundColor: isDarkMode
                        ? colors.background
                        : "rgba(255, 255, 255, 0.7)",
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Give your entry a meaningful title..."
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  accessibilityLabel="Entry title"
                  accessibilityHint="Give your journal entry a title"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  How are you feeling?
                </Text>
                <View style={styles.emotionGrid}>
                  {EMOTION_TAGS.map((emotion) => {
                    const isSelected = selectedEmotions.includes(emotion);
                    return (
                      <Pressable
                        key={emotion}
                        style={({ pressed }) => [
                          styles.emotionButton,
                          {
                            backgroundColor: isDarkMode
                              ? isSelected
                                ? colors.secondary
                                : colors.background
                              : isSelected
                                ? colors.secondary
                                : "rgba(255, 255, 255, 0.7)",
                            borderColor: isSelected
                              ? colors.secondary
                              : colors.border,
                          },
                          { transform: [{ scale: pressed ? 0.95 : 1 }] },
                          {
                            boxShadow: isSelected
                              ? "0px 2px 4px rgba(249, 115, 22, 0.2)"
                              : "0px 2px 4px rgba(0, 0, 0, 0.2)",
                            elevation: 2,
                          },
                        ]}
                        onPress={() => toggleEmotion(emotion)}
                        android_ripple={{
                          color: isSelected
                            ? "rgba(249, 115, 22, 0.3)"
                            : "rgba(0,0,0,0.1)",
                        }}
                      >
                        <Text
                          style={[
                            styles.emotionButtonText,
                            { color: isSelected ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          {emotion}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Your Thoughts
                </Text>
                <TextInput
                  style={[
                    styles.thoughtsInput,
                    {
                      backgroundColor: isDarkMode
                        ? colors.background
                        : "rgba(255, 255, 255, 0.7)",
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Express your thoughts freely..."
                  placeholderTextColor={colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Journal content"
                  accessibilityHint="Write your thoughts and feelings"
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  (!title.trim() || !content.trim()) && styles.disabledButton,
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
                  colors={colors.gradient.secondary}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {analyzeEmotionsMutation.isPending
                      ? "Analyzing Thoughts..."
                      : "Save Entry"}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Decorative elements */}
              <View style={styles.decorativeElement1}>
                <Heart color={colors.primary} size={32} />
              </View>
              <View style={styles.decorativeElement2}>
                <Smile color={colors.secondary} size={28} />
              </View>
              <View style={styles.decorativeElement3}>
                <ThumbsUp color={colors.primary} size={36} />
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyFooter: {
    marginTop: 30,
    alignItems: "center",
    opacity: 0.7,
  },
  emptyHeart: {
    marginBottom: 5,
  },
  emptyCaption: {
    fontSize: 14,
    fontStyle: "italic",
  },
  entriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  entryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  entryHeader: {
    marginBottom: 14,
  },
  entryTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  emotionTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  emotionTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  emotionText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  aiInsight: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  aiInsightTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  aiInsightText: {
    fontSize: 15,
    lineHeight: 22,
  },
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
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalContent: {
    padding: 20,
    flex: 1,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 28,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 14,
  },
  titleInput: {
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    fontFamily: "System",
  },
  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  emotionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  emotionButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  thoughtsInput: {
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    fontFamily: "System",
    minHeight: 220,
  },
  saveButton: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    paddingVertical: 20,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "600" as const,
  },
  decorativeElement1: {
    position: "absolute",
    top: 50,
    left: 20,
    opacity: 0.1,
  },
  decorativeElement2: {
    position: "absolute",
    top: 120,
    right: 30,
    opacity: 0.1,
  },
  decorativeElement3: {
    position: "absolute",
    bottom: 150,
    left: 40,
    opacity: 0.1,
  },
});
