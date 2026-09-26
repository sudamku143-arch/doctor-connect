import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { Button, EmptyState, ErrorState, LoadingState, SecondaryButton, StatusBadge } from "@doctor-connect/ui-native";
import {
  cancelAppointmentByClinic,
  getClinicAppointmentDetails,
  notifyPatientDoctorUnavailable,
  requestRescheduleByClinic,
} from "@/lib/api/appointments";
import type { ClinicAppointment } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

export default function AffectedAppointmentsScreen() {
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);

  useEffect(() => {
    const appointmentIds: string[] = ids ? JSON.parse(ids) : [];
    Promise.all(appointmentIds.map((id) => getClinicAppointmentDetails(id)))
      .then((results) => setAppointments(results.filter((a): a is ClinicAppointment => a != null)))
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [ids]);

  async function handleNotify(appointmentId: string) {
    setBusyId(appointmentId);
    try {
      await notifyPatientDoctorUnavailable(appointmentId);
      setNotifiedIds((prev) => [...prev, appointmentId]);
    } catch {
      setError("Could not notify the patient. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReschedule(appointmentId: string) {
    setBusyId(appointmentId);
    try {
      const updated = await requestRescheduleByClinic(appointmentId);
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: updated.status } : a)));
    } catch {
      setError("Could not request a reschedule. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(appointmentId: string) {
    setBusyId(appointmentId);
    try {
      const updated = await cancelAppointmentByClinic(appointmentId);
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: updated.status } : a)));
    } catch {
      setError("Could not cancel this appointment. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState title="Loading affected appointments…" />;
  if (error) return <ErrorState title={error} />;
  if (appointments.length === 0) return <EmptyState title="No appointments are affected" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{appointments.length} appointments are affected.</Text>
      <Text style={styles.subheading}>
        These were already booked before the doctor was marked unavailable. Nothing has been changed automatically —
        choose an action for each one.
      </Text>

      {appointments.map((appointment) => (
        <View key={appointment.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.patientName}>{appointment.patientProfile?.full_name ?? "Patient"}</Text>
            <StatusBadge status={appointment.status} />
          </View>
          <Text style={styles.meta}>
            {formatDateLabel(appointment.appointment_date)}, {formatTimeLabel(appointment.appointment_time)}
          </Text>

          <View style={styles.actions}>
            <SecondaryButton
              label={notifiedIds.includes(appointment.id) ? "Notified" : "Notify"}
              onPress={() => handleNotify(appointment.id)}
              disabled={busyId === appointment.id || notifiedIds.includes(appointment.id)}
              fullWidth={false}
            />
            <SecondaryButton
              label="Reschedule"
              onPress={() => handleReschedule(appointment.id)}
              disabled={busyId === appointment.id}
              fullWidth={false}
            />
            <Button
              label="Cancel"
              variant="danger"
              onPress={() => handleCancel(appointment.id)}
              disabled={busyId === appointment.id}
              fullWidth={false}
            />
          </View>
        </View>
      ))}
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
    gap: theme.spacing.md,
  },
  heading: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  subheading: {
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
    ...theme.cardShadow,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  patientName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  meta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxs,
  },
});
