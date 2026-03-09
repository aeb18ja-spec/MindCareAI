import ScreenLayout from "@/components/ScreenLayout";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "expo-router";
import { Bell, Heart, Info, Lock, LogOut, Shield, User } from "lucide-react-native";
import {
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

  return (
    <ScreenLayout
      gradientKey={isDarkMode ? "insights" : "primary"}
    >
      <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Settings
            </Text>
          </View>

          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account
            </Text>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => router.push("/profile")}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(243, 232, 255, 0.5)",
                  },
                ]}
              >
                <User color={colors.primary} size={24} />
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(243, 232, 255, 0.5)",
                  },
                ]}
              >
                <Lock color={colors.primary} size={24} />
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
            </TouchableOpacity>

            <View style={styles.optionRow}>
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(243, 232, 255, 0.5)",
                  },
                ]}
              >
                <Info color={colors.primary} size={24} />
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

          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notifications
            </Text>

            <View style={styles.optionRow}>
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(243, 232, 255, 0.5)",
                  },
                ]}
              >
                <Bell color={colors.primary} size={24} />
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
                  Get notified to check in daily
                </Text>
              </View>
              <View style={styles.reminderBadge}>
                <Text style={[styles.reminderBadgeText, { color: colors.primary }]}>
                  ON · 8:00 PM
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Support & Information
            </Text>

            <TouchableOpacity style={styles.optionRow}>
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(243, 232, 255, 0.5)",
                  },
                ]}
              >
                <Heart color={colors.primary} size={24} />
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
            </TouchableOpacity>

            <View style={styles.safetyNote}>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                If you ever feel unsafe or in crisis, please contact local
                emergency services or a trusted person. This app cannot respond
                to emergencies.
              </Text>
            </View>

            <TouchableOpacity style={styles.optionRow}>
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(243, 232, 255, 0.5)",
                  },
                ]}
              >
                <Shield color={colors.primary} size={24} />
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.1)"
                      : "rgba(243, 232, 255, 0.5)",
                  },
                ]}
              >
                <Info color={colors.primary} size={24} />
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
                  Version 1.0.0
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  borderColor: colors.danger,
                },
              ]}
              onPress={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut color={colors.danger} size={20} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>
                Log out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  section: {
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  reminderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "rgba(124, 58, 237, 0.06)",
  },
  reminderBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  logoutSection: {
    marginTop: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  safetyNote: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
