import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";

const SUPPORT_PHONE = "+911234567890";
const SUPPORT_EMAIL = "support@doctorconnect.app";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How do I check in a patient?",
    answer: "Open the appointment from Today's Queue or Appointments and tap Check In once they've arrived.",
  },
  {
    question: "How do I book a walk-in patient?",
    answer:
      "Use the New Appointment quick action on the Dashboard. The patient must already have an account on the Doctor Connect app — search them by name or mobile number.",
  },
  {
    question: "A patient isn't showing up in search",
    answer: "They may not have registered on the patient app yet, or may be registered with a different mobile number.",
  },
  {
    question: "How do I block a doctor's slot for a leave or emergency?",
    answer: "Go to Doctor Schedule → the doctor's availability screen, then use Block Slot or add a Leave.",
  },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.md, paddingBottom: insets.bottom + theme.spacing.xxxl }]}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Support</Text>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Need help right now?</Text>
        <Text style={styles.contactSubtitle}>Our support team is available every day, 9 AM – 8 PM.</Text>
        <View style={styles.contactActions}>
          <Pressable style={styles.contactButton} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}>
            <Ionicons name="call" size={18} color={theme.colors.primary[600]} />
            <Text style={styles.contactButtonText}>Call Support</Text>
          </Pressable>
          <Pressable style={styles.contactButton} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            <Ionicons name="mail" size={18} color={theme.colors.primary[600]} />
            <Text style={styles.contactButtonText}>Email Us</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently asked questions</Text>
        <View style={styles.faqCard}>
          {FAQS.map((faq, index) => (
            <View key={faq.question} style={[styles.faqRow, index !== FAQS.length - 1 && styles.faqRowDivider]}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>
      </View>
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
    gap: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  contactCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary[50],
    gap: theme.spacing.sm,
  },
  contactTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[700],
  },
  contactSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[700],
  },
  contactActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
    ...theme.cardShadow,
  },
  contactButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  faqCard: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.cardShadow,
  },
  faqRow: {
    padding: theme.spacing.md,
    gap: 4,
  },
  faqRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  faqQuestion: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  faqAnswer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.fontSize.sm * 1.4,
  },
});
