import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";

// Placeholder copy — replace with your actual reviewed terms of service
// before this screen is shown to real users.
export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Terms of Service</Text>
      </View>

      <Text style={styles.sectionTitle}>Using the app</Text>
      <Text style={styles.paragraph}>
        Doctor Connect lets you discover doctors and clinics, book appointments, and manage your
        prescriptions. You agree to provide accurate information when creating your profile and booking
        appointments.
      </Text>

      <Text style={styles.sectionTitle}>Appointments</Text>
      <Text style={styles.paragraph}>
        Booking a slot confirms your appointment subject to the clinic’s own policies. Cancellations and
        reschedules are handled in the “My Appointments” tab; repeated no-shows may affect your ability to
        book with a clinic in future.
      </Text>

      <Text style={styles.sectionTitle}>Medical content</Text>
      <Text style={styles.paragraph}>
        Prescriptions and medical advice shown in the app come from the doctor you consulted — Doctor
        Connect is a booking and records platform, not a medical provider, and does not itself diagnose or
        prescribe.
      </Text>

      <Text style={styles.sectionTitle}>Account</Text>
      <Text style={styles.paragraph}>
        You are responsible for keeping your login credentials confidential. You can request account
        deletion at any time from Help &amp; Support.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  paragraph: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
