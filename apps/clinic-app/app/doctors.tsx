import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { useClinic } from "@/features/clinic/ClinicContext";
import { listClinicDoctors } from "@/lib/api/doctors";
import type { ClinicDoctor } from "@/lib/api/types";

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const { staff } = useClinic();
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staff) return;
    listClinicDoctors(staff.clinic_id)
      .then(setDoctors)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [staff]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.md, paddingBottom: insets.bottom + theme.spacing.xxxl }]}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Doctors</Text>
      </View>

      {loading ? (
        <LoadingState title="Loading doctors…" />
      ) : error ? (
        <ErrorState title={error} />
      ) : doctors.length === 0 ? (
        <EmptyState icon="medkit-outline" title="No doctors at this clinic yet" />
      ) : (
        <View style={styles.card}>
          {doctors.map((item, index) => (
            <View key={item.doctorClinicId} style={[styles.row, index !== doctors.length - 1 && styles.rowDivider]}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={18} color={theme.colors.primary[600]} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.doctor.full_name}</Text>
                <Text style={styles.meta}>
                  {item.doctor.qualification} • {item.doctor.experience_years}+ yrs • ₹{item.consultationFee}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: item.doctor.verification_status === "VERIFIED" ? theme.colors.success[50] : theme.colors.warning[50] },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: item.doctor.verification_status === "VERIFIED" ? theme.colors.success[700] : theme.colors.warning[700] },
                  ]}
                >
                  {item.doctor.verification_status === "VERIFIED" ? "Verified" : "Pending"}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
    gap: theme.spacing.lg,
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
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.cardShadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  meta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  statusPill: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold as any,
  },
});
