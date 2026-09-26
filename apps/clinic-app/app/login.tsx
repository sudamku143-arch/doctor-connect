import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { loginSchema } from "@doctor-connect/validation";
import { TextField } from "@doctor-connect/ui-native";
import { supabase } from "@/lib/supabase/client";
import { DoctorIllustration } from "@/features/auth/DoctorIllustration";

const SCRIM_TOP = "#5B4696";
const SCRIM_BOTTOM = "#332259";
const INK = "#F5F2FF";
const INK_SECONDARY = "#C7BCEE";
const INK_TERTIARY = "#9384C4";
const ACCENT = "#8B5CFF";
const ACCENT_STRONG = "#A480FF";

export default function ClinicLoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setFormError(null);
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(result.data);
    setLoading(false);

    if (error) {
      setFormError("Invalid email or password. Please try again.");
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <LinearGradient colors={[SCRIM_TOP, SCRIM_BOTTOM]} style={styles.gradient}>
      <StatusBar style="light" />
      <View style={styles.glowField} pointerEvents="none" />
      <View style={styles.blobLow} pointerEvents="none" />
      <View style={styles.doctorArtWrap} pointerEvents="none">
        <DoctorIllustration width={300} height={260} />
      </View>
      <View style={[styles.topRightIcon, { top: insets.top + theme.spacing.sm }]} pointerEvents="none">
        <Ionicons name="business-outline" size={36} color={ACCENT_STRONG} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top, paddingBottom: insets.bottom + theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.heading}>
              <Text style={styles.title}>Clinic Login</Text>
              <Text style={styles.subtitle}>Sign in with your clinic staff credentials</Text>
            </View>

            <View style={styles.form}>
              <TextField
                label="Email"
                leftIcon="mail-outline"
                elevated
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="staff@clinic.com"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
              />
              <TextField
                label="Password"
                leftIcon="lock-closed-outline"
                elevated
                secureTextEntry
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
              />
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [styles.loginButtonWrap, pressed && styles.loginButtonPressed]}
              >
                <LinearGradient
                  colors={["#9D71FF", ACCENT, "#6E3FE0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButtonGradient}
                >
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>Login</Text>}
                </LinearGradient>
              </Pressable>
            </View>

            <Text style={styles.helperText}>
              Don&apos;t have an account? Contact your clinic administrator to get access.
            </Text>

            <Text style={styles.registerLinkText}>
              New clinic?{" "}
              <Text style={styles.registerLink} onPress={() => router.push("/register-clinic")}>
                Register here
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    overflow: "hidden",
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: "center",
    gap: theme.spacing.xl,
  },
  glowField: {
    position: "absolute",
    top: -160,
    left: "50%",
    marginLeft: -260,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: "rgba(139,92,255,0.22)",
  },
  blobLow: {
    position: "absolute",
    bottom: -140,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(139,92,255,0.10)",
  },
  doctorArtWrap: {
    position: "absolute",
    top: 46,
    left: "50%",
    marginLeft: -150,
    opacity: 0.9,
  },
  topRightIcon: {
    position: "absolute",
    right: theme.spacing.lg,
  },
  heading: {
    marginTop: theme.spacing.xxxl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    letterSpacing: -0.3,
    color: INK,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: INK_SECONDARY,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  form: {
    gap: theme.spacing.md,
  },
  formError: {
    fontSize: theme.fontSize.sm,
    color: "#FF9B9B",
    textAlign: "center",
  },
  loginButtonWrap: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.buttonSizes.md.radius,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  loginButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  loginButtonGradient: {
    height: theme.buttonSizes.md.height,
    borderRadius: theme.buttonSizes.md.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: theme.buttonSizes.md.fontSize,
    fontWeight: theme.fontWeight.bold as any,
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  helperText: {
    fontSize: theme.fontSize.xs,
    color: INK_TERTIARY,
    textAlign: "center",
  },
  registerLinkText: {
    fontSize: theme.fontSize.sm,
    color: INK_SECONDARY,
    textAlign: "center",
    marginTop: -theme.spacing.sm,
  },
  registerLink: {
    fontWeight: theme.fontWeight.semibold as any,
    color: ACCENT_STRONG,
  },
});
