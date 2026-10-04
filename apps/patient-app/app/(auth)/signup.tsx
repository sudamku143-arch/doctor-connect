import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { signupSchema } from "@doctor-connect/validation";
import { supabase } from "@/lib/supabase/client";
import { AUTH_COLORS as C, AuthField } from "@/features/auth/AuthField";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setFormError(null);
    const result = signupSchema.safeParse({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      acceptedTerms,
    });
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
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: { full_name: result.data.fullName, phone: result.data.phone },
      },
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    router.replace("/(tabs)");
  }

  function goToLogin() {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  }

  return (
    <View style={styles.screen}>
      {/* Faint indigo wash at the top that fades into the slate-50 page. */}
      <LinearGradient
        colors={["#EEF2FF", C.background]}
        style={styles.topWash}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={goToLogin}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to log in"
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={20} color={C.ink} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Ionicons name="medical-outline" size={22} color={C.indigo} />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Book appointments with trusted doctors in a few taps.</Text>
          </View>

          <View style={styles.form}>
            <AuthField
              label="Full name"
              icon="person-outline"
              placeholder="e.g. Priya Sharma"
              autoCapitalize="words"
              autoComplete="name"
              value={fullName}
              onChangeText={setFullName}
              error={fieldErrors.fullName}
            />
            <AuthField
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
            />
            <AuthField
              label="Mobile number"
              icon="call-outline"
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              error={fieldErrors.phone}
            />
            <AuthField
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
            />
            <AuthField
              label="Confirm password"
              icon="lock-closed-outline"
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={fieldErrors.confirmPassword}
            />

            <View>
              <View style={styles.termsRow}>
                <Pressable
                  onPress={() => setAcceptedTerms((prev) => !prev)}
                  hitSlop={10}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                  style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
                >
                  {acceptedTerms ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </Pressable>
                <Text style={styles.termsText} onPress={() => setAcceptedTerms((prev) => !prev)}>
                  I agree to the{" "}
                  <Text style={styles.termsLink} onPress={() => router.push("/legal/terms")}>
                    Terms
                  </Text>{" "}
                  &{" "}
                  <Text style={styles.termsLink} onPress={() => router.push("/legal/privacy")}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>
              {fieldErrors.acceptedTerms ? <Text style={styles.inlineError}>{fieldErrors.acceptedTerms}</Text> : null}
            </View>

            {formError ? (
              <View style={styles.formErrorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={C.error} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSignup}
              disabled={loading}
              accessibilityRole="button"
              style={({ pressed }) => [styles.ctaWrap, pressed && styles.ctaPressed, loading && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[C.indigo, C.indigoLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Create account</Text>}
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            Already have an account?{" "}
            <Text style={styles.footerLink} onPress={goToLogin}>
              Log in
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  topWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    marginTop: 24,
    marginBottom: 28,
  },
  brandBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0E7FF",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: C.inkSecondary,
    marginTop: 8,
  },
  form: {
    gap: 18,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: C.indigo,
    borderColor: C.indigo,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: C.inkSecondary,
  },
  termsLink: {
    color: C.indigo,
    fontWeight: "600",
  },
  inlineError: {
    fontSize: 12,
    color: C.error,
    marginTop: 6,
    marginLeft: 30,
  },
  formErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  formErrorText: {
    flex: 1,
    fontSize: 13,
    color: C.error,
  },
  ctaWrap: {
    marginTop: 6,
    borderRadius: 14,
    shadowColor: C.indigo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
    elevation: 4,
  },
  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 14,
    color: C.inkSecondary,
  },
  footerLink: {
    color: C.indigo,
    fontWeight: "700",
  },
});
