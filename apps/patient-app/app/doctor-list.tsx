import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { DoctorCard, EmptyState, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { useLocation } from "@/features/location/LocationContext";
import { searchDoctors } from "@/lib/api/doctors";
import type { DoctorListItem } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

export default function DoctorListScreen() {
  const insets = useSafeAreaInsets();
  const { specialtyId, specialtyName } = useLocalSearchParams<{ specialtyId: string; specialtyName?: string }>();
  const { city } = useLocation();
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    searchDoctors({ specialtyId, city })
      .then(setDoctors)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [specialtyId, city]);

  if (loading) return <LoadingState title="Loading doctors…" />;
  if (error) return <ErrorState title={error} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      {specialtyName ? <Text style={styles.heading}>{specialtyName}</Text> : null}
      {doctors.length === 0 ? (
        <EmptyState
          title={city ? `No doctors found in ${city}.` : "No doctors found."}
          description="Check back soon as more doctors join this specialty."
        />
      ) : (
        doctors.map((item) => (
          <DoctorCard
            key={item.doctorClinicId}
            photoUrl={item.doctor.photo_url}
            name={item.doctor.full_name}
            verified={item.doctor.verification_status === "VERIFIED"}
            qualification={item.doctor.qualification}
            specialtyNames={item.specialties.map((s) => s.name)}
            experienceYears={item.doctor.experience_years}
            averageRating={item.averageRating}
            reviewCount={item.reviewCount}
            clinicName={item.clinic.name}
            consultationFee={item.consultationFee}
            nextAvailableLabel={
              item.nextAvailable
                ? `${formatDateLabel(item.nextAvailable.date)}, ${formatTimeLabel(item.nextAvailable.startTime)}`
                : null
            }
            onViewProfile={() => router.push(`/doctor/${item.doctorClinicId}`)}
            onClinicPress={() => router.push(`/clinic/${item.clinic.id}`)}
            onBook={() => router.push({ pathname: "/(booking)/consultation-type", params: { doctorClinicId: item.doctorClinicId } })}
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
    gap: theme.spacing.sm,
  },
  heading: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
});
