import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { AppointmentCard, ClinicCard, DoctorCard, DoctorCardSkeleton, ErrorState, SkeletonBlock } from "@doctor-connect/ui-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLocation } from "@/features/location/LocationContext";
import { listSpecialties, type SpecialtyWithCount } from "@/lib/api/specialties";
import { listTopDoctors } from "@/lib/api/doctors";
import { listNearbyClinicsWithSpecialties, type ClinicWithSpecialties } from "@/lib/api/clinics";
import { getNextUpcomingAppointment } from "@/lib/api/appointments";
import { hasUnreadNotifications } from "@/lib/api/notifications";
import { getMyProfile } from "@/lib/api/profile";
import type { AppointmentWithDetails, DoctorListItem } from "@/lib/api/types";
import { getSpecialtyIcon } from "@/lib/specialtyIcons";
import { formatDateLabel, formatTimeLabel, getOpenStatusLabel } from "@/lib/format";

export default function HomeScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { city, cities, setCity } = useLocation();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const firstName =
    fullName?.split(" ")[0] ?? (session?.user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  const [specialties, setSpecialties] = useState<SpecialtyWithCount[]>([]);
  const [topDoctors, setTopDoctors] = useState<DoctorListItem[]>([]);
  const [nearbyClinics, setNearbyClinics] = useState<ClinicWithSpecialties[]>([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<AppointmentWithDetails | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        listSpecialties(),
        listTopDoctors(5, city),
        listNearbyClinicsWithSpecialties(5, city),
        getNextUpcomingAppointment(),
        hasUnreadNotifications(),
        getMyProfile().catch(() => null),
      ])
        .then(([specialtyRows, doctorRows, clinicRows, appointment, unread, profile]) => {
          setSpecialties(specialtyRows);
          setTopDoctors(doctorRows);
          setNearbyClinics(clinicRows);
          setUpcomingAppointment(appointment);
          setHasUnread(unread);
          setFullName(profile?.full_name ?? null);
        })
        .catch(() => setError("Something went wrong. Please try again."))
        .finally(() => setLoading(false));
    }, [city]),
  );

  if (loading) {
    return (
      <View style={[styles.body, { flex: 1, paddingTop: insets.top + theme.spacing.lg }]}>
        <View style={styles.headerRow}>
          <View style={{ gap: theme.spacing.xxs }}>
            <SkeletonBlock width={100} height={12} />
            <SkeletonBlock width={140} height={22} />
          </View>
          <SkeletonBlock width={24} height={24} radius={theme.radii.pill} />
        </View>
        <SkeletonBlock height={52} radius={theme.radii.md} />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {Array.from({ length: 4 }, (_, i) => (
            <View key={i} style={{ alignItems: "center", gap: theme.spacing.xxs }}>
              <SkeletonBlock width={56} height={56} radius={theme.radii.lg} />
              <SkeletonBlock width={60} height={10} />
            </View>
          ))}
        </View>
        <DoctorCardSkeleton />
        <DoctorCardSkeleton />
      </View>
    );
  }
  if (error) return <ErrorState title={error} />;

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={[theme.colors.primary[300], theme.colors.primary[500]]}
        style={[styles.headerGradient, { paddingTop: insets.top + theme.spacing.md }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.locationRow}
            onPress={() => cities.length > 1 && setShowCityPicker(true)}
            hitSlop={8}
          >
            <Ionicons name="location" size={14} color="#FFFFFF" />
            <Text style={styles.location}>{city ?? "Select city"}</Text>
            {cities.length > 1 ? <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.85)" /> : null}
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push("/(tabs)/notifications")} hitSlop={6}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {hasUnread ? <View style={styles.unreadDot} /> : null}
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => router.push("/help-support")} hitSlop={6}>
              <Ionicons name="headset-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.greeting}>Hi{firstName ? `, ${firstName}` : ""} 👋</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle} numberOfLines={1}>
            Find your trusted doctor anytime{city ? `, ${city}` : ""}
          </Text>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Pressable style={styles.searchBar} onPress={() => router.push("/(tabs)/search")}>
          <Ionicons name="search" size={18} color={theme.colors.primary[400]} />
          <Text style={styles.searchPlaceholder}>Search doctor, specialty or clinic</Text>
        </Pressable>

        <Section title="Popular Specialties" onViewAll={() => router.push("/specialties")}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtyRow}>
            {specialties.map((specialty) => (
              <Pressable
                key={specialty.id}
                style={styles.specialtyCard}
                onPress={() => router.push({ pathname: "/doctor-list", params: { specialtyId: specialty.id, specialtyName: specialty.name } })}
              >
                <View style={styles.specialtyIcon}>
                  <MaterialCommunityIcons name={getSpecialtyIcon(specialty.icon)} size={24} color={theme.colors.primary[600]} />
                </View>
                <Text style={styles.specialtyName} numberOfLines={2}>
                  {specialty.name}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.specialtyCard} onPress={() => router.push("/specialties")}>
              <View style={styles.specialtyIcon}>
                <Ionicons name="arrow-forward" size={22} color={theme.colors.primary[600]} />
              </View>
              <Text style={styles.specialtyName} numberOfLines={2}>
                See All
              </Text>
            </Pressable>
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

        <Section title="Top Doctors Near You" onViewAll={() => router.push("/(tabs)/search")}>
          {topDoctors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No doctors to show yet</Text>
              <Text style={styles.emptyDescription}>Verified doctors near you will appear here.</Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {topDoctors.map((item) => (
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
              ))}
            </View>
          )}
        </Section>

        <Section title="Nearby Clinics" onViewAll={() => router.push("/clinics")}>
          {nearbyClinics.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No clinics to show yet</Text>
              <Text style={styles.emptyDescription}>Nearby verified clinics will appear here.</Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {nearbyClinics.map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  name={clinic.name}
                  address={`${clinic.address}, ${clinic.city}`}
                  statusLabel={getOpenStatusLabel(clinic.timings)}
                  specialtyNames={clinic.specialtyNames}
                  photoUrl={clinic.photos?.[0] ?? null}
                  onPress={() => router.push(`/clinic/${clinic.id}`)}
                />
              ))}
            </View>
          )}
        </Section>
      </View>
    </ScrollView>
    <Modal visible={showCityPicker} transparent animationType="fade" onRequestClose={() => setShowCityPicker(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setShowCityPicker(false)}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Choose your city</Text>
          {cities.map((option) => (
            <Pressable
              key={option}
              style={styles.cityOption}
              onPress={() => {
                setCity(option);
                setShowCityPicker(false);
              }}
            >
              <Text style={styles.cityOptionLabel}>{option}</Text>
              {option === city ? (
                <Ionicons name="checkmark" size={theme.iconSizes.md} color={theme.colors.primary[500]} />
              ) : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

function Section({ title, children, onViewAll }: { title: string; children: ReactNode; onViewAll?: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} style={styles.viewAllRow} hitSlop={6}>
            <Text style={styles.viewAllLabel}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.primary[600]} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  headerGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: theme.spacing.xxs,
  },
  body: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error[500],
    borderWidth: 1.5,
    borderColor: theme.colors.primary[500],
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(21, 21, 31, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface.default,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.xxs,
  },
  modalTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  cityOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  cityOptionLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  location: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: "#FFFFFF",
    flexShrink: 1,
  },
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
    marginTop: theme.spacing.sm,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: "rgba(255,255,255,0.85)",
    flexShrink: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    height: 52,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
    marginTop: -32,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.tertiary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.primary[600],
  },
  specialtyRow: {
    gap: theme.spacing.sm,
  },
  specialtyCard: {
    width: 92,
    alignItems: "center",
    gap: theme.spacing.xxs,
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  specialtyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  specialtyName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 14,
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
