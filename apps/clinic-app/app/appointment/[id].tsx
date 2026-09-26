import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import {
  Button,
  ConfirmationModal,
  ErrorState,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from "@doctor-connect/ui-native";
import {
  cancelAppointmentByClinic,
  checkinAppointment,
  completeConsultation,
  getClinicAppointmentDetails,
  markNoShow,
  requestRescheduleByClinic,
} from "@/lib/api/appointments";
import type { ClinicAppointment } from "@/lib/api/types";
import {
  formatDateLabel,
  formatTimeLabel,
  getVideoCallOpensAtLabel,
  isVideoCallJoinable,
  todayDateString,
} from "@/lib/format";

const VIDEO_CALL_STATUSES = ["CONFIRMED", "CHECKED_IN", "WAITING", "IN_CONSULTATION"];

type ConfirmAction = "cancel" | "noshow" | "reschedule" | null;

export default function ClinicAppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<ClinicAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);

  // Re-checks the video-call join window every 30s so the button flips from
  // disabled to active on its own, without needing a manual refresh.
  const [, tick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(() => {
    if (!id) return;
    getClinicAppointmentDetails(id)
      .then(setAppointment)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <LoadingState title="Loading appointment…" />;
  if (error) return <ErrorState title={error} onAction={load} actionLabel="Try again" />;
  if (!appointment) return <ErrorState title="Appointment not found" />;

  const isToday = appointment.appointment_date === todayDateString();
  const canCheckIn = isToday && (appointment.status === "CONFIRMED" || appointment.status === "PENDING_PAYMENT");
  const canComplete = appointment.status === "IN_CONSULTATION";
  const canNoShow = appointment.status === "WAITING" || appointment.status === "CHECKED_IN";
  const isVideoAppointment =
    appointment.consultation_type === "VIDEO" && VIDEO_CALL_STATUSES.includes(appointment.status);
  const videoWindowOpen = isVideoAppointment && isVideoCallJoinable(appointment.appointment_date, appointment.appointment_time);
  const canJoinVideoCall = isVideoAppointment && videoWindowOpen;
  const videoNotYetOpen = isVideoAppointment && !videoWindowOpen;
  const canUploadPrescription = appointment.status === "COMPLETED";
  const nonTerminal = ![
    "COMPLETED",
    "CANCELLED_BY_PATIENT",
    "CANCELLED_BY_CLINIC",
    "NO_SHOW",
    "REFUNDED",
  ].includes(appointment.status);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      setConfirmAction(null);
      load();
    } catch {
      setActionError("Could not complete this action. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.patientName}>{appointment.patientProfile?.full_name ?? "Patient"}</Text>
        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.card}>
        <Row label="Doctor" value={appointment.doctor.full_name} />
        <Row
          label="Treatment Type"
          value={appointment.consultation_type === "VIDEO" ? "Video Consultation" : "Physical Consultation"}
        />
        <Row label="Date" value={formatDateLabel(appointment.appointment_date)} />
        <Row label="Time" value={formatTimeLabel(appointment.appointment_time)} />
        {appointment.token_number != null ? <Row label="Token" value={`#${appointment.token_number}`} /> : null}
        <Row label="Booking source" value={appointment.booking_source === "ONLINE" ? "Online" : "Walk-in"} />
        {appointment.patientProfile?.phone ? <Row label="Patient mobile" value={appointment.patientProfile.phone} /> : null}
        {appointment.reason_for_visit ? <Row label="Reason" value={appointment.reason_for_visit} /> : null}
      </View>

      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      <View style={styles.actions}>
        {canJoinVideoCall ? (
          <PrimaryButton
            label="Join Video Call"
            onPress={() => router.push(`/video-call/${appointment.id}`)}
          />
        ) : videoNotYetOpen ? (
          <>
            <PrimaryButton label="Join Video Call" disabled />
            <Text style={styles.videoHint}>
              Available from {getVideoCallOpensAtLabel(appointment.appointment_date, appointment.appointment_time)}
            </Text>
          </>
        ) : null}
        {canCheckIn ? (
          <Button label="Check In" onPress={() => run(() => checkinAppointment(appointment.id))} loading={busy} />
        ) : null}
        {canUploadPrescription ? (
          <SecondaryButton
            label="Upload Prescription"
            onPress={() => router.push(`/prescription-upload/${appointment.id}`)}
          />
        ) : null}
        {canComplete ? (
          <Button label="Mark Completed" onPress={() => run(() => completeConsultation(appointment.id))} loading={busy} />
        ) : null}
        {canNoShow ? <SecondaryButton label="Mark No Show" onPress={() => setConfirmAction("noshow")} /> : null}
        {nonTerminal ? <SecondaryButton label="Reschedule" onPress={() => setConfirmAction("reschedule")} /> : null}
        {nonTerminal ? (
          <Button label="Cancel Appointment" variant="danger" onPress={() => setConfirmAction("cancel")} />
        ) : null}
      </View>

      <ConfirmationModal
        visible={confirmAction === "cancel"}
        title="Cancel this appointment?"
        description="This will free up the slot. This can't be undone."
        confirmLabel="Cancel Appointment"
        danger
        loading={busy}
        onConfirm={() => run(() => cancelAppointmentByClinic(appointment.id))}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        visible={confirmAction === "noshow"}
        title="Mark as no-show?"
        confirmLabel="Mark No Show"
        danger
        loading={busy}
        onConfirm={() => run(() => markNoShow(appointment.id))}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        visible={confirmAction === "reschedule"}
        title="Request a reschedule?"
        description="The patient will see this appointment needs rescheduling and can pick a new time."
        confirmLabel="Request Reschedule"
        loading={busy}
        onConfirm={() => run(() => requestRescheduleByClinic(appointment.id))}
        onCancel={() => setConfirmAction(null)}
      />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  patientName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xs,
    ...theme.cardShadow,
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
  actions: {
    gap: theme.spacing.sm,
  },
  videoHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    marginTop: -theme.spacing.xs,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
