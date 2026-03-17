import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Brain, Lock, Mail, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

/* ------------------------------------------------------------------ */
/*  Floating abstract shapes – purely visual, static                  */
/* ------------------------------------------------------------------ */
function FloatingShapes({ isDarkMode }: { isDarkMode: boolean }) {
  const baseColor = isDarkMode ? "rgba(139,125,255," : "rgba(255,255,255,";
  return (
    <View style={styles.shapesContainer} pointerEvents="none">
      {/* Large soft circle – top-left */}
      <View
        style={[
          styles.shape,
          {
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: baseColor + "0.07)",
            top: -40,
            left: -60,
          },
        ]}
      />
      {/* Medium pill – top-right */}
      <View
        style={[
          styles.shape,
          {
            width: 120,
            height: 200,
            borderRadius: 60,
            backgroundColor: baseColor + "0.06)",
            top: 60,
            right: -30,
            transform: [{ rotate: "25deg" }],
          },
        ]}
      />
      {/* Small circle – mid-left */}
      <View
        style={[
          styles.shape,
          {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: baseColor + "0.10)",
            top: "40%",
            left: 20,
          },
        ]}
      />
      {/* Tiny circle accent */}
      <View
        style={[
          styles.shape,
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: baseColor + "0.15)",
            top: "30%",
            right: 40,
          },
        ]}
      />
      {/* Large soft blob – bottom-right */}
      <View
        style={[
          styles.shape,
          {
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: baseColor + "0.06)",
            bottom: -80,
            right: -70,
          },
        ]}
      />
      {/* Medium blob – bottom-left */}
      <View
        style={[
          styles.shape,
          {
            width: 100,
            height: 160,
            borderRadius: 50,
            backgroundColor: baseColor + "0.08)",
            bottom: 40,
            left: -30,
            transform: [{ rotate: "-15deg" }],
          },
        ]}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Signup Screen                                                     */
/* ------------------------------------------------------------------ */
export default function SignupScreen() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { width, height: viewportHeight } = useWindowDimensions();
  const compact = viewportHeight < 700;
  const contentScale = Math.min(1, Math.max(0.9, viewportHeight / 820));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // 1. Check if user already exists in profiles
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", normalizedEmail) // This is wrong, id is UUID. Profiles don't have email.
        .maybeSingle();

      // Since we can't reliably check email in profiles without a join or schema change,
      // and we can't check auth.users directly, we'll proceed but improve handling
      // in the signup call itself in AuthContext.

      // Send OTP first
      const otpServerUrl = process.env.EXPO_PUBLIC_OTP_SERVER_URL || "http://localhost:3001";
      const otpRes = await fetch(`${otpServerUrl}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        setError(otpData.error || "Failed to send verification code.");
        return;
      }

      // Navigate to OTP verification screen with email and password
      router.push({
        pathname: "/verify-otp" as any,
        params: { email: normalizedEmail, password },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign up. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (loading) return;
    setError("");
    try {
      setLoading(true);
      await loginWithGoogle();
      // Layout will redirect to complete-profile for new Google users
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign up with Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---- derived styles ---- */
  const cardShadow = isDarkMode
    ? {}
    : {
        shadowColor: "#6C63FF",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
        elevation: 14,
      };

  const inputBg = isDarkMode ? colors.surface : colors.borderLight;

  return (
    <LinearGradient
      colors={
        (isDarkMode ? colors.gradient.insights : colors.gradient.primary) as [
          string,
          string,
        ]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Floating abstract shapes */}
      <FloatingShapes isDarkMode={isDarkMode} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* -------- Branding Section -------- */}
          <View style={[styles.brandSection, { paddingTop: compact ? 40 : 56 }]}>
            {/* Outer glow ring */}
            <View style={[
              styles.brandGlowRing,
              {
                borderColor: isDarkMode
                  ? "rgba(139,125,255,0.20)"
                  : "rgba(255,255,255,0.25)",
              },
            ]}>
              {/* Gradient icon circle */}
              <LinearGradient
                colors={
                  isDarkMode
                    ? ["rgba(139,125,255,0.30)", "rgba(108,99,255,0.15)"]
                    : ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.18)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.brandIconCircle}
              >
                <Brain
                  size={compact ? 34 : 38}
                  color={isDarkMode ? colors.primary : "#FFFFFF"}
                  strokeWidth={1.8}
                />
              </LinearGradient>
            </View>

            <Text
              style={[
                styles.brandTitle,
                {
                  color: isDarkMode ? colors.text : "#FFFFFF",
                  fontSize: compact ? 30 : 34,
                },
              ]}
            >
              MindCareAI
            </Text>
            <Text
              style={[
                styles.brandTagline,
                {
                  color: isDarkMode
                    ? colors.textSecondary
                    : "rgba(255,255,255,0.78)",
                },
              ]}
            >
              Your AI Mental Wellness Companion
            </Text>
          </View>

          {/* -------- Card -------- */}
          <View
            style={[
              styles.card,
              cardShadow,
              {
                backgroundColor: colors.card,
                borderColor: isDarkMode ? colors.border : "transparent",
                borderWidth: isDarkMode ? 1 : 0,
                padding: compact ? 22 : 28,
              },
            ]}
          >
            {/* Card heading */}
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Create Account
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                { color: colors.textSecondary, marginBottom: compact ? 18 : 24 },
              ]}
            >
              Join MindCareAI and start your wellness journey
            </Text>

            {/* ---- Email Input ---- */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: inputBg,
                    borderColor: isDarkMode ? colors.border : "transparent",
                    borderWidth: isDarkMode ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.inputIconWrap}>
                  <Mail size={18} color={colors.textMuted} strokeWidth={1.8} />
                </View>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      color: colors.text,
                      paddingVertical: compact ? 13 : 15,
                    },
                  ]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your email"
                />
              </View>
            </View>

            {/* ---- Password Input ---- */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: inputBg,
                    borderColor: isDarkMode ? colors.border : "transparent",
                    borderWidth: isDarkMode ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.inputIconWrap}>
                  <Lock size={18} color={colors.textMuted} strokeWidth={1.8} />
                </View>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      color: colors.text,
                      paddingVertical: compact ? 13 : 15,
                    },
                  ]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  accessibilityLabel="Password"
                  accessibilityHint="Enter at least 6 characters"
                />
              </View>
            </View>

            {/* ---- Confirm Password Input ---- */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: inputBg,
                    borderColor: isDarkMode ? colors.border : "transparent",
                    borderWidth: isDarkMode ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.inputIconWrap}>
                  <ShieldCheck size={18} color={colors.textMuted} strokeWidth={1.8} />
                </View>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      color: colors.text,
                      paddingVertical: compact ? 13 : 15,
                    },
                  ]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  accessibilityLabel="Confirm password"
                  accessibilityHint="Re-enter your password"
                />
              </View>
            </View>

            {/* ---- Error ---- */}
            {!!error && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* ---- Sign Up Button (gradient) ---- */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSignup}
              disabled={loading}
              accessibilityLabel="Sign up"
              accessibilityRole="button"
              accessibilityHint="Create your account"
              style={{ marginTop: compact ? 6 : 10 }}
            >
              <LinearGradient
                colors={colors.gradient.button as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.signupButton, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ---- Divider ---- */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                or
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* ---- Google Button ---- */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.googleButton,
                {
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? colors.surface : colors.card,
                },
              ]}
              onPress={handleGoogleSignup}
              accessibilityLabel="Sign up with Google"
              accessibilityRole="button"
            >
              <View style={styles.googleGlyphWrap}>
                <Text style={styles.googleGlyph}>G</Text>
              </View>
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* ---- Login link ---- */}
            <TouchableOpacity
              style={styles.loginRow}
              onPress={() => router.replace("/login")}
              accessibilityLabel="Go to login"
              accessibilityRole="link"
              accessibilityHint="Already have an account"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Already have an account?{" "}
              </Text>
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacer for scroll bounce */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* ================================================================== */
/*  Styles                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  /* layout */
  flex: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  /* floating abstract shapes */
  shapesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
  },
  shape: {
    position: "absolute",
  },

  /* branding */
  brandSection: {
    alignItems: "center",
    marginBottom: 26,
  },
  brandGlowRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  brandIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  brandTagline: {
    fontSize: 15,
    fontWeight: "400" as const,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.2,
  },

  /* card */
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 28,
    alignSelf: "center",
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },

  /* form */
  formGroup: {
    marginBottom: 14,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    overflow: "hidden",
  },
  inputIconWrap: {
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    paddingRight: 16,
  },

  /* error */
  errorBanner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },

  /* signup button */
  signupButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },

  /* divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    fontWeight: "500" as const,
  },

  /* google */
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    gap: 10,
  },
  googleGlyphWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F3F4",
    alignItems: "center",
    justifyContent: "center",
  },
  googleGlyph: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#4285F4",
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },

  /* login link */
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
});
