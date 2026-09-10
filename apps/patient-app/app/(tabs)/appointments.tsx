import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { AppointmentCard, AppointmentCardSkeleton, EmptyState, ErrorState, ListSkeleton } from "@doctor-connect/ui-native";
import { listMyAppointments, type AppointmentBucket } from "@/lib/api/appointments";
import type { AppointmentWithDetails } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

const TABS: { value: AppointmentBucket; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AppointmentBucket>("upcoming");
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((bucket: AppointmentBucket) => {
    setLoading(true);
    setError(null);
    listMyAppointments(bucket)
      .then(setAppointments)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  // Covers initial mount, tab switches, and refocusing after a
  // booking/cancellation elsewhere in the app — useFocusEffect's callback
  // identity changes with `tab`, so it re-runs on tab switch too.
  useFocusEffect(
    useCallback(() => {
      load(tab);
    }, [tab, load]),
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <Text style={styles.title}>My Appointments</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {TABS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setTab(option.value)}
            style={[styles.tabButton, tab === option.value && styles.tabButtonActive]}
          >
            <Text style={[styles.tabLabel, tab === option.value && styles.tabLabelActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ListSkeleton item={AppointmentCardSkeleton} count={4} />
      ) : error ? (
        <ErrorState title={error} onAction={() => load(tab)} actionLabel="Try again" />
      ) : appointments.length === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? "No appointments yet" : `No ${tab} appointments`}
          description={tab === "upcoming" ? "Book your first appointment to see it here." : undefined}
        />
      ) : (
        appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            doctorName={appointment.doctor.full_name}
            clinicName={appointment.clinic.name}
            dateLabel={formatDateLabel(appointment.appointment_date)}
            timeLabel={formatTimeLabel(appointment.appointment_time)}
            tokenNumber={appointment.token_number}
            status={appointment.status}
            onPress={() => router.push(`/appointment/${appointment.id}`)}
          />
        ))
      )}
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
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  tabRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  tabButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  tabLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  tabLabelActive: {
    color: theme.colors.text.inverse,
  },
});
