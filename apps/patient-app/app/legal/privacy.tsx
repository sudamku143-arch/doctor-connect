import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";

// Placeholder copy — replace with your actual reviewed privacy policy
// before this screen is shown to real users.
export default function PrivacyPolicyScreen() {
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
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <Text style={styles.paragraph}>
        Doctor Connect ("we", "us") respects your privacy. This policy explains what information we
        collect through the app and how it is used.
      </Text>

      <Text style={styles.sectionTitle}>Information we collect</Text>
      <Text style={styles.paragraph}>
        Name, phone number, email, date of birth and gender you provide when creating your profile;
        appointment and booking details; and prescriptions uploaded by your treating doctor.
      </Text>

      <Text style={styles.sectionTitle}>How we use it</Text>
      <Text style={styles.paragraph}>
        To let you book and manage appointments, show your prescriptions to you, send appointment-related
        notifications, and let the clinic staff and doctor you booked with see the details needed to treat
        you.
      </Text>

      <Text style={styles.sectionTitle}>Who can see your data</Text>
      <Text style={styles.paragraph}>
        Only you, the doctor/clinic staff for appointments you book with them, and platform administrators
        for support and verification purposes. We do not sell your data.
      </Text>

      <Text style={styles.sectionTitle}>Your choices</Text>
      <Text style={styles.paragraph}>
        You can edit or delete your profile information, and control notification preferences, from the
        Profile tab at any time.
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
