import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { getAppointmentDetails } from "@/lib/api/appointments";
import { getAverageSlotDurationMinutes, getQueueSnapshot, subscribeToQueueEntry, type QueueSnapshot } from "@/lib/api/queue";
import { getDoctorClinicId } from "@/lib/api/doctors";
import type { AppointmentWithDetails } from "@/lib/api/types";

export default function LiveQueueScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [slotDuration, setSlotDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const [details, queueSnapshot] = await Promise.all([
        getAppointmentDetails(appointmentId),
        getQueueSnapshot(appointmentId),
      ]);
      setAppointment(details);
      setSnapshot(queueSnapshot);
      if (details) {
        const doctorClinicId = await getDoctorClinicId(details.doctor_id, details.clinic_id);
        if (doctorClinicId) setSlotDuration(await getAverageSlotDurationMinutes(doctorClinicId));
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!appointmentId) return;
    return subscribeToQueueEntry(appointmentId, load);
  }, [appointmentId, load]);

  if (loading) return <LoadingState title="Loading queue status…" />;
  if (error) return <ErrorState title={error} onAction={load} actionLabel="Try again" />;
  if (!appointment) return <ErrorState title="Appointment not found" />;

  if (!snapshot?.entry) {
    return (
      <EmptyState
        title="You haven't checked in yet"
        description="Your queue position will show here once the clinic checks you in for your appointment."
      />
    );
  }

  const estimatedWaitMinutes = snapshot.patientsBeforeCount * slotDuration;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.label}>Your Token</Text>
        <Text style={styles.tokenValue}>#{snapshot.entry.token_number}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.label}>Currently Consulting</Text>
          <Text style={styles.metaValue}>
            {snapshot.currentlyConsultingToken != null ? `#${snapshot.currentlyConsultingToken}` : "—"}
          </Text>
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.label}>Patients Before You</Text>
          <Text style={styles.metaValue}>{snapshot.patientsBeforeCount}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estimated Waiting</Text>
        <Text style={styles.metaValue}>{estimatedWaitMinutes} min</Text>
        <Text style={styles.estimateNote}>This is an estimate only and may change.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  metaRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  metaCard: {
    flex: 1,
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  tokenValue: {
    fontSize: theme.fontSize.display,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },
  metaValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  estimateNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
