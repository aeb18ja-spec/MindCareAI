import Header from "@/components/Header";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type GradientKey =
  | "home"
  | "insights"
  | "journal"
  | "chat"
  | "primary"
  | "secondary";

const DEFAULT_GRADIENT: [string, string, ...string[]] = ["#6C63FF", "#8B5CF6"];

type ScreenLayoutProps = {
  /** Theme gradient key. Default "home". */
  gradientKey?: GradientKey;
  children: ReactNode;
  /** SafeAreaView edges. Default ["top"]. */
  edges?: ("top" | "bottom" | "left" | "right")[];
  /** Show header. Default true. */
  showHeader?: boolean;
  onBurgerPress?: () => void;
  onProfilePress?: () => void;
};

export default function ScreenLayout({
  gradientKey = "home",
  children,
  edges = ["top"],
  showHeader = true,
  onBurgerPress,
  onProfilePress,
}: ScreenLayoutProps) {
  const { colors } = useTheme();
  const gradient =
    colors.gradient[gradientKey] &&
    Array.isArray(colors.gradient[gradientKey]) &&
    colors.gradient[gradientKey].length >= 2
      ? (colors.gradient[gradientKey] as [string, string, ...string[]])
      : DEFAULT_GRADIENT;

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      {showHeader && <Header onBurgerPress={onBurgerPress} onProfilePress={onProfilePress} />}
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
