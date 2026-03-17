// template
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs } from "expo-router";
import { BookText, History, Home, LineChart, Settings } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import "../../global.css";

function TabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: typeof Home;
  color: string;
  focused: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={tabStyles.iconWrap}>
      <Icon color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 1.8} />
      {focused && (
        <View style={[tabStyles.activeDot, { backgroundColor: colors.primary }]} />
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? colors.card : colors.surface,
          borderTopColor: isDarkMode ? colors.border : "transparent",
          borderTopWidth: isDarkMode ? 1 : 0,
          height: 78,
          paddingBottom: 14,
          paddingTop: 10,
          elevation: 0,
          boxShadow: isDarkMode
            ? "none"
            : "0px -4px 24px rgba(108, 99, 255, 0.08)",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600" as const,
          marginTop: 0,
          letterSpacing: 0.4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={BookText} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={LineChart} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mood-history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={History} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
