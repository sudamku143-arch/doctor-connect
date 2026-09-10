import { useEffect, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { getClinicById, type ClinicWithSpecialties } from "@/lib/api/clinics";
import { getDirectionsUrl, getOpenStatusLabel, getPhoneUrl } from "@/lib/format";

export default function ClinicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [clinic, setClinic] = useState<ClinicWithSpecialties | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getClinicById(id)
      .then((data) => {
        if (!data) {
          setError("Clinic not found.");
          return;
        }
        setClinic(data);
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState title="Loading clinic…" />;
  if (error || !clinic) return <ErrorState title={error ?? "Clinic not found."} />;

  const photoUrl = clinic.photos?.[0] ?? null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Clinic Details
        </Text>
      </View>

      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Ionicons name="business" size={40} color={theme.colors.primary[400]} />
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.name}>{clinic.name}</Text>
        <Text style={styles.address}>
          {clinic.address}, {clinic.city}
        </Text>
        <Text style={styles.status}>{getOpenStatusLabel(clinic.timings)}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={() => Linking.openURL(getDirectionsUrl(clinic))}>
            <Ionicons name="navigate-outline" size={16} color={theme.colors.primary[600]} />
            <Text style={styles.actionLabel}>Get Directions</Text>
          </Pressable>
          {clinic.phone ? (
            <Pressable style={styles.actionButton} onPress={() => Linking.openURL(getPhoneUrl(clinic.phone!))}>
              <Ionicons name="call-outline" size={16} color={theme.colors.primary[600]} />
              <Text style={styles.actionLabel}>Contact Clinic</Text>
            </Pressable>
          ) : null}
        </View>

        {clinic.specialtyNames.length > 0 ? (
          <View style={styles.chipRow}>
            {clinic.specialtyNames.map((specialty) => (
              <View key={specialty} style={styles.chip}>
                <Text style={styles.chipLabel}>{specialty}</Text>
              </View>
            ))}
          </View>
        ) : null}
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
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: theme.radii.lg,
  },
  photoFallback: {
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  address: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  status: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.success[700],
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.primary[600],
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xxs,
    marginTop: theme.spacing.xs,
  },
  chip: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
  },
  chipLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.primary[700],
  },
});
