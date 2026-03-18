import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react-native";
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
  const { login, signup } = useAuth();
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
    if (!email || !password) {
      setError("Signup session expired. Please try signing up again.");
      return;
    }

    if (otpString.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Verify OTP and create a confirmed Supabase user on the server
      const res = await fetch(`${otpServerUrl}/verify-otp-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const serverError = typeof data?.error === "string" ? data.error : "";

        // Backward-compatible fallback when server doesn't have service-role key.
        // This avoids hard-failing OTP verification for local/dev setups.
        if (serverError.includes("SUPABASE_SERVICE_ROLE_KEY")) {
          const otpOnlyRes = await fetch(`${otpServerUrl}/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: otpString }),
          });

          const otpOnlyData = await otpOnlyRes.json();
          if (!otpOnlyRes.ok) {
            setError(otpOnlyData.error || "Invalid OTP.");
            return;
          }

          try {
            await signup(email, password);
            await login(email, password);

            router.replace({
              pathname: "/complete-profile" as any,
              params: { email },
            });
            return;
          } catch (fallbackErr) {
            const fallbackMessage =
              fallbackErr instanceof Error
                ? fallbackErr.message
                : "Signup failed. Please try again.";

            if (fallbackMessage.toLowerCase().includes("email not confirmed")) {
              setError(
                "Account created. Please confirm the email link we sent, then login.",
              );
              return;
            }

            throw fallbackErr;
          }
        }

        setError(serverError || "Invalid OTP.");
        return;
      }

      // Account is created and email is pre-confirmed server-side, now login
      await login(email, password);

      // Navigate to profile completion (user is now authenticated)
      router.replace({
        pathname: "/complete-profile" as any,
        params: { email },
      });
    } catch (err) {

      const message = err instanceof Error ? err.message : "Verification failed. Please try again.";

      if (message.includes("already exists")) {
        setError("An account with this email already exists. Please login instead.");
      } else {
        setError(message);
      }
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
              padding: compact ? 22 : 32,
              shadowColor: isDarkMode ? "#000" : "#6C63FF",
            },
          ]}
        >
          {/* Shield icon area */}
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
                <ShieldCheck size={30} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </View>
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
          <View style={[styles.emailBadge, { backgroundColor: colors.primary + "10" }]}>
            <Mail size={14} color={colors.primary} strokeWidth={2} />
            <Text
              style={[
                styles.emailText,
                { color: colors.primary },
              ]}
            >
              {email}
            </Text>
          </View>

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
                    backgroundColor: digit
                      ? colors.primary + "08"
                      : colors.background,
                    borderWidth: digit ? 2 : 1.5,
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
            <View style={[styles.errorContainer, { backgroundColor: colors.dangerLight }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          )}

          {error.includes("already exists") && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 8 }]}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleVerify}
            disabled={loading}
            accessibilityLabel="Verify OTP"
            accessibilityRole="button"
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
                <Text style={styles.buttonText}>Verify & Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend section */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>
              Didn&apos;t receive the code?
            </Text>
            {resendCooldown > 0 ? (
              <View style={[styles.timerBadge, { backgroundColor: colors.background }]}>
                <Text
                  style={[styles.resendTimer, { color: colors.textMuted }]}
                >
                  Resend in {resendCooldown}s
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                <Text style={[styles.resendButton, { color: colors.primary }]}>
                  {resending ? "Sending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.backText, { color: colors.primary }]}>
              Back to Sign Up
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
    alignItems: "center",
    gap: 10,
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
    marginTop: 2,
    lineHeight: 22,
  },
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "600" as const,
    textAlign: "center",
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
  },
  otpInput: {
    width: 52,
    height: 60,
    borderRadius: 14,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700" as const,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: "100%",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 8,
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
  resendRow: {
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  resendLabel: {
    fontSize: 13,
    lineHeight: 20,
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  resendTimer: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: "700" as const,
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
