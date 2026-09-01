import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import { useAuth } from "@/features/auth/AuthProvider";
import { POPULAR_SPECIALTIES } from "@/features/home/specialties";

// Static Phase 1 layout — specialty/doctor cards get promoted to shared
// packages/ui-native components once Phase 2 defines their real data shape.
export default function HomeScreen() {
  const { session } = useAuth();
  const firstName = (session?.user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.colors.primary[500]} />
            <Text style={styles.location}>Berhampur, Odisha</Text>
          </View>
          <Text style={styles.greeting}>Hi{firstName ? `, ${firstName}` : ""} 👋</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
        <TextInput
          placeholder="Search doctor, specialty or clinic"
          placeholderTextColor={theme.colors.text.tertiary}
          style={styles.searchInput}
        />
      </View>

      <Section title="Popular Specialties">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtyRow}>
          {POPULAR_SPECIALTIES.map((specialty) => (
            <View key={specialty.slug} style={styles.specialtyCard}>
              <View style={styles.specialtyIcon}>
                <Ionicons name={specialty.icon} size={22} color={theme.colors.primary[600]} />
              </View>
              <Text style={styles.specialtyName}>{specialty.name}</Text>
            </View>
          ))}
        </ScrollView>
      </Section>

      <Section title="Top Doctors Near You">
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No doctors to show yet</Text>
          <Text style={styles.emptyDescription}>
            Verified doctors near you will appear here once the doctor directory is connected.
          </Text>
        </View>
      </Section>

      <Section title="Nearby Clinics">
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No clinics to show yet</Text>
          <Text style={styles.emptyDescription}>Nearby verified clinics will appear here.</Text>
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  location: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    height: 52,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  specialtyRow: {
    gap: theme.spacing.sm,
  },
  specialtyCard: {
    width: 84,
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  specialtyIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  specialtyName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  emptyCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xxs,
  },
  emptyTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
