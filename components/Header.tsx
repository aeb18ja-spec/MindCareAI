import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const APP_NAME = "MindCareAI";

type HeaderProps = {
  onBurgerPress?: () => void;
  onProfilePress?: () => void;
};

const noop = () => {};

export default function Header({
  onBurgerPress = noop,
  onProfilePress = noop,
}: HeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
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
      <View style={styles.iconButton} />
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{APP_NAME}</Text>
      </View>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => {
          onProfilePress();
          router.push("/profile");
        }}
      >
        <User color={colors.primary} size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
    zIndex: 100,
  },
  iconButton: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold" as const,
  },
});
