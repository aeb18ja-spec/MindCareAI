import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Moon,
    Ruler,
    Sparkles,
    Weight,
} from "lucide-react-native";
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

  // Calculate progress (how many fields are filled)
  const filledFields = [dob, weight, profileHeight, sleepingHours].filter(
    (v) => v.trim().length > 0,
  ).length;
  const progressPercent = filledFields / 4;

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
                padding: compact ? 22 : 32,
                shadowColor: isDarkMode ? "#000" : "#6C63FF",
              },
            ]}
          >
            {/* Back button */}
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                Back
              </Text>
            </TouchableOpacity>

            {/* Modern progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Step 3 of 3
                </Text>
                <Text
                  style={[
                    styles.progressPercent,
                    { color: colors.primary },
                  ]}
                >
                  {Math.round(progressPercent * 100)}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.borderLight },
                ]}
              >
                <LinearGradient
                  colors={colors.gradient.button as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(5, progressPercent * 100)}%` as any },
                  ]}
                />
              </View>
            </View>

            {/* Icon + Title */}
            <View style={styles.headerSection}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Sparkles size={24} color={colors.primary} strokeWidth={2} />
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
                    marginBottom: compact ? 4 : 8,
                  },
                ]}
              >
                Just a few more details to personalize your experience
              </Text>
            </View>

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Calendar
                  size={15}
                  color={colors.primary}
                  strokeWidth={2}
                />
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Date of Birth
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingVertical: compact ? 12 : 14,
                  },
                ]}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={colors.textMuted}
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
                <View style={styles.labelRow}>
                  <Weight
                    size={15}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text
                    style={[styles.label, { color: colors.textSecondary }]}
                  >
                    Weight (kg)
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      paddingVertical: compact ? 12 : 14,
                    },
                  ]}
                  placeholder="e.g. 70"
                  placeholderTextColor={colors.textMuted}
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
                <View style={styles.labelRow}>
                  <Ruler
                    size={15}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text
                    style={[styles.label, { color: colors.textSecondary }]}
                  >
                    Height (cm)
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      paddingVertical: compact ? 12 : 14,
                    },
                  ]}
                  placeholder="e.g. 170"
                  placeholderTextColor={colors.textMuted}
                  value={profileHeight}
                  onChangeText={setProfileHeight}
                  keyboardType="numeric"
                  accessibilityLabel="Height in centimeters"
                />
              </View>
            </View>

            {/* Sleep */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Moon size={15} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Average Sleep (hrs/night)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingVertical: compact ? 12 : 14,
                  },
                ]}
                placeholder="e.g. 7"
                placeholderTextColor={colors.textMuted}
                value={sleepingHours}
                onChangeText={setSleepingHours}
                keyboardType="numeric"
                accessibilityLabel="Sleep hours per night"
              />
            </View>

            {!!error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.buttonWrapper,
                { marginTop: compact ? 4 : 8 },
              ]}
              onPress={handleComplete}
              disabled={loading}
              accessibilityLabel="Complete profile"
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
                  <Text style={styles.buttonText}>Get Started</Text>
                )}
              </LinearGradient>
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
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 28,
    padding: 32,
    gap: 14,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  progressSection: {
    width: "100%",
    gap: 8,
    marginBottom: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  headerSection: {
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
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
  },
  formGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowStack: {
    flexDirection: "column",
    gap: 14,
  },
  rowItem: {
    flex: 1,
  },
  rowItemStack: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
});
