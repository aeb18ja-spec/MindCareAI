import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const compact = height < 700;
  const contentScale = Math.min(1, Math.max(0.9, height / 820));

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(normalizedEmail, password);
      // Layout will handle routing based on profileComplete
    } catch (err) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Unable to login. Please try again.";

      // Friendlier error messages
      if (rawMsg.includes("Invalid login credentials")) {
        setError("No account found with this email, or incorrect password. Please sign up if you don't have an account.");
      } else if (rawMsg.includes("Email not confirmed")) {
        setError("Please verify your email before logging in.");
      } else {
        setError(rawMsg);
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
            { transform: [{ scale: contentScale }] },
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              padding: compact ? 18 : 24,
              gap: compact ? 8 : 10,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: compact ? 24 : 28 },
            ]}
          >
            MindCareAI
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary, marginBottom: compact ? 8 : 14 },
            ]}
          >
            Welcome back
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
              accessibilityHint="Enter your email to sign in"
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
              placeholder="Enter password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
            />
          </View>

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {!!error && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityLabel="Login"
            accessibilityRole="button"
            accessibilityHint="Sign in with your email and password"
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.googleButton, { borderColor: colors.border }]}
            onPress={async () => {
              if (loading) return;
              setError("");
              try {
                setLoading(true);
                await loginWithGoogle();
                // Layout will handle routing based on profileComplete
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to login with Google.",
                );
              } finally {
                setLoading(false);
              }
            }}
            accessibilityLabel="Login with Google"
            accessibilityRole="button"
          >
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("/signup")}
            accessibilityLabel="Sign up"
            accessibilityRole="link"
            accessibilityHint="Navigate to sign up screen"
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Don&apos;t have an account? Sign up
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
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 10,
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
  forgotRow: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  button: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  googleButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 15,
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
});
