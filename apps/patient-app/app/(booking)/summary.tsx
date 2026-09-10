import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, PrimaryButton } from "@doctor-connect/ui-native";
import { useBookingDraft } from "@/features/booking/BookingDraftContext";
import { bookAppointment } from "@/lib/api/appointments";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

const CONVENIENCE_FEE = 10;

function formatAbsoluteDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const { draft } = useBookingDraft();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!draft.doctor || !draft.clinic || !draft.slot || !draft.patientDetails) {
    return <ErrorState title="Something went wrong. Please start the booking again." />;
  }

  const { doctor, clinic, slot, patientDetails, consultationFee, consultationType, familyMemberId, familyMemberName } = draft;
  const fee = consultationFee ?? 0;
  const isVideo = consultationType === "VIDEO";
  const treatmentTypeLabel = isVideo ? "Video Consultation" : "Physical Consultation";
  const totalPayNow = CONVENIENCE_FEE + (isVideo ? fee : 0);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await bookAppointment({
        slotId: slot!.id,
        reason: patientDetails!.reasonForVisit || "",
        familyMemberId: familyMemberId ?? null,
        consultationType: consultationType ?? "PHYSICAL",
      });
      router.replace({ pathname: "/(booking)/confirmed", params: { appointmentId: appointment.id } });
    } catch {
      setError("This slot may no longer be available. Please go back and pick another time.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.sm }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </Pressable>

        <View style={styles.brandBlock}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="pulse" size={16} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.brandName}>
              Doctor<Text style={styles.brandNameAccent}>Connect</Text>
            </Text>
          </View>
          <Text style={styles.tagline}>Your Health, Our Priority</Text>
        </View>

        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={16} color={theme.colors.success[500]} />
          <Text style={styles.trustBadgeText}>Safe & Secure{"\n"}Booking</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleIconCircle}>
          <Ionicons name="calendar" size={20} color={theme.colors.primary[600]} />
        </View>
        <View style={styles.titleTextBlock}>
          <Text style={styles.title}>Appointment Summary</Text>
          <Text style={styles.subtitle}>Please review your appointment details below</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.doctorRow}>
          {doctor.photo_url ? (
            <Image source={{ uri: doctor.photo_url }} style={styles.doctorPhoto} />
          ) : (
            <View style={[styles.doctorPhoto, styles.doctorPhotoFallback]}>
              <Text style={styles.doctorPhotoInitial}>{doctor.full_name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.doctorInfo}>
            {doctor.verification_status === "VERIFIED" ? (
              <View style={styles.specialistBadge}>
                <Ionicons name="checkmark" size={11} color={theme.colors.success[700]} />
                <Text style={styles.specialistBadgeText}>Specialist</Text>
              </View>
            ) : null}
            <Text style={styles.doctorName} numberOfLines={1}>
              {doctor.full_name}
            </Text>
            <Text style={styles.doctorRole} numberOfLines={1}>
              {doctor.qualification}
            </Text>
            <View style={styles.clinicRow}>
              <Ionicons name="business-outline" size={13} color={theme.colors.text.tertiary} style={styles.clinicIcon} />
              <Text style={styles.clinicName}>{clinic.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <DetailItem icon="medkit-outline" label="Treatment Type" value={treatmentTypeLabel} />
          <DetailItem icon="calendar-outline" label="Date" value={formatDateLabel(slot.date)} sub={formatAbsoluteDate(slot.date)} />
          <DetailItem icon="time-outline" label="Time" value={formatTimeLabel(slot.start_time)} />
          <DetailItem icon="person-outline" label="Patient" value={familyMemberName ?? patientDetails.name} />
          {patientDetails.reasonForVisit ? (
            <DetailItem icon="document-text-outline" label="Reason" value={patientDetails.reasonForVisit} />
          ) : null}
        </View>
      </View>

      <View style={styles.feeCard}>
        <PayNowFeeRow label="Convenience Fee" value={CONVENIENCE_FEE} />

        <View style={styles.feeDivider} />

        {isVideo ? (
          <>
            <PayNowFeeRow label="Consultation Fee" value={fee} />

            <View style={styles.feeDivider} />

            <View style={styles.summaryLines}>
              <View style={styles.summaryLineRow}>
                <Text style={styles.summaryLinePayNow}>💳 You Pay Now (Total)</Text>
                <Text style={styles.summaryLinePayNowValue}>₹{totalPayNow}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.feeRow}>
              <View style={styles.feeRowLeft}>
                <View style={styles.feeIconCircle}>
                  <Ionicons name="card-outline" size={16} color={theme.colors.text.tertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mutedFeeLabel}>Consultation Fee</Text>
                  <View style={styles.payAtClinicBadge}>
                    <Text style={styles.payAtClinicBadgeText}>Pay at Clinic</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.mutedFeeValue}>₹{fee}</Text>
            </View>

            <View style={styles.feeDivider} />

            <View style={styles.summaryLines}>
              <View style={styles.summaryLineRow}>
                <Text style={styles.summaryLinePayNow}>💳 You Pay Now</Text>
                <Text style={styles.summaryLinePayNowValue}>₹{CONVENIENCE_FEE}</Text>
              </View>
              <View style={styles.summaryLineRow}>
                <Text style={styles.summaryLineClinic}>🏥 Pay at Clinic</Text>
                <Text style={styles.summaryLineClinicValue}>₹{fee}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.noticeBox}>
        <View style={styles.noticeIconCircle}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success[500]} />
        </View>
        <View style={styles.noticeTextBlock}>
          {isVideo ? (
            <>
              <Text style={styles.noticeTitle}>You&apos;ll pay ₹{totalPayNow} online now</Text>
              <Text style={styles.noticeBody}>
                Convenience fee + consultation fee, both included — nothing more to pay for this visit.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.noticeTitle}>You&apos;ll pay ₹{CONVENIENCE_FEE} convenience fee now</Text>
              <Text style={styles.noticeBody}>The ₹{fee} consultation fee is paid directly at the clinic.</Text>
            </>
          )}
        </View>
        <Ionicons name="cash-outline" size={22} color={theme.colors.success[500]} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        label="Confirm Appointment"
        onPress={handleConfirm}
        loading={submitting}
        style={styles.confirmButton}
      />

      <View style={styles.footer}>
        <Ionicons name="pulse" size={13} color={theme.colors.text.tertiary} />
        <Text style={styles.footerText}>Better Care • Healthier Tomorrow</Text>
      </View>
    </ScrollView>
  );
}

function PayNowFeeRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.payNowRow}>
      <View style={styles.feeRowLeft}>
        <View style={styles.payNowIconCircle}>
          <Text style={styles.payNowIconRupee}>₹</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.payNowLabel}>{label}</Text>
          <View style={styles.payNowBadge}>
            <Ionicons name="flash" size={10} color={theme.colors.text.inverse} />
            <Text style={styles.payNowBadgeText}>Pay Now Online</Text>
          </View>
        </View>
      </View>
      <Text style={styles.payNowValue}>₹{value}</Text>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconCircle}>
        <Ionicons name={icon} size={15} color={theme.colors.primary[600]} />
      </View>
      <View style={styles.detailTextBlock}>
        <Text style={styles.detailLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.detailValue}>{value}</Text>
        {sub ? (
          <Text style={styles.detailSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
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
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  brandBlock: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  brandIcon: {
    width: 22,
    height: 22,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  brandNameAccent: {
    color: theme.colors.primary[600],
  },
  tagline: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 1,
    textAlign: "center",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    maxWidth: 84,
  },
  trustBadgeText: {
    fontSize: 9,
    lineHeight: 12,
    color: theme.colors.text.tertiary,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  titleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  titleTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.md,
  },
  doctorRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  doctorPhoto: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.lg,
  },
  doctorPhotoFallback: {
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  doctorPhotoInitial: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },
  doctorInfo: {
    flex: 1,
    gap: 2,
  },
  specialistBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.success[50],
    marginBottom: 2,
  },
  specialistBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.success[700],
  },
  doctorName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  doctorRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  clinicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginTop: 2,
  },
  clinicIcon: {
    flexShrink: 0,
    marginTop: 1,
  },
  clinicName: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  detailItem: {
    width: "47%",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  detailIconCircle: {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextBlock: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  detailSub: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  feeCard: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    gap: theme.spacing.sm,
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  feeRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  feeIconCircle: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
    alignItems: "center",
    justifyContent: "center",
  },
  feeDivider: {
    height: 1,
    backgroundColor: "rgba(124,77,255,0.15)",
  },
  // "Pay now" row — this is the only real payment happening today, so it
  // gets the strongest visual weight in the card.
  payNowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1.5,
    borderColor: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
  },
  payNowIconCircle: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
    alignItems: "center",
    justifyContent: "center",
  },
  payNowIconRupee: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.success[700],
  },
  payNowLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  payNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.success[500],
  },
  payNowBadgeText: {
    fontSize: 9,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.inverse,
  },
  payNowValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.success[700],
  },
  // Consultation fee row — deliberately muted/neutral so it reads as
  // "not happening now", avoiding the earlier confusion where the total
  // looked like one big online charge.
  mutedFeeLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular as any,
    color: theme.colors.text.tertiary,
  },
  payAtClinicBadge: {
    alignSelf: "flex-start",
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.border.subtle,
  },
  payAtClinicBadgeText: {
    fontSize: 9,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.tertiary,
  },
  mutedFeeValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.regular as any,
    color: theme.colors.text.tertiary,
  },
  summaryLines: {
    gap: 4,
  },
  summaryLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLinePayNow: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.success[700],
  },
  summaryLinePayNowValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.success[700],
  },
  summaryLineClinic: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  summaryLineClinicValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.success[50],
  },
  noticeIconCircle: {
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTextBlock: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.success[700],
  },
  noticeBody: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  confirmButton: {
    marginTop: theme.spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: theme.spacing.sm,
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
