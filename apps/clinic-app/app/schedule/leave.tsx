import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { addDoctorLeave } from "@/lib/api/leaves";
import { todayDateString } from "@/lib/format";

export default function DoctorLeaveScreen() {
  const { doctorId, clinicId } = useLocalSearchParams<{ doctorId: string; clinicId: string }>();
  const [startDate, setStartDate] = useState(todayDateString());
  const [endDate, setEndDate] = useState(todayDateString());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!doctorId || !clinicId) return;
    setSaving(true);
    setError(null);
    try {
      const affected = await addDoctorLeave({ doctorId, clinicId, startDate, endDate, reason: reason || undefined });
      if (affected.length > 0) {
        router.replace({ pathname: "/affected-appointments", params: { ids: JSON.stringify(affected.map((a) => a.id)) } });
      } else {
        router.back();
      }
    } catch {
      setError("Could not save this leave. Please check the dates and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.helperText}>
        For a single day, set the same start and end date. New bookings will be blocked for this range — any
        already-booked appointments are never cancelled automatically; you&apos;ll be able to review them next.
      </Text>

      <TextField label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
      <TextField label="End date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
      <TextField label="Reason (optional, internal note)" value={reason} onChangeText={setReason} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Mark Doctor Unavailable" onPress={handleSave} loading={saving} />
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
  helperText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
