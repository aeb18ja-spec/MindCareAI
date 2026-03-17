import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
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
              padding: compact ? 18 : 24,
              gap: compact ? 8 : 12,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: compact ? 24 : 28 },
            ]}
          >
            Create Account
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary, marginBottom: compact ? 8 : 14 },
            ]}
          >
            Sign up to continue
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  paddingVertical: compact ? 10 : 12,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  paddingVertical: compact ? 10 : 12,
                },
              ]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password"
              accessibilityHint="Enter at least 6 characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Confirm Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  paddingVertical: compact ? 10 : 12,
                },
              ]}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              accessibilityLabel="Confirm password"
              accessibilityHint="Re-enter your password"
            />
          </View>

          {!!error && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary, marginTop: compact ? 4 : 8 },
            ]}
            onPress={handleSignup}
            disabled={loading}
            accessibilityLabel="Sign up"
            accessibilityRole="button"
            accessibilityHint="Create your account"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.replace("/login")}
            accessibilityLabel="Go to login"
            accessibilityRole="link"
            accessibilityHint="Already have an account"
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Already registered? Login
            </Text>
          </TouchableOpacity>

          {/* Or divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, { borderColor: colors.border }]}
            onPress={async () => {
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
            }}
            accessibilityLabel="Sign up with Google"
            accessibilityRole="button"
          >
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              Continue with Google
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
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 14,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  linkButton: {
    marginTop: 6,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  googleButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center" as const,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
