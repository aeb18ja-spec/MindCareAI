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

/** Format as dd-mm-yyyy, auto-insert "-" after dd and mm. Only allows digits; max 8 digits. */
function formatDobDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/** Convert dd-mm-yyyy to yyyy-mm-dd for API. */
function dobDisplayToISO(display: string): string {
  const match = display.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { width, height: viewportHeight } = useWindowDimensions();
  const compact = viewportHeight < 760;
  const twoColumn = width >= 380;
  const contentScale = Math.min(1, Math.max(0.78, viewportHeight / 900));

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [weight, setWeight] = useState("");
  const [profileHeight, setProfileHeight] = useState("");
  const [sleepingHours, setSleepingHours] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const dobTrimmed = dob.trim();
    const parsedWeight = Number(weight);
    const parsedHeight = Number(profileHeight);
    const parsedSleepingHours = Number(sleepingHours);

    if (
      !normalizedName ||
      !dobTrimmed ||
      !weight.trim() ||
      !profileHeight.trim() ||
      !sleepingHours.trim() ||
      !normalizedEmail ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const dobISO = dobDisplayToISO(dobTrimmed);
    const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dobRegex.test(dobTrimmed) || !dobISO) {
      setError("Please enter date of birth as DD-MM-YYYY (e.g. 15-03-1990).");
      return;
    }
    const dobDate = new Date(dobISO);
    if (Number.isNaN(dobDate.getTime())) {
      setError("Please enter a valid date of birth.");
      return;
    }
    const today = new Date();
    if (dobDate > today) {
      setError("Date of birth cannot be in the future.");
      return;
    }
    const minDate = new Date(today.getFullYear() - 120, 0, 1);
    if (dobDate < minDate) {
      setError("Please enter a valid date of birth.");
      return;
    }

    if (
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0 ||
      parsedWeight > 500
    ) {
      setError("Please enter a valid weight.");
      return;
    }

    if (
      !Number.isFinite(parsedHeight) ||
      parsedHeight <= 0 ||
      parsedHeight > 300
    ) {
      setError("Please enter a valid height.");
      return;
    }

    if (
      !Number.isFinite(parsedSleepingHours) ||
      parsedSleepingHours < 0 ||
      parsedSleepingHours > 24
    ) {
      setError("Please enter valid sleeping hours.");
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
      await signup(
        normalizedName,
        dobISO,
        parsedWeight,
        parsedHeight,
        parsedSleepingHours,
        normalizedEmail,
        password,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign up. Please try again.";

      if (message.includes("Please confirm your email")) {
        router.replace("/login");
        return;
      }

      setError(message);
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
              padding: compact ? 16 : 22,
              gap: compact ? 6 : 8,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: compact ? 22 : 28 },
            ]}
          >
            Create Account
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary, marginBottom: compact ? 6 : 10 },
            ]}
          >
            Sign up to continue
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  paddingVertical: compact ? 8 : 10,
                },
              ]}
              placeholder="Your full name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Full name"
              accessibilityHint="Enter your full name"
            />
          </View>

          <View style={[styles.row, !twoColumn && styles.rowStack]}>
            <View
              style={[
                styles.formGroup,
                styles.rowItem,
                !twoColumn && styles.rowItemStack,
              ]}
            >
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Date of birth
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingVertical: compact ? 8 : 10,
                  },
                ]}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={colors.textSecondary}
                value={dob}
                onChangeText={(text) => setDob(formatDobDisplay(text))}
                keyboardType="numeric"
                maxLength={10}
                accessibilityLabel="Date of birth"
                accessibilityHint="Enter your date of birth as DD-MM-YYYY; dashes are added automatically"
              />
            </View>

            <View
              style={[
                styles.formGroup,
                styles.rowItem,
                !twoColumn && styles.rowItemStack,
              ]}
            >
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Weight (kg)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingVertical: compact ? 8 : 10,
                  },
                ]}
                placeholder="Weight"
                placeholderTextColor={colors.textSecondary}
                value={weight}
                onChangeText={setWeight}
                accessibilityLabel="Weight in kilograms"
                accessibilityHint="Enter your weight"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.row, !twoColumn && styles.rowStack]}>
            <View
              style={[
                styles.formGroup,
                styles.rowItem,
                !twoColumn && styles.rowItemStack,
              ]}
            >
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Height (cm)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingVertical: compact ? 8 : 10,
                  },
                ]}
                placeholder="Height"
                placeholderTextColor={colors.textSecondary}
                value={profileHeight}
                onChangeText={setProfileHeight}
                keyboardType="numeric"
                accessibilityLabel="Height in centimeters"
                accessibilityHint="Enter your height"
              />
            </View>

            <View
              style={[
                styles.formGroup,
                styles.rowItem,
                !twoColumn && styles.rowItemStack,
              ]}
            >
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Sleep (hrs)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingVertical: compact ? 8 : 10,
                  },
                ]}
                placeholder="Sleep"
                placeholderTextColor={colors.textSecondary}
                value={sleepingHours}
                onChangeText={setSleepingHours}
                keyboardType="numeric"
                accessibilityLabel="Sleep hours per night"
                accessibilityHint="Enter average hours of sleep"
              />
            </View>
          </View>

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
                  paddingVertical: compact ? 8 : 10,
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

          <View style={[styles.row, !twoColumn && styles.rowStack]}>
            <View
              style={[
                styles.formGroup,
                styles.rowItem,
                !twoColumn && styles.rowItemStack,
              ]}
            >
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
                    paddingVertical: compact ? 8 : 10,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                accessibilityLabel="Password"
                accessibilityHint="Enter at least 6 characters"
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View
              style={[
                styles.formGroup,
                styles.rowItem,
                !twoColumn && styles.rowItemStack,
              ]}
            >
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Confirm
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingVertical: compact ? 8 : 10,
                  },
                ]}
                placeholder="Confirm"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                accessibilityLabel="Confirm password"
                accessibilityHint="Re-enter your password"
              />
            </View>
          </View>

          {!!error && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary, marginTop: compact ? 4 : 6 },
            ]}
            onPress={handleSignup}
            accessibilityLabel="Sign up"
            accessibilityRole="button"
            accessibilityHint="Create your account"
          >
            <Text style={styles.buttonText}>Sign Up</Text>
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
    maxWidth: 460,
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
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowStack: {
    flexDirection: "column",
    gap: 8,
  },
  rowItem: {
    flex: 1,
  },
  rowItemStack: {
    width: "100%",
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
  linkButton: {
    marginTop: 6,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
