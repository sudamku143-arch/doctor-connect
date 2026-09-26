import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState, PrimaryButton, SecondaryButton } from "@doctor-connect/ui-native";
import { useClinic } from "@/features/clinic/ClinicContext";
import { listClinicDoctors } from "@/lib/api/doctors";
import type { ClinicDoctor } from "@/lib/api/types";
import { deleteSchedule, listSchedules, regenerateSlots } from "@/lib/api/schedules";
import type { DoctorSchedule } from "@doctor-connect/types";
import { DAY_OF_WEEK_NAMES, formatTimeLabel } from "@/lib/format";

export default function DoctorScheduleScreen() {
  const { staff } = useClinic();
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [selectedDoctorClinicId, setSelectedDoctorClinicId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateMessage, setRegenerateMessage] = useState<string | null>(null);

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
    if (!selectedDoctorClinicId) return;
    setLoading(true);
    listSchedules(selectedDoctorClinicId)
      .then(setSchedules)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [selectedDoctorClinicId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDelete(id: string) {
    try {
      await deleteSchedule(id);
      load();
    } catch {
      setError("Could not remove this availability. Please try again.");
    }
  }

  async function handleRegenerate() {
    if (!selectedDoctorClinicId) return;
    setRegenerating(true);
    setRegenerateMessage(null);
    try {
      const count = await regenerateSlots(selectedDoctorClinicId);
      setRegenerateMessage(`Generated ${count} new slot(s) for the next 14 days.`);
    } catch {
      setRegenerateMessage("Could not regenerate slots. Please try again.");
    } finally {
      setRegenerating(false);
    }
  }

  if (!staff) return <LoadingState title="Loading…" />;
  if (doctors.length === 0 && !loading) return <EmptyState title="No doctors at this clinic yet" />;

  const schedulesByDay = new Map<number, DoctorSchedule[]>();
  for (const schedule of schedules) {
    const list = schedulesByDay.get(schedule.day_of_week) ?? [];
    list.push(schedule);
    schedulesByDay.set(schedule.day_of_week, list);
  }

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

      {loading ? (
        <LoadingState title="Loading schedule…" />
      ) : error ? (
        <ErrorState title={error} onAction={load} actionLabel="Try again" />
      ) : (
        <View style={styles.weekList}>
          {DAY_OF_WEEK_NAMES.map((dayName, dayIndex) => {
            const daySchedules = schedulesByDay.get(dayIndex) ?? [];
            return (
              <View key={dayName} style={styles.dayRow}>
                <Text style={styles.dayName}>{dayName}</Text>
                {daySchedules.length === 0 ? (
                  <Text style={styles.notAvailable}>Not Available</Text>
                ) : (
                  daySchedules.map((schedule) => (
                    <View key={schedule.id} style={styles.scheduleRow}>
                      <Text style={styles.scheduleTime}>
                        {formatTimeLabel(schedule.start_time)} – {formatTimeLabel(schedule.end_time)}
                      </Text>
                      <Text style={styles.removeLink} onPress={() => handleDelete(schedule.id)}>
                        Remove
                      </Text>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>
      )}

      {regenerateMessage ? <Text style={styles.mutedText}>{regenerateMessage}</Text> : null}

      <View style={styles.actions}>
        <PrimaryButton
          label="Add Availability"
          onPress={() => selectedDoctorClinicId && router.push({ pathname: "/schedule/add-availability", params: { doctorClinicId: selectedDoctorClinicId } })}
        />
        <SecondaryButton
          label="Regenerate Slots"
          onPress={handleRegenerate}
          loading={regenerating}
        />
        <SecondaryButton
          label="Doctor Leave"
          onPress={() => {
            const doctor = doctors.find((d) => d.doctorClinicId === selectedDoctorClinicId);
            if (doctor && staff) {
              router.push({ pathname: "/schedule/leave", params: { doctorId: doctor.doctor.id, clinicId: staff.clinic_id } });
            }
          }}
        />
        <SecondaryButton
          label="Block a Slot"
          onPress={() => selectedDoctorClinicId && router.push({ pathname: "/schedule/block-slot", params: { doctorClinicId: selectedDoctorClinicId } })}
        />
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
  weekList: {
    gap: theme.spacing.sm,
  },
  dayRow: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xxs,
    ...theme.cardShadow,
  },
  dayName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  notAvailable: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  removeLink: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error[500],
  },
  mutedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
