import {
  buildWellnessSystemPrompt,
  type ChatUserContext,
} from "@/lib/chatPrompt";
import ScreenLayout from "@/components/ScreenLayout";
import { useMood } from "@/contexts/MoodContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import { LinearGradient } from "expo-linear-gradient";
import {
    Bot,
    Heart,
    MessageCircle,
    Send,
    Sparkles,
    User,
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

export default function ChatScreen() {
  const [input, setInput] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);
  const { colors, isDarkMode } = useTheme();
  const [bounceAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  const { moodEntries, journalEntries, moodStreak } = useMood();

  const userContext = useMemo<ChatUserContext>(() => {
    const now = Date.now();
    const sevenDaysAgo = now - SEVEN_DAYS_MS;
    const last7 = moodEntries.filter((e) => {
      const t = e.createdAt ? new Date(e.createdAt).getTime() : new Date(e.date + "T12:00:00").getTime();
      return t >= sevenDaysAgo;
    });
    const latestMood = moodEntries[0];
    const stressLevel = latestMood?.stressLevel ?? 5;
    const latestJournal =
      journalEntries.length > 0
        ? [journalEntries[0].title, journalEntries[0].content].filter(Boolean).join(" — ")
        : "";
    return {
      last7DaysMoods: last7,
      stressLevel,
      latestJournal,
      moodStreak,
    };
  }, [moodEntries, journalEntries, moodStreak]);

  const systemPrompt = useMemo(
    () => buildWellnessSystemPrompt(userContext),
    [userContext]
  );

  const { messages, sendMessage } = useRorkAgent({
    tools: {},
    system: systemPrompt,
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

  // Bounce animation for new messages
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

  // Pulse animation for the send button
  React.useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

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
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        {!isUser && (
          <View
            style={[
              styles.aiIcon,
              { backgroundColor: isDarkMode ? colors.background : "#F3E8FF" },
            ]}
          >
            <Bot color={colors.primary} size={16} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {textParts.map(
            (part: { type: string; text?: string }, index: number) => (
              <Text
                key={index}
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.aiText,
                ]}
              >
                {part.type === "text" ? part.text : ""}
              </Text>
            ),
          )}
        </View>
        {isUser && (
          <View style={styles.userIcon}>
            <User color="#FFFFFF" size={16} />
          </View>
        )}
      </Animated.View>
    );
  };

  const hasMessages = messages.length > 0;

  return (
    <ScreenLayout gradientKey="chat">
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={[
                styles.aiIcon,
                { backgroundColor: isDarkMode ? colors.background : "#F3E8FF" },
              ]}
            >
              <Bot color={colors.primary} size={20} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                AI Companion
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              >
                Always here to listen
              </Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {!hasMessages ? (
            <ScrollView contentContainerStyle={styles.welcomeContainer}>
              <View
                style={[
                  styles.welcomeIcon,
                  {
                    backgroundColor: isDarkMode ? colors.background : "#F3E8FF",
                  },
                ]}
              >
                <Sparkles color={colors.primary} size={48} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                Hello, I&apos;m here for you
              </Text>
              <Text
                style={[styles.welcomeText, { color: colors.textSecondary }]}
              >
                Share what&apos;s on your mind, and I&apos;ll listen without
                judgment. I&apos;m here to support you through your mental
                health journey.
              </Text>
              <View style={styles.suggestionContainer}>
                {[
                  "I'm feeling anxious today",
                  "Help me manage stress",
                  "I need someone to talk to",
                ].map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={[
                      styles.suggestionChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => {
                      setInput(suggestion);
                    }}
                  >
                    <Text
                      style={[styles.suggestionText, { color: colors.text }]}
                    >
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Decorative elements */}
              <View style={styles.decorativeElements}>
                <Heart
                  color={isDarkMode ? colors.primary : colors.primary}
                  size={24}
                  style={styles.decorativeElement1}
                />
                <MessageCircle
                  color={isDarkMode ? colors.secondary : colors.secondary}
                  size={20}
                  style={styles.decorativeElement2}
                />
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

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                borderTopWidth: 1,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? colors.background : "#F9FAFB",
                  color: colors.text,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
              placeholder="Share your thoughts..."
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient
                  colors={
                    colors.gradient.primary as [
                      import("react-native").ColorValue,
                      import("react-native").ColorValue,
                      ...import("react-native").ColorValue[],
                    ]
                  }
                  style={styles.sendGradient}
                >
                  <Send color="#FFFFFF" size={20} />
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  suggestionContainer: {
    width: "100%",
    gap: 12,
  },
  suggestionChip: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  messagesList: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 4,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 20,
    padding: 16,
  },
  userBubble: {
    backgroundColor: "#7C3AED",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: "#1F2937",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  decorativeElements: {
    position: "relative",
    height: 100,
    marginTop: 20,
  },
  decorativeElement1: {
    position: "absolute",
    top: 10,
    left: 20,
  },
  decorativeElement2: {
    position: "absolute",
    top: 30,
    right: 40,
  },
});
