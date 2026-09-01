import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { forgotPasswordSchema } from "@doctor-connect/validation";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { supabase } from "@/lib/supabase/client";
import { authStyles } from "@/features/auth/authStyles";

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
      setFormError("Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={authStyles.scroll}>
        <View style={authStyles.container}>
          <View>
            <Text style={authStyles.title}>Reset your password</Text>
            <Text style={authStyles.subtitle}>We&apos;ll email you a reset link</Text>
          </View>

          {sent ? (
            <Text style={authStyles.subtitle}>
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
              {formError ? <Text style={authStyles.formError}>{formError}</Text> : null}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
