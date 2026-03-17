import ChatScreen from "@/app/(tabs)/chat";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

export default function ChatFloatingButton() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const openChat = () => setVisible(true);
  const closeChat = () => setVisible(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <>
      <Animated.View
        pointerEvents={visible ? "none" : "auto"}
        style={[
          styles.fabWrap,
          { transform: [{ scale: scaleAnim }] },
          visible && { opacity: 0 },
        ]}
      >
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: colors.primary,
              opacity: visible ? 0 : 0.12,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Pressable
          accessibilityLabel="Open wellness chat"
          accessibilityHint="Opens your AI wellness companion in a chat window"
          onPress={openChat}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={colors.gradient?.primary ?? ["#6C63FF", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.fab,
              Platform.OS !== "web" && {
                shadowColor: "#6C63FF",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 10,
              },
            ]}
          >
            <MessageCircle color="#FFFFFF" size={26} strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={closeChat}
      >
        <View style={styles.modalContent}>
          <ChatScreen onClose={closeChat} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 100 : 90,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 22,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
  },
});
