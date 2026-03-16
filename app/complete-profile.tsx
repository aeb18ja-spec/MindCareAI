import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

export default function CompleteProfileScreen() {
  const { updateProfile, currentUser } = useAuth();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { width, height: viewportHeight } = useWindowDimensions();
  const compact = viewportHeight < 700;
  const twoColumn = width >= 380;
  const contentScale = Math.min(1, Math.max(0.9, viewportHeight / 820));

  const [dob, setDob] = useState("");
  const [weight, setWeight] = useState("");
  const [profileHeight, setProfileHeight] = useState("");
  const [sleepingHours, setSleepingHours] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    const dobTrimmed = dob.trim();
    const parsedWeight = Number(weight);
    const parsedHeight = Number(profileHeight);
    const parsedSleepingHours = Number(sleepingHours);

    if (
      !dobTrimmed ||
      !weight.trim() ||
      !profileHeight.trim() ||
      !sleepingHours.trim()
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
      setError("Please enter a valid weight (1-500 kg).");
      return;
    }

    if (
      !Number.isFinite(parsedHeight) ||
      parsedHeight <= 0 ||
      parsedHeight > 300
    ) {
      setError("Please enter a valid height (1-300 cm).");
      return;
    }

    if (
      !Number.isFinite(parsedSleepingHours) ||
      parsedSleepingHours < 0 ||
      parsedSleepingHours > 24
    ) {
      setError("Please enter valid sleeping hours (0-24).");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateProfile({
        dob: dobISO,
        weight: parsedWeight,
        height: parsedHeight,
        sleepingHours: parsedSleepingHours,
      });

      router.replace("/(tabs)");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save profile. Please try again.",
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
            <View style={styles.backRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                accessibilityLabel="Go back"
              >
                <Text style={[styles.backText, { color: colors.primary }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
            </View>
            {/* Progress indicator */}
            <View style={styles.progressRow}>
              <View
                style={[styles.progressDot, { backgroundColor: colors.primary }]}
              />
              <View
                style={[styles.progressDot, { backgroundColor: colors.primary }]}
              />
              <View
                style={[
                  styles.progressDot,
                  styles.progressDotActive,
                  { backgroundColor: colors.primary },
                ]}
              />
            </View>

            <Text
              style={[
                styles.title,
                { color: colors.text, fontSize: compact ? 22 : 26 },
              ]}
            >
              Complete Your Profile
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  marginBottom: compact ? 8 : 16,
                },
              ]}
            >
              Just a few more details to personalize your experience
            </Text>

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                📅 Date of Birth
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
                placeholder="DD-MM-YYYY"
                placeholderTextColor={colors.textSecondary}
                value={dob}
                onChangeText={(text) => setDob(formatDobDisplay(text))}
                keyboardType="numeric"
                maxLength={10}
                accessibilityLabel="Date of birth"
                accessibilityHint="Enter your date of birth as DD-MM-YYYY"
              />
            </View>

            {/* Weight & Height row */}
            <View style={[styles.row, !twoColumn && styles.rowStack]}>
              <View
                style={[
                  styles.formGroup,
                  styles.rowItem,
                  !twoColumn && styles.rowItemStack,
                ]}
              >
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  ⚖️ Weight (kg)
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
                  placeholder="e.g. 70"
                  placeholderTextColor={colors.textSecondary}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  accessibilityLabel="Weight in kilograms"
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
                  📏 Height (cm)
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
                  placeholder="e.g. 170"
                  placeholderTextColor={colors.textSecondary}
                  value={profileHeight}
                  onChangeText={setProfileHeight}
                  keyboardType="numeric"
                  accessibilityLabel="Height in centimeters"
                />
              </View>
            </View>

            {/* Sleep */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                😴 Average Sleep (hrs/night)
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
                placeholder="e.g. 7"
                placeholderTextColor={colors.textSecondary}
                value={sleepingHours}
                onChangeText={setSleepingHours}
                keyboardType="numeric"
                accessibilityLabel="Sleep hours per night"
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
                {
                  backgroundColor: colors.primary,
                  marginTop: compact ? 6 : 12,
                },
              ]}
              onPress={handleComplete}
              disabled={loading}
              accessibilityLabel="Complete profile"
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Get Started 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backRow: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    gap: 10,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.4,
  },
  progressDotActive: {
    opacity: 1,
    width: 28,
    borderRadius: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
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
});
