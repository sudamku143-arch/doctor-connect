import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton, TextField } from "@doctor-connect/ui-native";
import { addSchedule, regenerateSlots } from "@/lib/api/schedules";
import { DAY_OF_WEEK_NAMES } from "@/lib/format";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AddAvailabilityScreen() {
  const { doctorClinicId } = useLocalSearchParams<{ doctorClinicId: string }>();
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("13:00");
  const [slotDuration, setSlotDuration] = useState("30");
  const [maxPatients, setMaxPatients] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!doctorClinicId) return;
    setSaving(true);
    setError(null);
    try {
      await addSchedule({
        doctorClinicId,
        dayOfWeek,
        startTime,
        endTime,
        slotDurationMinutes: Number(slotDuration) || 30,
        maxPatientsPerSlot: Number(maxPatients) || 1,
      });
      await regenerateSlots(doctorClinicId);
      router.back();
    } catch {
      setError("Could not save this availability. Please check the times and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Day</Text>
      <View style={styles.dayRow}>
        {DAY_SHORT.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => setDayOfWeek(index)}
            style={[styles.dayButton, dayOfWeek === index && styles.dayButtonActive]}
          >
            <Text style={[styles.dayLabel, dayOfWeek === index && styles.dayLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.selectedDay}>{DAY_OF_WEEK_NAMES[dayOfWeek]}</Text>

      <TextField label="Start time (24h, HH:MM)" placeholder="10:00" value={startTime} onChangeText={setStartTime} />
      <TextField label="End time (24h, HH:MM)" placeholder="13:00" value={endTime} onChangeText={setEndTime} />
      <TextField
        label="Slot duration (minutes)"
        keyboardType="number-pad"
        value={slotDuration}
        onChangeText={setSlotDuration}
      />
      <TextField
        label="Maximum patients per slot"
        keyboardType="number-pad"
        value={maxPatients}
        onChangeText={setMaxPatients}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Save Availability" onPress={handleSave} loading={saving} />
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
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.secondary,
  },
  dayRow: {
    flexDirection: "row",
    gap: theme.spacing.xxs,
  },
  dayButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  dayLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.primary,
  },
  dayLabelActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.semibold as any,
  },
  selectedDay: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
