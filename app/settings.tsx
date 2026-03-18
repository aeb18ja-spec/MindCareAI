import ScreenLayout from "@/components/ScreenLayout";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
    DAILY_REMINDER_TIME_LABEL,
    disableDailyReminder,
    enableDailyReminder,
    getDailyReminderEnabled,
    isDailyReminderSupported,
} from "@/lib/reminders";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Bell,
    ChevronRight,
    Heart,
    Info,
    Lock,
    LogOut,
    Shield,
    User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(true);
  const [reminderToggling, setReminderToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadReminderState = async () => {
      try {
        const enabled = await getDailyReminderEnabled();
        if (!cancelled) {
          setDailyReminderEnabled(enabled);
        }
      } finally {
        if (!cancelled) {
          setReminderLoading(false);
        }
      }
    };

    void loadReminderState();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleReminderToggle = async () => {
    if (reminderToggling || reminderLoading) return;

    if (!isDailyReminderSupported()) {
      Alert.alert(
        "Not supported",
        "Daily reminders are not available on web.",
      );
      return;
    }

    setReminderToggling(true);
    try {
      if (dailyReminderEnabled) {
        await disableDailyReminder();
        setDailyReminderEnabled(false);
        return;
      }

      const enabled = await enableDailyReminder();
      if (!enabled) {
        Alert.alert(
          "Could not enable reminder",
          "Please allow notifications and try again.",
        );
        return;
      }

      setDailyReminderEnabled(true);
    } catch (e) {
      Alert.alert(
        "Reminder error",
        e instanceof Error ? e.message : "Failed to update reminder.",
      );
    } finally {
      setReminderToggling(false);
    }
  };

  const cardStyle = [
    styles.section,
    {
      backgroundColor: colors.card,
      ...(isDarkMode
        ? {
            borderColor: colors.border,
            borderWidth: 1,
            boxShadow: "none",
            elevation: 0,
          }
        : {
            borderWidth: 0,
            shadowColor: "#6C63FF",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 4,
          }),
    },
  ];

  return (
    <ScreenLayout gradientKey={isDarkMode ? "insights" : "primary"}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Settings
          </Text>
        </View>

        {/* Account Section */}
        <View style={cardStyle}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            ACCOUNT
          </Text>

          <TouchableOpacity
            style={[
              styles.optionRow,
              { borderBottomColor: colors.borderLight },
            ]}
            onPress={() => router.push("/profile")}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <User color={colors.primary} size={20} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Profile
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Manage your account details
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionRow,
              { borderBottomColor: colors.borderLight },
            ]}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.optionIcon,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(0, 210, 255, 0.12)"
                    : "#E0F9FF",
                },
              ]}
            >
              <Lock color={colors.accent} size={20} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Privacy & Security
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Control your privacy settings
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={20} />
          </TouchableOpacity>

          <View style={[styles.optionRow, styles.optionRowLast]}>
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.warningLight },
              ]}
            >
              <Info color={colors.warning} size={20} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Appearance
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Toggle light and dark themes
              </Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={cardStyle}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            NOTIFICATIONS
          </Text>

          <TouchableOpacity
            style={[
              styles.optionRow,
              styles.optionRowLast,
              (reminderLoading || reminderToggling) && styles.optionRowDisabled,
            ]}
            onPress={handleReminderToggle}
            activeOpacity={0.7}
            disabled={reminderLoading || reminderToggling}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.secondaryLight },
              ]}
            >
              <Bell color={colors.secondary} size={20} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Daily Reminders
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {dailyReminderEnabled
                  ? `Reminder set for ${DAILY_REMINDER_TIME_LABEL}`
                  : "Get notified to check in daily"}
              </Text>
            </View>
            {dailyReminderEnabled ? (
              <LinearGradient
                colors={colors.gradient.button as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reminderBadge}
              >
                <Text style={styles.reminderBadgeText}>
                  {reminderToggling ? "..." : `ON · ${DAILY_REMINDER_TIME_LABEL}`}
                </Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.reminderBadgeOff,
                  {
                    backgroundColor: isDarkMode ? colors.surface : colors.borderLight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.reminderBadgeTextOff, { color: colors.textMuted }]}
                >
                  {reminderToggling ? "..." : "OFF"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Support & Information Section */}
        <View style={cardStyle}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            SUPPORT & INFORMATION
          </Text>

          <TouchableOpacity
            style={[
              styles.optionRow,
              { borderBottomColor: colors.borderLight },
            ]}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.successLight },
              ]}
            >
              <Heart color={colors.success} size={20} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Mental Health Resources
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Access helpful resources
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={20} />
          </TouchableOpacity>

          {/* Safety Note with gradient left border */}
          <View
            style={[
              styles.safetyNote,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <LinearGradient
              colors={colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.safetyNoteBorder}
            />
            <Text
              style={[styles.safetyNoteText, { color: colors.textSecondary }]}
            >
              If you ever feel unsafe or in crisis, please contact local
              emergency services or a trusted person. This app cannot respond to
              emergencies.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.optionRow,
              { borderBottomColor: colors.borderLight },
            ]}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.warningLight },
              ]}
            >
              <Shield color={colors.warning} size={20} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Safety Information
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Important safety guidelines
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, styles.optionRowLast]}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Info color={colors.primary} size={20} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                About MindCareAI
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Learn more about this app
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={20} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: colors.dangerLight },
            ]}
            onPress={async () => {
              try {
                await logout();
                router.replace("/login");
              } catch (err) {
                Alert.alert(
                  "Logout failed",
                  err instanceof Error
                    ? err.message
                    : "Unable to logout right now. Please try again.",
                );
              }
            }}
            activeOpacity={0.7}
          >
            <LogOut color={colors.danger} size={20} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>
              Log out
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version Footer */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          MindCareAI v1.0.0
        </Text>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  section: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionRowDisabled: {
    opacity: 0.7,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  reminderBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reminderBadgeOff: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  reminderBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
  reminderBadgeTextOff: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  safetyNote: {
    marginHorizontal: 24,
    marginBottom: 8,
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 16,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  safetyNoteBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  safetyNoteText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  logoutSection: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  versionText: {
    fontSize: 13,
    fontWeight: "400" as const,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
});
