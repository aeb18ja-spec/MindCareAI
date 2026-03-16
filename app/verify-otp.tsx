import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const contentScale = Math.min(1, Math.max(0.9, height / 820));

  const params = useLocalSearchParams<{ email: string; password: string }>();
  const email = params.email ?? "";
  const password = params.password ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const otpServerUrl =
    process.env.EXPO_PUBLIC_OTP_SERVER_URL || "http://localhost:3001";

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = (text: string, index: number) => {
    // Only accept digits
    const digit = text.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    try {
      setResending(true);
      setError("");
      const res = await fetch(`${otpServerUrl}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend OTP.");
        return;
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Verify OTP
      const res = await fetch(`${otpServerUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP.");
        return;
      }

      // OTP verified — now create the Supabase account and auto-login
      await signup(email, password);

      // Navigate to profile completion (user is now authenticated)
      router.replace({
        pathname: "/complete-profile" as any,
        params: { email },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again.",
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
              transform: [{ scale: contentScale }],
              backgroundColor: colors.card,
              borderColor: colors.border,
              padding: compact ? 18 : 28,
            },
          ]}
        >
          {/* Mail icon circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Text style={styles.iconEmoji}>📧</Text>
          </View>

          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: compact ? 22 : 26 },
            ]}
          >
            Verify Your Email
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            We sent a 6-digit code to
          </Text>
          <Text
            style={[
              styles.emailText,
              { color: colors.primary },
            ]}
          >
            {email}
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  {
                    color: colors.text,
                    borderColor: digit
                      ? colors.primary
                      : error
                        ? colors.danger
                        : colors.border,
                    backgroundColor: colors.background,
                    borderWidth: digit ? 2 : 1,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textContentType="oneTimeCode"
                accessibilityLabel={`OTP digit ${index + 1}`}
              />
            ))}
          </View>

          {!!error && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleVerify}
            disabled={loading}
            accessibilityLabel="Verify OTP"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Resend section */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>
              Didn&apos;t receive the code?
            </Text>
            {resendCooldown > 0 ? (
              <Text
                style={[styles.resendTimer, { color: colors.textSecondary }]}
              >
                Resend in {resendCooldown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={[styles.resendButton, { color: colors.primary }]}>
                  {resending ? "Sending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>
              ← Back to Sign Up
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 2,
  },
  emailText: {
    fontSize: 15,
    fontWeight: "600" as const,
    textAlign: "center",
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  otpInput: {
    width: 46,
    height: 54,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700" as const,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  button: {
    width: "100%",
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  resendRow: {
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  resendLabel: {
    fontSize: 13,
  },
  resendTimer: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  backButton: {
    marginTop: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
});
