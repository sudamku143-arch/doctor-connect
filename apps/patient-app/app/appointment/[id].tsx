import { useCallback, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import {
  Button,
  ConfirmationModal,
  ErrorState,
  LoadingState,
  SecondaryButton,
  StatusBadge,
} from "@doctor-connect/ui-native";
import { cancelAppointment, getAppointmentDetails } from "@/lib/api/appointments";
import { getDoctorClinicId } from "@/lib/api/doctors";
import { getQueueSnapshot, type QueueSnapshot } from "@/lib/api/queue";
import type { AppointmentWithDetails } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel, getDirectionsUrl, getPhoneUrl } from "@/lib/format";

const QUEUE_VISIBLE_STATUSES = ["CHECKED_IN", "WAITING", "IN_CONSULTATION"];
const CANCELLABLE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "RESCHEDULE_REQUESTED"];

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [queueSnapshot, setQueueSnapshot] = useState<QueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "reschedule" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getAppointmentDetails(id)
      .then(async (data) => {
        setAppointment(data);
        if (data && QUEUE_VISIBLE_STATUSES.includes(data.status)) {
          setQueueSnapshot(await getQueueSnapshot(data.id));
        }
      })
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

  const isCancellable = CANCELLABLE_STATUSES.includes(appointment.status);

  async function handleCancel() {
    setActionLoading(true);
    setActionError(null);
    try {
      await cancelAppointment(appointment!.id);
      setConfirmAction(null);
      load();
    } catch {
      setActionError("Could not cancel this appointment. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReschedule() {
    setActionLoading(true);
    setActionError(null);
    try {
      const doctorClinicId = await getDoctorClinicId(appointment!.doctor_id, appointment!.clinic_id);
      await cancelAppointment(appointment!.id);
      setConfirmAction(null);
      if (doctorClinicId) {
        router.replace({ pathname: "/(booking)/select-time", params: { doctorClinicId } });
      } else {
        router.replace("/(tabs)/appointments");
      }
    } catch {
      setActionError("Could not start rescheduling. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.doctorName}>{appointment.doctor.full_name}</Text>
        <StatusBadge status={appointment.status} />
      </View>
      <Text style={styles.clinicName}>{appointment.clinic.name}</Text>

      <View style={styles.card}>
        <Row label="Date" value={formatDateLabel(appointment.appointment_date)} />
        <Row label="Time" value={formatTimeLabel(appointment.appointment_time)} />
        {appointment.token_number != null ? <Row label="Token" value={`#${appointment.token_number}`} /> : null}
        <Row label="Address" value={`${appointment.clinic.address}, ${appointment.clinic.city}`} />
        {appointment.reason_for_visit ? <Row label="Reason" value={appointment.reason_for_visit} /> : null}
      </View>

      {queueSnapshot?.entry && appointment.status === "WAITING" ? (
        <View style={styles.card}>
          <Row label="Patients before you" value={String(queueSnapshot.patientsBeforeCount)} />
          <Text style={styles.estimateNote}>
            This is an estimate only, based on patients waiting ahead of you.
          </Text>
          <SecondaryButton label="View Live Queue" onPress={() => router.push(`/queue/${appointment.id}`)} />
        </View>
      ) : null}

      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      <View style={styles.actions}>
        <SecondaryButton
          label="Get Directions"
          onPress={() => Linking.openURL(getDirectionsUrl(appointment.clinic))}
        />
        {appointment.clinic.phone ? (
          <SecondaryButton
            label="Contact Clinic"
            onPress={() => Linking.openURL(getPhoneUrl(appointment.clinic.phone!))}
          />
        ) : null}
        {isCancellable ? (
          <>
            <SecondaryButton label="Reschedule" onPress={() => setConfirmAction("reschedule")} />
            <Button label="Cancel Appointment" variant="danger" onPress={() => setConfirmAction("cancel")} />
          </>
        ) : null}
      </View>

      <ConfirmationModal
        visible={confirmAction === "cancel"}
        title="Cancel this appointment?"
        description="This will free up the slot for other patients. This can't be undone."
        confirmLabel="Cancel Appointment"
        danger
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        visible={confirmAction === "reschedule"}
        title="Reschedule this appointment?"
        description="Your current slot will be cancelled and you'll pick a new date and time for the same doctor."
        confirmLabel="Reschedule"
        loading={actionLoading}
        onConfirm={handleReschedule}
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
  doctorName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
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
  estimateNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
