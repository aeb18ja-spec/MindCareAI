import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, KeyRound, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setSuccess("");
    setError("");

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordReset(normalizedEmail);
      setSuccess(
        "If an account exists for this email, a reset link has been sent.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={
        (isDarkMode ? colors.gradient.insights : colors.gradient.primary) as [
          string,
          string,
        ]
      }
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardWrapper}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              shadowColor: isDarkMode ? "#000" : "#6C63FF",
            },
          ]}
        >
          {/* Lock icon area */}
          <View
            style={[
              styles.iconOuterRing,
              { backgroundColor: colors.primary + "10" },
            ]}
          >
            <View
              style={[
                styles.iconInnerRing,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <LinearGradient
                colors={colors.gradient.button as [string, string]}
                style={styles.iconGradient}
              >
                <KeyRound size={28} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </Text>

          {/* Email input */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: error ? colors.danger : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Mail
                size={18}
                color={colors.textMuted}
                strokeWidth={1.8}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {!!error && (
            <View
              style={[
                styles.messageBanner,
                { backgroundColor: colors.dangerLight },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          )}
          {!!success && (
            <View
              style={[
                styles.messageBanner,
                { backgroundColor: colors.successLight },
              ]}
            >
              <Text style={[styles.successText, { color: colors.success }]}>
                {success}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={colors.gradient.button as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/login")}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.backText, { color: colors.primary }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  keyboardWrapper: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    padding: 32,
    gap: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconInnerRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  formGroup: {
    width: "100%",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  messageBanner: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500" as const,
    textAlign: "center",
  },
  successText: {
    fontSize: 13,
    fontWeight: "500" as const,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 4,
    borderRadius: 14,
    overflow: "hidden",
  },
  button: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  divider: {
    width: "80%",
    height: 1,
    marginVertical: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
