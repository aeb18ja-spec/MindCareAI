import { Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  let typeClass = "";
  if (type === "default") typeClass = "text-[16px] leading-6 text-gray-800";
  else if (type === "defaultSemiBold")
    typeClass =
      "text-[16px] leading-6 font-semibold text-gray-900 tracking-tight";
  else if (type === "title")
    typeClass =
      "text-[32px] font-extrabold leading-8 text-gray-900 tracking-tight";
  else if (type === "subtitle")
    typeClass = "text-[20px] font-bold text-gray-700";
  else if (type === "link")
    typeClass = "leading-[30px] text-[16px] text-blue-600 underline";

  return <Text style={{ color }} className={typeClass} {...rest} />;
}
