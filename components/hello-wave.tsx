import Animated from "react-native-reanimated";

export function HelloWave() {
  return (
    <Animated.Text className="text-[28px] leading-8 -mt-[6px] animate-wave text-yellow-500 drop-shadow-md">
      👋
    </Animated.Text>
  );
}
