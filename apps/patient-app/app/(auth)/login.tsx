import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link, router } from "expo-router";
import { loginSchema } from "@doctor-connect/validation";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { supabase } from "@/lib/supabase/client";
import { authStyles } from "@/features/auth/authStyles";

export default function LoginScreen() {
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={authStyles.scroll}>
        <View style={authStyles.container}>
          <View>
            <Text style={authStyles.title}>Welcome back</Text>
            <Text style={authStyles.subtitle}>Sign in to book and manage your appointments</Text>
          </View>

          <View style={authStyles.form}>
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
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text style={authStyles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </Link>
            {formError ? <Text style={authStyles.formError}>{formError}</Text> : null}
            <PrimaryButton label="Login" onPress={handleLogin} loading={loading} />
          </View>

          <View style={authStyles.linkRow}>
            <Text style={authStyles.linkText}>Don&apos;t have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={authStyles.link}>Create account</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={authStyles.legalText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
