import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState, PrimaryButton, VerifiedBadge } from "@doctor-connect/ui-native";
import type { AppointmentSlot } from "@doctor-connect/types";
import { getDoctorProfile } from "@/lib/api/doctors";
import { listSlotsForDate } from "@/lib/api/slots";
import { listDoctorReviews, type DoctorReview } from "@/lib/api/reviews";
import type { DoctorListItem } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel, getDirectionsUrl, getPhoneUrl, todayDateString } from "@/lib/format";

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<DoctorListItem | null>(null);
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [previewSlots, setPreviewSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getDoctorProfile(id)
      .then(async (item) => {
        if (cancelled || !item) return;
        setProfile(item);
        const [reviewRows, slotRows] = await Promise.all([
          listDoctorReviews(item.doctor.id),
          listSlotsForDate(item.doctorClinicId, todayDateString()),
        ]);
        if (cancelled) return;
        setReviews(reviewRows);
        setPreviewSlots(slotRows.filter((slot) => slot.status === "OPEN").slice(0, 6));
      })
      .catch(() => !cancelled && setError("Something went wrong. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <LoadingState title="Loading doctor profile…" />;
  if (error) return <ErrorState title={error} />;
  if (!profile) return <EmptyState title="Doctor not found" />;

  const { doctor, clinic, specialties, consultationFee, averageRating, reviewCount } = profile;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.photoFallback}>
          <Text style={styles.photoInitial}>{doctor.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{doctor.full_name}</Text>
            {doctor.verification_status === "VERIFIED" ? <VerifiedBadge /> : null}
          </View>
          <Text style={styles.qualification}>{doctor.qualification}</Text>
          <Text style={styles.specialty}>{specialties.map((s) => s.name).join(", ")}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={theme.iconSizes.sm} color={theme.colors.warning[500]} />
            <Text style={styles.ratingText}>
              {averageRating != null ? averageRating.toFixed(1) : "New"}
              {reviewCount > 0 ? ` (${reviewCount} reviews)` : ""}
            </Text>
            <Text style={styles.experienceText}>· {doctor.experience_years}+ yrs experience</Text>
          </View>
        </View>
      </View>

      {doctor.bio ? (
        <Section title="About">
          <Text style={styles.bodyText}>{doctor.bio}</Text>
        </Section>
      ) : null}

      {doctor.languages.length > 0 ? (
        <Section title="Languages">
          <Text style={styles.bodyText}>{doctor.languages.join(", ")}</Text>
        </Section>
      ) : null}

      <Section title="Clinic">
        <Text style={styles.clinicName}>{clinic.name}</Text>
        <Text style={styles.bodyText}>
          {clinic.address}, {clinic.city}
        </Text>
        <View style={styles.clinicActions}>
          <PressableLink label="Get Directions" icon="navigate-outline" onPress={() => Linking.openURL(getDirectionsUrl(clinic))} />
          {clinic.phone ? (
            <PressableLink label="Contact Clinic" icon="call-outline" onPress={() => Linking.openURL(getPhoneUrl(clinic.phone!))} />
          ) : null}
        </View>
        <Text style={styles.fee}>Consultation fee: ₹{consultationFee}</Text>
      </Section>

      <Section title="Available Appointments">
        {previewSlots.length === 0 ? (
          <Text style={styles.bodyText}>No slots open today. Tap &ldquo;Book Appointment&rdquo; to see other dates.</Text>
        ) : (
          <>
            <Text style={styles.previewDateLabel}>{formatDateLabel(todayDateString())}</Text>
            <View style={styles.slotRow}>
              {previewSlots.map((slot) => (
                <Text key={slot.id} style={styles.slotChip}>
                  {formatTimeLabel(slot.start_time)}
                </Text>
              ))}
            </View>
          </>
        )}
      </Section>

      {reviews.length > 0 ? (
        <Section title="Reviews">
          {reviews.slice(0, 5).map((review) => (
            <View key={review.id} style={styles.reviewRow}>
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Ionicons
                    key={i}
                    name={i < review.rating ? "star" : "star-outline"}
                    size={theme.iconSizes.sm}
                    color={theme.colors.warning[500]}
                  />
                ))}
              </View>
              {review.comment ? <Text style={styles.bodyText}>{review.comment}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      <PrimaryButton
        label="Book Appointment"
        onPress={() => router.push({ pathname: "/(booking)/select-time", params: { doctorClinicId: profile.doctorClinicId } })}
        style={styles.bookButton}
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PressableLink({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Text style={styles.linkRow} onPress={onPress}>
      <Ionicons name={icon} size={theme.iconSizes.sm} color={theme.colors.primary[600]} /> {label}
    </Text>
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
    paddingBottom: theme.spacing.xxxl,
  },
  headerRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  photoFallback: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitial: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  qualification: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  specialty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  experienceText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  bodyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.fontSize.sm * theme.lineHeight.relaxed,
  },
  clinicName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  clinicActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxs,
  },
  linkRow: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.medium as any,
  },
  fee: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xxs,
  },
  previewDateLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.secondary,
  },
  slotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  slotChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    overflow: "hidden",
  },
  reviewRow: {
    gap: theme.spacing.xxs,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  bookButton: {
    marginTop: theme.spacing.sm,
  },
});
