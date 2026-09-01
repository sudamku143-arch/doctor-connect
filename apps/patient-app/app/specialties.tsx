import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { listSpecialties, type SpecialtyWithCount } from "@/lib/api/specialties";
import { getSpecialtyIcon } from "@/lib/specialtyIcons";

export default function SpecialtiesScreen() {
  const [specialties, setSpecialties] = useState<SpecialtyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSpecialties()
      .then(setSpecialties)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState title="Loading specialties…" />;
  if (error) return <ErrorState title={error} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.grid}>
      {specialties.map((specialty) => (
        <Pressable
          key={specialty.id}
          style={styles.card}
          onPress={() => router.push({ pathname: "/doctor-list", params: { specialtyId: specialty.id, specialtyName: specialty.name } })}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={getSpecialtyIcon(specialty.icon)} size={24} color={theme.colors.primary[600]} />
          </View>
          <Text style={styles.name}>{specialty.name}</Text>
          <Text style={styles.count}>
            {specialty.doctorCount} {specialty.doctorCount === 1 ? "doctor" : "doctors"}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  grid: {
    padding: theme.spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  card: {
    width: "47%",
    padding: theme.spacing.md,
    borderRadius: theme.cardStyle.radius,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xxs,
  },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  count: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
