import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import {
  Button,
  ConfirmationModal,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  QueueCard,
} from "@doctor-connect/ui-native";
import { useClinic } from "@/features/clinic/ClinicContext";
import { listClinicDoctors } from "@/lib/api/doctors";
import type { ClinicAppointment, ClinicDoctor } from "@/lib/api/types";
import { callNextPatient, getTodayQueue, subscribeToClinicQueue, type QueueEntryWithPatient } from "@/lib/api/queue";
import { checkinAppointment, completeConsultation, listClinicAppointments, markNoShow } from "@/lib/api/appointments";
import { todayDateString } from "@/lib/format";

export default function TodaysQueueScreen() {
  const { staff } = useClinic();
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [selectedDoctorClinicId, setSelectedDoctorClinicId] = useState<string | null>(null);
  const [awaitingCheckIn, setAwaitingCheckIn] = useState<ClinicAppointment[]>([]);
  const [queue, setQueue] = useState<QueueEntryWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmNoShowId, setConfirmNoShowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!staff) return;
    listClinicDoctors(staff.clinic_id)
      .then((data) => {
        setDoctors(data);
        setSelectedDoctorClinicId((current) => current ?? data[0]?.doctorClinicId ?? null);
      })
      .catch(() => setError("Something went wrong. Please try again."));
  }, [staff]);

  const load = useCallback(() => {
    if (!selectedDoctorClinicId || !staff) return;
    const today = todayDateString();
    Promise.all([
      getTodayQueue(selectedDoctorClinicId, today),
      listClinicAppointments(staff.clinic_id, "today", { doctorId: doctors.find((d) => d.doctorClinicId === selectedDoctorClinicId)?.doctor.id }),
    ])
      .then(([queueData, appointmentData]) => {
        setQueue(queueData);
        setAwaitingCheckIn(appointmentData.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING_PAYMENT"));
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [selectedDoctorClinicId, staff, doctors]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!selectedDoctorClinicId) return;
    return subscribeToClinicQueue(selectedDoctorClinicId, load);
  }, [selectedDoctorClinicId, load]);

  async function handleCheckIn(appointmentId: string) {
    setBusy(true);
    setActionError(null);
    try {
      await checkinAppointment(appointmentId);
      load();
    } catch {
      setActionError("Could not check in this patient. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCallNext() {
    if (!selectedDoctorClinicId) return;
    setBusy(true);
    setActionError(null);
    try {
      await callNextPatient(selectedDoctorClinicId, todayDateString());
      load();
    } catch {
      setActionError("No patients are waiting, or someone is already being consulted.");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(appointmentId: string) {
    setBusy(true);
    setActionError(null);
    try {
      await completeConsultation(appointmentId);
      load();
    } catch {
      setActionError("Could not mark this consultation complete.");
    } finally {
      setBusy(false);
    }
  }

  async function handleNoShow() {
    if (!confirmNoShowId) return;
    setBusy(true);
    setActionError(null);
    try {
      await markNoShow(confirmNoShowId);
      setConfirmNoShowId(null);
      load();
    } catch {
      setActionError("Could not mark this patient as no-show.");
    } finally {
      setBusy(false);
    }
  }

  if (!staff) return <LoadingState title="Loading…" />;
  if (doctors.length === 0 && !loading) {
    return <EmptyState title="No doctors at this clinic yet" />;
  }
  if (loading) return <LoadingState title="Loading today's queue…" />;
  if (error) return <ErrorState title={error} onAction={load} actionLabel="Try again" />;

  const consulting = queue.find((entry) => entry.status === "IN_CONSULTATION");
  const waiting = queue.filter((entry) => entry.status === "WAITING").sort((a, b) => a.token_number - b.token_number);
  const completed = queue.filter((entry) => entry.status === "COMPLETED");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {doctors.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorRow}>
          {doctors.map((d) => (
            <Pressable
              key={d.doctorClinicId}
              onPress={() => setSelectedDoctorClinicId(d.doctorClinicId)}
              style={[styles.doctorChip, selectedDoctorClinicId === d.doctorClinicId && styles.doctorChipActive]}
            >
              <Text
                style={[
                  styles.doctorChipLabel,
                  selectedDoctorClinicId === d.doctorClinicId && styles.doctorChipLabelActive,
                ]}
              >
                {d.doctor.full_name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Now Consulting</Text>
        {consulting ? (
          <View style={styles.consultingBlock}>
            <QueueCard tokenNumber={consulting.token_number} patientName={consulting.patientName} emphasis />
            <Button label="Mark Completed" onPress={() => handleComplete(consulting.appointment_id)} disabled={busy} />
          </View>
        ) : (
          <Text style={styles.mutedText}>No one is currently being consulted.</Text>
        )}
        <PrimaryButton label="Call Next" onPress={handleCallNext} disabled={busy || !!consulting} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Waiting ({waiting.length})</Text>
        {waiting.length === 0 ? (
          <Text style={styles.mutedText}>No patients waiting.</Text>
        ) : (
          waiting.map((entry) => (
            <View key={entry.id} style={styles.waitingRow}>
              <QueueCard tokenNumber={entry.token_number} patientName={entry.patientName} />
              <Text style={styles.noShowLink} onPress={() => setConfirmNoShowId(entry.appointment_id)}>
                No Show
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Awaiting Check-in</Text>
        {awaitingCheckIn.length === 0 ? (
          <Text style={styles.mutedText}>No confirmed appointments waiting to check in.</Text>
        ) : (
          awaitingCheckIn.map((appointment) => (
            <View key={appointment.id} style={styles.waitingRow}>
              <QueueCard
                tokenNumber={appointment.token_number ?? 0}
                patientName={appointment.patientProfile?.full_name ?? "Patient"}
              />
              <Text style={styles.noShowLink} onPress={() => handleCheckIn(appointment.id)}>
                Check In
              </Text>
            </View>
          ))
        )}
      </View>

      {completed.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed ({completed.length})</Text>
          {completed.map((entry) => (
            <QueueCard key={entry.id} tokenNumber={entry.token_number} patientName={entry.patientName} />
          ))}
        </View>
      ) : null}

      <ConfirmationModal
        visible={!!confirmNoShowId}
        title="Mark as no-show?"
        description="This patient will be marked as a no-show for this appointment."
        confirmLabel="Mark No Show"
        danger
        loading={busy}
        onConfirm={handleNoShow}
        onCancel={() => setConfirmNoShowId(null)}
      />
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
    gap: theme.spacing.lg,
  },
  doctorRow: {
    gap: theme.spacing.xs,
  },
  doctorChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  doctorChipActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  doctorChipLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  doctorChipLabelActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.semibold as any,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  consultingBlock: {
    gap: theme.spacing.sm,
  },
  mutedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  noShowLink: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[600],
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
