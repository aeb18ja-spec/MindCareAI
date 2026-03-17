import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Brain, User } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const APP_NAME = "MindCare";
const APP_SUFFIX = "AI";

type HeaderProps = {
  onBurgerPress?: () => void;
  onProfilePress?: () => void;
};

const noop = () => {};

export default function Header({
  onBurgerPress = noop,
  onProfilePress = noop,
}: HeaderProps) {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isDarkMode
            ? colors.card + "F0"
            : colors.surface + "F5",
        },
        Platform.OS !== "web" && !isDarkMode && {
          shadowColor: "#6C63FF",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 4,
        },
        isDarkMode && {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View style={styles.brandContainer}>
        <LinearGradient
          colors={colors.gradient.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoCircle}
        >
          <Brain color="#FFFFFF" size={18} strokeWidth={2.2} />
        </LinearGradient>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>
            {APP_NAME}
          </Text>
          <Text style={[styles.titleAccent, { color: colors.primary }]}>
            {APP_SUFFIX}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.profileButton,
          {
            backgroundColor: isDarkMode
              ? colors.primaryLight
              : "rgba(108, 99, 255, 0.08)",
          },
        ]}
        onPress={() => {
          onProfilePress();
          router.push("/profile");
        }}
        activeOpacity={0.7}
      >
        <User color={colors.primary} size={20} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 68,
    zIndex: 100,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
