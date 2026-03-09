import { PropsWithChildren, useState } from "react";
import { TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? "light";

  return (
    <ThemedView className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 my-2 transition-colors">
      <TouchableOpacity
        className="flex-row items-center gap-2 px-1 py-2 rounded-lg active:bg-gray-100/80 focus:bg-gray-100/80"
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.85}
      >
        <IconSymbol
          name="chevron.right"
          size={20}
          weight="medium"
          color={theme === "light" ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
        />
        <ThemedText
          type="defaultSemiBold"
          style={{ color: "#222", fontSize: 17 }}
        >
          {title}
        </ThemedText>
      </TouchableOpacity>
      {isOpen && (
        <ThemedView className="mt-2 ml-7 border-l border-gray-100 pl-3 py-1">
          {children}
        </ThemedView>
      )}
    </ThemedView>
  );
}
