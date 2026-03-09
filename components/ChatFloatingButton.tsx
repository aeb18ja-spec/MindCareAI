import ChatScreen from "@/app/(tabs)/chat";
import { useTheme } from "@/contexts/ThemeContext";
import { MessageCircle, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatFloatingButton() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  const openChat = () => setVisible(true);
  const closeChat = () => setVisible(false);

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Open wellness chat"
        accessibilityHint="Opens your AI wellness companion in a chat window"
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: "#000",
          },
        ]}
        activeOpacity={0.9}
        onPress={openChat}
      >
        <MessageCircle color="#FFFFFF" size={24} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={closeChat}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalShell}>
            <TouchableOpacity
              onPress={closeChat}
              style={styles.closeButton}
              accessibilityLabel="Close wellness chat"
            >
              <X color="#FFFFFF" size={20} />
            </TouchableOpacity>
            <View style={styles.modalContent}>
              <ChatScreen />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 40 : 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalShell: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100,
  },
  modalContent: {
    flex: 1,
  },
});

