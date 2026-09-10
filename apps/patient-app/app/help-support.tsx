import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";

// Placeholder contact details — replace with your real support channels.
const SUPPORT_EMAIL = "support@doctorconnect.app";
const SUPPORT_PHONE = "+91 9000000000";

const FAQS = [
  {
    q: "How do I book an appointment?",
    a: "Go to the Search tab or a specialty on Home, pick a doctor, choose an available slot, fill in patient details and confirm.",
  },
  {
    q: "How do I cancel or reschedule?",
    a: "Open the appointment from \"My Appointments\" and use the Reschedule or Cancel Appointment buttons.",
  },
  {
    q: "Where do I find my prescription?",
    a: "Open a Completed appointment — a \"Download Prescription\" button appears there once your doctor has uploaded one.",
  },
  {
    q: "How do I add a family member?",
    a: "Go to Profile → Family Members → Add New Family Member. You can then book appointments on their behalf.",
  },
];

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function reportIssue() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Doctor Connect — Issue Report")}`);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
      <View style={styles.faqList}>
        {FAQS.map((item, index) => {
          const open = openIndex === index;
          return (
            <View key={item.q} style={styles.faqItem}>
              <Pressable
                style={styles.faqQuestionRow}
                onPress={() => setOpenIndex(open ? null : index)}
              >
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-down"}
                  size={theme.iconSizes.sm}
                  color={theme.colors.text.tertiary}
                />
              </Pressable>
              {open ? <Text style={styles.faqAnswer}>{item.a}</Text> : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Contact Support</Text>
      <View style={styles.contactList}>
        <ContactRow
          icon="call-outline"
          label={SUPPORT_PHONE}
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
        />
        <ContactRow
          icon="mail-outline"
          label={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
      </View>

      <Pressable style={styles.reportButton} onPress={reportIssue}>
        <Ionicons name="flag-outline" size={theme.iconSizes.md} color={theme.colors.error[500]} />
        <Text style={styles.reportLabel}>Report an Issue</Text>
      </Pressable>
    </ScrollView>
  );
}

function ContactRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.contactRow} onPress={onPress}>
      <Ionicons name={icon} size={theme.iconSizes.md} color={theme.colors.primary[600]} />
      <Text style={styles.contactLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  faqList: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: "hidden",
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  faqAnswer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  contactList: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  contactLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.error[500],
  },
  reportLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.error[500],
  },
});
