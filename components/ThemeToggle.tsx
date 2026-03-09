import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      className="w-10 h-10 rounded-full justify-center items-center border border-gray-200 bg-white shadow-sm active:bg-gray-100/80 focus:bg-gray-100/80 transition-colors"
      onPress={toggleTheme}
    >
      <View className="w-8 h-8 rounded-full justify-center items-center">
        {isDarkMode ? (
          <Moon color="#F9FAFB" size={20} />
        ) : (
          <Sun color="#1F2937" size={20} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ThemeToggle;
