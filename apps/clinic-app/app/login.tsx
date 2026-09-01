import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { loginSchema } from "@doctor-connect/validation";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { supabase } from "@/lib/supabase/client";

export default function ClinicLoginScreen() {
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
    router.replace("/dashboard");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <View>
            <Text style={styles.title}>Clinic Login</Text>
            <Text style={styles.subtitle}>Sign in with your clinic staff credentials</Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
            />
            <TextField
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
            />
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <PrimaryButton label="Login" onPress={handleLogin} loading={loading} />
          </View>

          <Text style={styles.helperText}>
            Don&apos;t have an account? Contact your clinic administrator to get access.
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
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xxs,
  },
  form: {
    gap: theme.spacing.md,
  },
  formError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[500],
  },
  helperText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
});
