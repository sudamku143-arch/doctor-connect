import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState, PrimaryButton, SecondaryButton } from "@doctor-connect/ui-native";
import { getAppointmentDetails } from "@/lib/api/appointments";
import type { AppointmentWithDetails } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel, getDirectionsUrl } from "@/lib/format";

export default function ConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId) return;
    getAppointmentDetails(appointmentId)
      .then(setAppointment)
      .catch(() => setError("Something went wrong. Please try again."));
  }, [appointmentId]);

  if (error) return <ErrorState title={error} />;
  if (!appointment) return <LoadingState title="Loading confirmation…" />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={40} color={theme.colors.text.inverse} />
      </View>
      <Text style={styles.title}>Appointment Confirmed</Text>

      <View style={styles.card}>
        <Row label="Doctor" value={appointment.doctor.full_name} />
        <Row label="Clinic" value={appointment.clinic.name} />
        <Row label="Date" value={formatDateLabel(appointment.appointment_date)} />
        <Row label="Time" value={formatTimeLabel(appointment.appointment_time)} />
        <Row label="Appointment ID" value={appointment.id.slice(0, 8).toUpperCase()} />
        {appointment.token_number != null ? (
          <Row label="Token number" value={`#${appointment.token_number}`} />
        ) : null}
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="View Appointment"
          onPress={() => router.replace(`/appointment/${appointment.id}`)}
        />
        <SecondaryButton
          label="Get Directions"
          onPress={() => Linking.openURL(getDirectionsUrl(appointment.clinic))}
        />
        <SecondaryButton label="Back to Home" onPress={() => router.replace("/(tabs)")} />
      </View>
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
    paddingTop: theme.spacing.huge,
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.success[500],
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  card: {
    width: "100%",
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
  },
  actions: {
    width: "100%",
    gap: theme.spacing.sm,
  },
});
