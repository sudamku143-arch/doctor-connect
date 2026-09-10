import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import type { AuthError } from "@supabase/supabase-js";
import { forgotPasswordSchema } from "@doctor-connect/validation";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { supabase } from "@/lib/supabase/client";
import { authStyles } from "@/features/auth/authStyles";

function getErrorMessage(error: AuthError): string {
  const message = error.message.toLowerCase();
  if (message.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }
  if (message.includes("invalid")) {
    return "This email address looks invalid. Please check and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setFieldErrors({ email: result.error.issues[0]?.message ?? "Enter a valid email" });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(result.data.email);
    setLoading(false);

    if (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console -- dev-only: stripped from production builds
        console.error("resetPasswordForEmail failed:", error.status, error.code, error.message);
      }
      setFormError(getErrorMessage(error));
      return;
    }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </Pressable>

        <View style={authStyles.container}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={32} color={theme.colors.primary[500]} />
          </View>

          <View>
            <Text style={[authStyles.title, styles.centerText]}>Reset your password</Text>
            <Text style={[authStyles.subtitle, styles.centerText]}>We&apos;ll email you a reset link</Text>
          </View>

          {sent ? (
            <Text style={[authStyles.subtitle, styles.centerText]}>
              If an account exists for {email}, a reset link is on its way.
            </Text>
          ) : (
            <View style={authStyles.form}>
              <TextField
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
              />
              {formError ? (
                <View style={styles.errorRow}>
                  <Ionicons name="warning" size={16} color={theme.colors.error[500]} />
                  <Text style={authStyles.formError}>{formError}</Text>
                </View>
              ) : null}
              <PrimaryButton label="Send reset link" onPress={handleSubmit} loading={loading} />
            </View>
          )}

          <View style={authStyles.linkRow}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={authStyles.link}>Back to login</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.footerNote}>
            Didn&apos;t receive the email? Check your spam folder or try again in a few minutes.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.default,
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: theme.spacing.xl,
    marginLeft: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    textAlign: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs,
  },
  footerNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
});
