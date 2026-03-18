import ScreenLayout from "@/components/ScreenLayout";
import { getAgeFromDob, useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { calculateBMI, getBMICategory, getBMICategoryColor } from "@/lib/bmi";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  Edit3,
  Heart,
  Mail,
  Moon,
  Ruler,
  Scale,
  Shield,
  User,
  Weight,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { currentUser } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  if (!currentUser) {
    return (
      <ScreenLayout
        gradientKey={isDarkMode ? "insights" : "primary"}
        showHeader={false}
      >
        <View style={styles.centered}>
          <Text
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Loading profile...
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  const age = getAgeFromDob(currentUser.dob);
  const initial =
    currentUser.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";
  const about =
    currentUser.sleepingHours && currentUser.sleepingHours < 7
      ? "Working on improving my sleep and managing stress better."
      : "On a journey to understand my moods and build healthy habits.";

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      ...(isDarkMode
        ? {
            borderColor: colors.border,
            borderWidth: 1,
          }
        : {
            shadowColor: "#6C63FF",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 4,
          }),
    },
  ];

  return (
    <ScreenLayout
      gradientKey={isDarkMode ? "insights" : "primary"}
      showHeader={false}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Navigation Bar ── */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: isDarkMode
                  ? colors.surface
                  : "rgba(255,255,255,0.9)",
              },
              !isDarkMode && {
                shadowColor: "#6C63FF",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              },
              isDarkMode && { borderColor: colors.border, borderWidth: 1 },
            ]}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ChevronLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>
            Profile
          </Text>
          <View style={styles.navSpacer} />
        </View>

        {/* ── Hero Section ── */}
        <View style={styles.heroSection}>
          {/* Avatar with gradient ring */}
          <View style={styles.avatarOuter}>
            <LinearGradient
              colors={colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View
                style={[
                  styles.avatarInnerRing,
                  { backgroundColor: colors.background },
                ]}
              >
                <LinearGradient
                  colors={colors.gradient.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </LinearGradient>
              </View>
            </LinearGradient>
            {/* Edit badge */}
            <View
              style={[
                styles.editBadge,
                {
                  backgroundColor: isDarkMode ? colors.card : "#FFFFFF",
                  borderColor: isDarkMode ? colors.border : colors.primary,
                },
              ]}
            >
              <Edit3 color={colors.primary} size={12} />
            </View>
          </View>

          <Text style={[styles.heroName, { color: colors.text }]}>
            {currentUser.name || "User"}
          </Text>
          <View style={[styles.emailRow, { backgroundColor: isDarkMode ? colors.surface : colors.borderLight }, isDarkMode && { borderColor: colors.border, borderWidth: 1 }]}>
            <Mail color={colors.primary} size={14} />
            <Text style={[styles.emailText, { color: colors.text }]}>
              {currentUser.email}
            </Text>
          </View>

          {/* About pill */}
          <View
            style={[
              styles.aboutPill,
              {
                backgroundColor: isDarkMode
                  ? colors.surface
                  : colors.primaryLight,
              },
              isDarkMode && { borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Heart
              color={colors.primary}
              size={14}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[styles.aboutText, { color: colors.textSecondary }]}
            >
              {about}
            </Text>
          </View>
        </View>

        {/* ── Personal Information Card ── */}
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconWrap,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <User color={colors.primary} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              PERSONAL INFORMATION
            </Text>
          </View>
          <InfoRow
            icon={User}
            iconColor={colors.primary}
            iconBg={colors.primaryLight}
            label="Name"
            value={currentUser.name}
            colors={colors}
          />
          <InfoRow
            icon={Mail}
            iconColor="#00D2FF"
            iconBg={isDarkMode ? "rgba(0,210,255,0.15)" : "rgba(0,210,255,0.1)"}
            label="Email"
            value={currentUser.email}
            colors={colors}
          />
          <InfoRow
            icon={Calendar}
            iconColor="#FFB020"
            iconBg={colors.warningLight}
            label="Date of Birth"
            value={currentUser.dob}
            colors={colors}
          />
          <InfoRow
            icon={Heart}
            iconColor="#FF6B6B"
            iconBg={colors.dangerLight}
            label="Age"
            value={age > 0 ? `${age} years` : "\u2014"}
            colors={colors}
            isLast
          />
        </View>

        {/* ── Health Snapshot Card ── */}
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconWrap,
                { backgroundColor: colors.successLight },
              ]}
            >
              <Heart color={colors.success} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              HEALTH SNAPSHOT
            </Text>
          </View>
          <InfoRow
            icon={Weight}
            iconColor="#FF6B6B"
            iconBg={colors.dangerLight}
            label="Weight"
            value={
              currentUser.weight
                ? `${currentUser.weight.toFixed(1)} kg`
                : "\u2014"
            }
            colors={colors}
          />
          <InfoRow
            icon={Ruler}
            iconColor="#6C63FF"
            iconBg={colors.primaryLight}
            label="Height"
            value={
              currentUser.height
                ? `${currentUser.height.toFixed(1)} cm`
                : "\u2014"
            }
            colors={colors}
          />
          <InfoRow
            icon={Moon}
            iconColor="#8B5CF6"
            iconBg={isDarkMode ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)"}
            label="Sleep"
            value={
              currentUser.sleepingHours
                ? `${currentUser.sleepingHours.toFixed(1)} hrs/night`
                : "\u2014"
            }
            colors={colors}
          />
          {(() => {
            const userBmi = currentUser.bmi ?? calculateBMI(currentUser.weight, currentUser.height);
            const category = currentUser.bmiCategory ?? getBMICategory(userBmi);
            const catColor = getBMICategoryColor(category as any);
            return (
              <InfoRow
                icon={Scale}
                iconColor={catColor}
                iconBg={catColor + "18"}
                label="BMI"
                value={
                  userBmi != null
                    ? `${userBmi.toFixed(1)} — ${category}`
                    : "\u2014"
                }
                colors={colors}
                isLast
              />
            );
          })()}
        </View>

        {/* ── Account Details Card ── */}
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconWrap,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(0,210,255,0.15)"
                    : "rgba(0,210,255,0.1)",
                },
              ]}
            >
              <Shield color="#00D2FF" size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              ACCOUNT DETAILS
            </Text>
          </View>
          <InfoRow
            icon={Calendar}
            iconColor={colors.success}
            iconBg={colors.successLight}
            label="Member Since"
            value={new Date(currentUser.createdAt).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" },
            )}
            colors={colors}
          />
          <InfoRow
            icon={Shield}
            iconColor={colors.textMuted}
            iconBg={isDarkMode ? colors.surface : colors.borderLight}
            label="User ID"
            value={currentUser.id.slice(0, 8) + "..."}
            colors={colors}
            isLast
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

/* ── Info Row Component ── */
type InfoRowProps = {
  icon: typeof User;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  colors: {
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
  };
  isLast?: boolean;
};

function InfoRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  colors,
  isLast,
}: InfoRowProps) {
  return (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={14} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text
          style={[styles.rowValue, { color: colors.text }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navSpacer: {
    width: 44,
    height: 44,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
  },

  /* ── Hero ── */
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarOuter: {
    marginBottom: 20,
    position: "relative",
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInnerRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 44,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
  },
  emailText: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  aboutPill: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    marginHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: "400" as const,
  },

  /* ── Cards ── */
  card: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  /* ── Rows ── */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
