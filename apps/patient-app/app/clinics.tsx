import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ClinicCard, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { useLocation } from "@/features/location/LocationContext";
import { listNearbyClinicsWithSpecialties, type ClinicWithSpecialties } from "@/lib/api/clinics";
import { getOpenStatusLabel } from "@/lib/format";

export default function ClinicsScreen() {
  const insets = useSafeAreaInsets();
  const { city } = useLocation();
  const [clinics, setClinics] = useState<ClinicWithSpecialties[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listNearbyClinicsWithSpecialties(50, city)
      .then(setClinics)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) return <LoadingState title="Loading clinics…" />;
  if (error) return <ErrorState title={error} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Nearby Clinics</Text>
      </View>

      {clinics.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No clinics to show yet</Text>
          <Text style={styles.emptyDescription}>Verified clinics in your city will appear here.</Text>
        </View>
      ) : (
        clinics.map((clinic) => (
          <ClinicCard
            key={clinic.id}
            name={clinic.name}
            address={`${clinic.address}, ${clinic.city}`}
            statusLabel={getOpenStatusLabel(clinic.timings)}
            specialtyNames={clinic.specialtyNames}
            photoUrl={clinic.photos?.[0] ?? null}
            onPress={() => router.push(`/clinic/${clinic.id}`)}
          />
        ))
      )}
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
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
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
