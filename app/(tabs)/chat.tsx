import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  type ChatUserContext
} from "@/lib/chatPrompt";
import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bot,
  Heart,
  MessageCircle,
  Send,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const SUGGESTIONS = [
  { icon: Heart, label: "I'm feeling anxious today", color: "#FF6B6B" },
  { icon: Shield, label: "Help me manage stress", color: "#6C63FF" },
  { icon: MessageCircle, label: "I need someone to talk to", color: "#00D2FF" },
];

function formatAssistantText(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/^\s*[-•]\s+/gm, "• ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ChatScreen({ onClose }: { onClose?: () => void } = {}) {
  const [input, setInput] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);
  const { colors, isDarkMode } = useTheme();
  const [bounceAnim] = useState(new Animated.Value(0));

  const { moodEntries, journalEntries, moodStreak } = useMood();
  const { currentUser } = useAuth();

  const userContext = useMemo<ChatUserContext>(() => {
    const now = Date.now();
    const sevenDaysAgo = now - SEVEN_DAYS_MS;
    const last7 = moodEntries.filter((e) => {
      const t = e.createdAt
        ? new Date(e.createdAt).getTime()
        : new Date(e.date + "T12:00:00").getTime();
      return t >= sevenDaysAgo;
    });
    const latestMood = moodEntries[0];
    const stressLevel = latestMood?.stressLevel ?? 5;
    const latestJournal =
      journalEntries.length > 0
        ? [journalEntries[0].title, journalEntries[0].content]
            .filter(Boolean)
            .join(" — ")
        : "";
    return {
      last7DaysMoods: last7,
      stressLevel,
      latestJournal,
      moodStreak,
      bmi: currentUser?.bmi ?? null,
      bmiCategory: currentUser?.bmiCategory ?? null,
    };
  }, [moodEntries, journalEntries, moodStreak, currentUser]);

  const { messages, sendMessage } = useRorkAgent({
    tools: {},
  });

  const isLoading =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].parts.some(
      (p: any) => p.type === "text" && p.text === "",
    );

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  React.useEffect(() => {
    if (messages.length > 0) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const renderMessage = (message: {
    id: string;
    role: string;
    parts: any[];
  }) => {
    const isUser = message.role === "user";
    const textParts = message.parts.filter(
      (p: { type: string }) => p.type === "text",
    );

    if (textParts.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
          {
            transform: [
              {
                translateY: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                }),
              },
            ],
          },
        ]}
      >
        {!isUser && (
          <LinearGradient
            colors={colors.gradient.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiIcon}
          >
            <Bot color="#FFFFFF" size={14} />
          </LinearGradient>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : [
                  styles.aiBubble,
                  {
                    backgroundColor: isDarkMode ? colors.surface : "#FFFFFF",
                  },
                  !isDarkMode && {
                    shadowColor: "#6C63FF",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  },
                  isDarkMode && {
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ],
          ]}
        >
          {textParts.map(
            (part: { type: string; text?: string }, index: number) => (
              <Text
                key={index}
                style={[
                  styles.messageText,
                  isUser
                    ? styles.userText
                    : { color: isDarkMode ? colors.text : "#1A1D2E" },
                ]}
              >
                {part.type === "text"
                  ? isUser
                    ? part.text
                    : formatAssistantText(part.text ?? "")
                  : ""}
              </Text>
            ),
          )}
        </View>
        {isUser && (
          <LinearGradient
            colors={["#8B5CF6", "#6C63FF"] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userIcon}
          >
            <User color="#FFFFFF" size={14} />
          </LinearGradient>
        )}
      </Animated.View>
    );
  };

  const hasMessages = messages.length > 0;

  return (
    <ScreenLayout gradientKey="chat">
      {/* ── Premium Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode
              ? colors.card
              : "rgba(255,255,255,0.95)",
          },
          !isDarkMode && {
            shadowColor: "#6C63FF",
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
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={colors.gradient.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerAvatar}
          >
            <Bot color="#FFFFFF" size={22} />
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              AI Companion
            </Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.statusDot} />
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Online — here to listen
              </Text>
            </View>
          </View>
        </View>
        {onClose ? (
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={[
              styles.headerBadge,
              {
                backgroundColor: isDarkMode
                  ? colors.surface
                  : colors.borderLight,
              },
            ]}
          >
            <X color={colors.text} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Sparkles color={colors.primary} size={16} />
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {!hasMessages ? (
          <ScrollView contentContainerStyle={styles.welcomeContainer}>
            {/* Welcome Illustration */}
            <LinearGradient
              colors={colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.welcomeIconOuter}
            >
              <View style={styles.welcomeIconInner}>
                <Sparkles color={colors.primary} size={40} />
              </View>
            </LinearGradient>

            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Hello, I'm here for you
            </Text>
            <Text
              style={[
                styles.welcomeText,
                { color: colors.textSecondary },
              ]}
            >
              Share what's on your mind, and I'll listen without judgment.
              Your conversations are private and secure.
            </Text>

            {/* Suggestion Cards */}
            <View style={styles.suggestionContainer}>
              <Text
                style={[
                  styles.suggestionsLabel,
                  { color: colors.textMuted },
                ]}
              >
                TRY SAYING
              </Text>
              {SUGGESTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.label}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: isDarkMode
                        ? colors.surface
                        : "#FFFFFF",
                    },
                    !isDarkMode && {
                      shadowColor: "#6C63FF",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    },
                    isDarkMode && {
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setInput(suggestion.label)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.suggestionIconWrap,
                      { backgroundColor: `${suggestion.color}15` },
                    ]}
                  >
                    <suggestion.icon
                      color={suggestion.color}
                      size={18}
                    />
                  </View>
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: colors.text },
                    ]}
                  >
                    {suggestion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Privacy note */}
            <View style={styles.privacyRow}>
              <Shield color={colors.textMuted} size={14} />
              <Text
                style={[styles.privacyText, { color: colors.textMuted }]}
              >
                Your conversations are private & encrypted
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => renderMessage(item)}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* ── Input Bar ── */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDarkMode
                ? colors.card
                : "rgba(255,255,255,0.98)",
            },
            !isDarkMode && {
              shadowColor: "#6C63FF",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 4,
            },
            isDarkMode && {
              borderTopColor: colors.border,
              borderTopWidth: 1,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: isDarkMode
                  ? colors.background
                  : colors.borderLight,
                borderColor: isDarkMode ? colors.border : "transparent",
                borderWidth: isDarkMode ? 1 : 0,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Share your thoughts..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradient.button as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Send color="#FFFFFF" size={18} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  /* ── Header ── */
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#00C48C",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Chat Container ── */
  chatContainer: {
    flex: 1,
  },

  /* ── Welcome ── */
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
  },
  welcomeIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  welcomeIconInner: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 36,
  },
  suggestionContainer: {
    width: "100%",
    gap: 10,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
    paddingLeft: 4,
  },
  suggestionChip: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  suggestionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: "600" as const,
    flex: 1,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },

  /* ── Messages ── */
  messagesList: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 2,
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 22,
    padding: 14,
    paddingHorizontal: 18,
  },
  userBubble: {
    backgroundColor: "#6C63FF",
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },

  /* ── Input ── */
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  input: {
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 8,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 18,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
