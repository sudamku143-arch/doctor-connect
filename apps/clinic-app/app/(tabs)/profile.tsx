import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState, SecondaryButton } from "@doctor-connect/ui-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { useClinic } from "@/features/clinic/ClinicContext";
import { supabase } from "@/lib/supabase/client";

export default function ReceptionistProfileScreen() {
  const { session } = useAuth();
  const { staff, isLoading, error } = useClinic();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (isLoading) return <LoadingState title="Loading profile…" />;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{staff?.clinic.name.charAt(0).toUpperCase() ?? "?"}</Text>
        </View>
        <Text style={styles.email}>{session?.user.email}</Text>

        {error || !staff ? (
          <ErrorState title={error ?? "Not linked to a clinic yet."} />
        ) : (
          <View style={styles.section}>
            <Row label="Role" value={staff.role === "CLINIC_ADMIN" ? "Clinic Admin" : "Receptionist"} />
            <Row label="Clinic" value={staff.clinic.name} />
            {staff.clinic.phone ? <Row label="Clinic phone" value={staff.clinic.phone} /> : null}
          </View>
        )}

        <Pressable style={styles.rowLink} onPress={() => router.push("/clinic-profile")}>
          <View style={styles.rowLinkLeft}>
            <Ionicons name="business-outline" size={theme.iconSizes.md} color={theme.colors.text.secondary} />
            <Text style={styles.rowLinkLabel}>Clinic Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={theme.iconSizes.sm} color={theme.colors.text.tertiary} />
        </Pressable>

        <SecondaryButton label="Logout" onPress={handleLogout} style={styles.logoutButton} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[700],
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  section: {
    width: "100%",
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  rowValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  rowLink: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  rowLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  rowLinkLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  logoutButton: {
    marginTop: theme.spacing.xl,
  },
});
