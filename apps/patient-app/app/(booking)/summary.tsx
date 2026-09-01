import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, PrimaryButton } from "@doctor-connect/ui-native";
import { useBookingDraft } from "@/features/booking/BookingDraftContext";
import { bookAppointment } from "@/lib/api/appointments";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

export default function SummaryScreen() {
  const { draft } = useBookingDraft();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!draft.doctor || !draft.clinic || !draft.slot || !draft.patientDetails) {
    return <ErrorState title="Something went wrong. Please start the booking again." />;
  }

  const { doctor, clinic, slot, patientDetails, consultationFee, familyMemberId, familyMemberName } = draft;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await bookAppointment({
        slotId: slot!.id,
        reason: patientDetails!.reasonForVisit,
        familyMemberId: familyMemberId ?? null,
      });
      router.replace({ pathname: "/(booking)/confirmed", params: { appointmentId: appointment.id } });
    } catch {
      setError("This slot may no longer be available. Please go back and pick another time.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Row label="Doctor" value={doctor.full_name} />
        <Row label="Clinic" value={clinic.name} />
        <Row label="Date" value={formatDateLabel(slot.date)} />
        <Row label="Time" value={formatTimeLabel(slot.start_time)} />
        <Row label="Patient" value={familyMemberName ?? patientDetails.name} />
        <Row label="Reason" value={patientDetails.reasonForVisit} />
      </View>

      <View style={styles.card}>
        <Row label="Consultation fee" value={`₹${consultationFee}`} />
        <Row label="Total" value={`₹${consultationFee}`} emphasis />
        <Text style={styles.paymentNote}>
          Online payment is not required yet — your appointment is confirmed immediately.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Confirm Appointment" onPress={handleConfirm} loading={submitting} />
    </ScrollView>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, emphasis && styles.rowValueEmphasis]}>{value}</Text>
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
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  rowLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  rowValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
    flexShrink: 1,
    textAlign: "right",
  },
  rowValueEmphasis: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
  },
  paymentNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xxs,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
