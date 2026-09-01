import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { AppointmentCard, EmptyState, ErrorState, LoadingState, StatsCard } from "@doctor-connect/ui-native";
import { useClinic } from "@/features/clinic/ClinicContext";
import { listClinicAppointments } from "@/lib/api/appointments";
import type { ClinicAppointment } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

const CHECKED_IN_STATUSES = ["CHECKED_IN", "WAITING", "IN_CONSULTATION", "COMPLETED"];

const QUICK_ACTIONS: { label: string; route: "/(tabs)/queue" | "/(tabs)/appointments" | "/(tabs)/schedule" | "/patients" }[] = [
  { label: "Today's Queue", route: "/(tabs)/queue" },
  { label: "Appointments", route: "/(tabs)/appointments" },
  { label: "Doctor Schedule", route: "/(tabs)/schedule" },
  { label: "Patients", route: "/patients" },
];

export default function ClinicDashboardScreen() {
  const { staff, isLoading: clinicLoading, error: clinicError } = useClinic();
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!staff) return;
      listClinicAppointments(staff.clinic_id, "today")
        .then(setAppointments)
        .catch(() => setError("Something went wrong. Please try again."))
        .finally(() => setLoading(false));
    }, [staff]),
  );

  if (clinicLoading) return <LoadingState title="Loading…" />;
  if (clinicError || !staff) return <ErrorState title={clinicError ?? "Something went wrong."} />;

  const checkedInCount = appointments.filter((a) => CHECKED_IN_STATUSES.includes(a.status)).length;
  const waitingCount = appointments.filter((a) => a.status === "WAITING").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.greeting}>Good Morning, Receptionist</Text>
        <Text style={styles.clinicName}>{staff.clinic.name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatsCard label="Today's Appointments" value={appointments.length} />
        <StatsCard label="Checked In" value={checkedInCount} />
        <StatsCard label="Waiting" value={waitingCount} />
        <StatsCard label="Completed" value={completedCount} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Text key={action.label} style={styles.actionCard} onPress={() => router.push(action.route)}>
              {action.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s appointments</Text>
        {loading ? (
          <LoadingState title="Loading appointments…" />
        ) : error ? (
          <ErrorState title={error} />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments today" />
        ) : (
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              doctorName={appointment.doctor.full_name}
              clinicName={staff.clinic.name}
              dateLabel={formatDateLabel(appointment.appointment_date)}
              timeLabel={formatTimeLabel(appointment.appointment_time)}
              tokenNumber={appointment.token_number}
              status={appointment.status}
              onPress={() => router.push(`/appointment/${appointment.id}`)}
            />
          ))
        )}
      </View>
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
    gap: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  actionCard: {
    flexGrow: 1,
    minWidth: "45%",
    paddingVertical: theme.spacing.md,
    textAlign: "center",
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary[50],
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
    overflow: "hidden",
  },
});
