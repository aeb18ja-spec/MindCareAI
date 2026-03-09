// template
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs } from "expo-router";
import { BookText, History, Home, LineChart, Settings } from "lucide-react-native";
import React from "react";
import "../../global.css";

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDarkMode
          ? colors.textSecondary
          : colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 5,
          boxShadow: "0px -1px 4px rgba(0, 0, 0, 0.08)",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500" as const,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color }) => <BookText color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <LineChart color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="mood-history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={26} />,
        }}
      />
    </Tabs>
  );
}
