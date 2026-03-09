import ScreenLayout from "@/components/ScreenLayout";
import { getAgeFromDob, useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { currentUser } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  if (!currentUser) {
    return (
      <ScreenLayout gradientKey={isDarkMode ? "insights" : "primary"} showHeader={false}>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  const age = getAgeFromDob(currentUser.dob);
  const initial = currentUser.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";
  const about =
    currentUser.sleepingHours && currentUser.sleepingHours < 7
      ? "Working on improving my sleep and managing stress better."
      : "On a journey to understand my moods and build healthy habits.";

  return (
    <ScreenLayout gradientKey={isDarkMode ? "insights" : "primary"} showHeader={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.header}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isDarkMode ? "#4C1D95" : "#EDE9FE",
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {initial}
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profile
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Connected to your Supabase profile
          </Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            {about}
          </Text>
        </View>

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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Personal Info
          </Text>
          <Row label="Name" value={currentUser.name} colors={colors} />
          <Row label="Email" value={currentUser.email} colors={colors} />
          <Row
            label="Date of birth"
            value={currentUser.dob}
            colors={colors}
          />
          <Row
            label="Age"
            value={age > 0 ? `${age} years` : "—"}
            colors={colors}
          />
        </View>

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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Health Snapshot
          </Text>
          <Row
            label="Weight"
            value={
              currentUser.weight ? `${currentUser.weight.toFixed(1)} kg` : "—"
            }
            colors={colors}
          />
          <Row
            label="Height"
            value={
              currentUser.height ? `${currentUser.height.toFixed(1)} cm` : "—"
            }
            colors={colors}
          />
          <Row
            label="Sleep"
            value={
              currentUser.sleepingHours
                ? `${currentUser.sleepingHours.toFixed(1)} hrs/night`
                : "—"
            }
            colors={colors}
          />
        </View>

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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Account
          </Text>
          <Row
            label="Member since"
            value={new Date(currentUser.createdAt).toLocaleDateString()}
            colors={colors}
          />
          <Row label="User ID" value={currentUser.id} colors={colors} />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

type RowProps = {
  label: string;
  value: string;
  colors: { text: string; textSecondary: string; border: string };
};

function Row({ label, value, colors }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  aboutText: {
    marginTop: 8,
    fontSize: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  row: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  rowLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "500" as const,
  },
});

