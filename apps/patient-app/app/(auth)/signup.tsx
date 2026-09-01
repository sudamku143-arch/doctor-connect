import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link, router } from "expo-router";
import { signupSchema } from "@doctor-connect/validation";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { supabase } from "@/lib/supabase/client";
import { authStyles } from "@/features/auth/authStyles";

export default function SignupScreen() {
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={authStyles.scroll}>
        <View style={authStyles.container}>
          <View>
            <Text style={authStyles.title}>Create your account</Text>
            <Text style={authStyles.subtitle}>Book appointments in a few taps</Text>
          </View>

          <View style={authStyles.form}>
            <TextField label="Full name" value={fullName} onChangeText={setFullName} error={fieldErrors.fullName} />
            <TextField
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
            />
            <TextField
              label="Mobile number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              error={fieldErrors.phone}
            />
            <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} error={fieldErrors.password} />
            <TextField
              label="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={fieldErrors.confirmPassword}
            />

            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}
              onPress={() => setAcceptedTerms((prev) => !prev)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: theme.radii.sm,
                  borderWidth: 1,
                  borderColor: acceptedTerms ? theme.colors.primary[500] : theme.colors.border.strong,
                  backgroundColor: acceptedTerms ? theme.colors.primary[500] : "transparent",
                }}
              />
              <Text style={authStyles.legalText}>I agree to the Terms & Privacy Policy</Text>
            </Pressable>
            {fieldErrors.acceptedTerms ? <Text style={authStyles.formError}>{fieldErrors.acceptedTerms}</Text> : null}

            {formError ? <Text style={authStyles.formError}>{formError}</Text> : null}
            <PrimaryButton label="Create account" onPress={handleSignup} loading={loading} />
          </View>

          <View style={authStyles.linkRow}>
            <Text style={authStyles.linkText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={authStyles.link}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
