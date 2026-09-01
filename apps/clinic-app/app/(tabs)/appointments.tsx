import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { AppointmentCard, EmptyState, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { useClinic } from "@/features/clinic/ClinicContext";
import { listClinicAppointments, type AppointmentBucket } from "@/lib/api/appointments";
import { listClinicDoctors } from "@/lib/api/doctors";
import type { ClinicAppointment, ClinicDoctor } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

const TABS: { value: AppointmentBucket; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ClinicAppointmentsScreen() {
  const { staff } = useClinic();
  const [tab, setTab] = useState<AppointmentBucket>("today");
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staff) return;
    listClinicDoctors(staff.clinic_id).then(setDoctors).catch(() => undefined);
  }, [staff]);

  const load = useCallback(() => {
    if (!staff) return;
    setLoading(true);
    listClinicAppointments(staff.clinic_id, tab, { doctorId: doctorFilter ?? undefined })
      .then(setAppointments)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [staff, tab, doctorFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!staff) return <LoadingState title="Loading…" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Appointments</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {TABS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setTab(option.value)}
            style={[styles.chip, tab === option.value && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, tab === option.value && styles.chipLabelActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {doctors.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          <Pressable onPress={() => setDoctorFilter(null)} style={[styles.chip, !doctorFilter && styles.chipActive]}>
            <Text style={[styles.chipLabel, !doctorFilter && styles.chipLabelActive]}>All Doctors</Text>
          </Pressable>
          {doctors.map((d) => (
            <Pressable
              key={d.doctorClinicId}
              onPress={() => setDoctorFilter(d.doctor.id)}
              style={[styles.chip, doctorFilter === d.doctor.id && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, doctorFilter === d.doctor.id && styles.chipLabelActive]}>
                {d.doctor.full_name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <LoadingState title="Loading appointments…" />
      ) : error ? (
        <ErrorState title={error} onAction={load} actionLabel="Try again" />
      ) : appointments.length === 0 ? (
        <EmptyState title={`No ${tab} appointments`} />
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
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  chipActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  chipLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  chipLabelActive: {
    color: theme.colors.text.inverse,
  },
});
