import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@doctor-connect/ui-native";
import { useClinic } from "@/features/clinic/ClinicContext";
import { getPatient, getPatientHistoryAtClinic, type PatientSearchResult } from "@/lib/api/patients";
import type { ClinicAppointment } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staff } = useClinic();
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [history, setHistory] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !staff) return;
    Promise.all([getPatient(id), getPatientHistoryAtClinic(id, staff.clinic_id)])
      .then(([patientData, historyData]) => {
        setPatient(patientData);
        setHistory(historyData);
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [id, staff]);

  if (loading) return <LoadingState title="Loading patient…" />;
  if (error) return <ErrorState title={error} />;
  if (!patient) return <ErrorState title="Patient not found" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{patient.profile.full_name}</Text>
      {patient.profile.phone ? <Text style={styles.meta}>{patient.profile.phone}</Text> : null}
      {patient.profile.email ? <Text style={styles.meta}>{patient.profile.email}</Text> : null}

      <Text style={styles.sectionTitle}>Appointment history at this clinic</Text>
      {history.length === 0 ? (
        <EmptyState title="No appointment history yet" />
      ) : (
        history.map((appointment) => (
          <View key={appointment.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.doctorName}>{appointment.doctor.full_name}</Text>
              <StatusBadge status={appointment.status} />
            </View>
            <Text style={styles.meta}>
              {formatDateLabel(appointment.appointment_date)}, {formatTimeLabel(appointment.appointment_time)}
            </Text>
          </View>
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
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  meta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xxs,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  doctorName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
});
