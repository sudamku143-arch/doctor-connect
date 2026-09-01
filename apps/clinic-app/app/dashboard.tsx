import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { SecondaryButton } from "@doctor-connect/ui-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

// Static shell for Phase 1 — live stats/queue/appointments land in Phase 3
// (Clinic app backend), per docs/ARCHITECTURE.md.
const STATS = [
  { label: "Today's Appointments", value: "—" },
  { label: "Checked In", value: "—" },
  { label: "Waiting", value: "—" },
  { label: "Completed", value: "—" },
];

const QUICK_ACTIONS = ["Today's Queue", "Add Walk-in", "Appointments", "Doctor Schedule"];

export default function ClinicDashboardScreen() {
  const { session } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good Morning, Receptionist</Text>
            <Text style={styles.email}>{session?.user.email}</Text>
          </View>
          <SecondaryButton label="Logout" onPress={handleLogout} fullWidth={false} size="sm" />
        </View>

        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <View key={action} style={styles.actionCard}>
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s appointments</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No appointments today</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statCard: {
    flexGrow: 1,
    minWidth: "45%",
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 4,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  actionCard: {
    flexGrow: 1,
    minWidth: "45%",
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary[50],
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  emptyCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  emptyTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
});
