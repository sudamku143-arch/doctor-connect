import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { addBlockedSlot } from "@/lib/api/blockedSlots";
import { todayDateString } from "@/lib/format";

export default function BlockSlotScreen() {
  const { doctorClinicId } = useLocalSearchParams<{ doctorClinicId: string }>();
  const [date, setDate] = useState(todayDateString());
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!doctorClinicId) return;
    setSaving(true);
    setError(null);
    try {
      const affected = await addBlockedSlot({ doctorClinicId, date, startTime, endTime, reason: reason || undefined });
      if (affected.length > 0) {
        router.replace({ pathname: "/affected-appointments", params: { ids: JSON.stringify(affected.map((a) => a.id)) } });
      } else {
        router.back();
      }
    } catch {
      setError("Could not block this slot. Please check the times and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.helperText}>Blocked slots can&apos;t be booked by patients.</Text>

      <TextField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <TextField label="Start time (24h, HH:MM)" placeholder="17:00" value={startTime} onChangeText={setStartTime} />
      <TextField label="End time (24h, HH:MM)" placeholder="18:00" value={endTime} onChangeText={setEndTime} />
      <TextField label="Reason" placeholder="Meeting / Emergency / Personal" value={reason} onChangeText={setReason} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Block Slot" onPress={handleSave} loading={saving} />
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
