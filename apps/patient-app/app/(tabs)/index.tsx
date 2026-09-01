import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { AppointmentCard, DoctorCard, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { listSpecialties, type SpecialtyWithCount } from "@/lib/api/specialties";
import { listTopDoctors } from "@/lib/api/doctors";
import { listNearbyClinics } from "@/lib/api/clinics";
import { getNextUpcomingAppointment } from "@/lib/api/appointments";
import type { AppointmentWithDetails, DoctorListItem } from "@/lib/api/types";
import { getSpecialtyIcon } from "@/lib/specialtyIcons";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";
import type { Clinic } from "@doctor-connect/types";

export default function HomeScreen() {
  const { session } = useAuth();
  const firstName = (session?.user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  const [specialties, setSpecialties] = useState<SpecialtyWithCount[]>([]);
  const [topDoctors, setTopDoctors] = useState<DoctorListItem[]>([]);
  const [nearbyClinics, setNearbyClinics] = useState<Clinic[]>([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<AppointmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([listSpecialties(), listTopDoctors(5), listNearbyClinics(5), getNextUpcomingAppointment()])
        .then(([specialtyRows, doctorRows, clinicRows, appointment]) => {
          setSpecialties(specialtyRows);
          setTopDoctors(doctorRows);
          setNearbyClinics(clinicRows);
          setUpcomingAppointment(appointment);
        })
        .catch(() => setError("Something went wrong. Please try again."))
        .finally(() => setLoading(false));
    }, []),
  );

  if (loading) return <LoadingState title="Loading…" />;
  if (error) return <ErrorState title={error} />;

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
        <Pressable onPress={() => router.push("/(tabs)/notifications")}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      <Pressable style={styles.searchBar} onPress={() => router.push("/(tabs)/search")}>
        <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
        <Text style={styles.searchPlaceholder}>Search doctor, specialty or clinic</Text>
      </Pressable>

      <Section title="Popular Specialties">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtyRow}>
          {specialties.map((specialty) => (
            <Pressable
              key={specialty.id}
              style={styles.specialtyCard}
              onPress={() => router.push({ pathname: "/doctor-list", params: { specialtyId: specialty.id, specialtyName: specialty.name } })}
            >
              <View style={styles.specialtyIcon}>
                <Ionicons name={getSpecialtyIcon(specialty.icon)} size={22} color={theme.colors.primary[600]} />
              </View>
              <Text style={styles.specialtyName}>{specialty.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      {upcomingAppointment ? (
        <Section title="Upcoming Appointment">
          <AppointmentCard
            doctorName={upcomingAppointment.doctor.full_name}
            clinicName={upcomingAppointment.clinic.name}
            dateLabel={formatDateLabel(upcomingAppointment.appointment_date)}
            timeLabel={formatTimeLabel(upcomingAppointment.appointment_time)}
            tokenNumber={upcomingAppointment.token_number}
            status={upcomingAppointment.status}
            onPress={() => router.push(`/appointment/${upcomingAppointment.id}`)}
          />
        </Section>
      ) : null}

      <Section title="Top Doctors Near You">
        {topDoctors.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No doctors to show yet</Text>
            <Text style={styles.emptyDescription}>Verified doctors near you will appear here.</Text>
          </View>
        ) : (
          topDoctors.map((item) => (
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
              onBook={() => router.push({ pathname: "/(booking)/select-time", params: { doctorClinicId: item.doctorClinicId } })}
            />
          ))
        )}
      </Section>

      <Section title="Nearby Clinics">
        {nearbyClinics.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No clinics to show yet</Text>
            <Text style={styles.emptyDescription}>Nearby verified clinics will appear here.</Text>
          </View>
        ) : (
          nearbyClinics.map((clinic) => (
            <View key={clinic.id} style={styles.clinicCard}>
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.clinicAddress}>
                {clinic.address}, {clinic.city}
              </Text>
            </View>
          ))
        )}
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
  searchPlaceholder: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.tertiary,
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
  clinicCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 2,
  },
  clinicName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  clinicAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
