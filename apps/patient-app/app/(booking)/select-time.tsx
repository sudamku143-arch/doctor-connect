import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { DateStrip, EmptyState, ErrorState, LoadingState, TimeSlotChip } from "@doctor-connect/ui-native";
import type { AppointmentSlot } from "@doctor-connect/types";
import { getDoctorProfile } from "@/lib/api/doctors";
import { listSlotsForDate } from "@/lib/api/slots";
import { buildDateStripItems, formatTimeLabel, todayDateString } from "@/lib/format";
import { useBookingDraft } from "@/features/booking/BookingDraftContext";

export default function SelectTimeScreen() {
  const { doctorClinicId, date } = useLocalSearchParams<{ doctorClinicId: string; date?: string }>();
  const { draft, setDoctorContext, setSlot } = useBookingDraft();

  const [loadingDoctor, setLoadingDoctor] = useState(!draft.doctor);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(date || todayDateString());
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    if (draft.doctor || !doctorClinicId) return;
    let cancelled = false;
    getDoctorProfile(doctorClinicId)
      .then((item) => {
        if (cancelled) return;
        if (!item) {
          setDoctorError("Doctor not found.");
          return;
        }
        setDoctorContext({
          doctorClinicId: item.doctorClinicId,
          doctor: item.doctor,
          clinic: item.clinic,
          consultationFee: item.consultationFee,
        });
      })
      .catch(() => !cancelled && setDoctorError("Something went wrong. Please try again."))
      .finally(() => !cancelled && setLoadingDoctor(false));
    return () => {
      cancelled = true;
    };
  }, [doctorClinicId, draft.doctor, setDoctorContext]);

  const activeDoctorClinicId = draft.doctorClinicId ?? doctorClinicId;

  useEffect(() => {
    if (!activeDoctorClinicId) return;
    let cancelled = false;
    listSlotsForDate(activeDoctorClinicId, selectedDate)
      .then((data) => {
        if (cancelled) return;
        setSlots(data);
        setSlotsError(null);
      })
      .catch(() => !cancelled && setSlotsError("Something went wrong. Please try again."))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeDoctorClinicId, selectedDate]);

  // Loading-state reset lives in this handler (an event, not an effect body)
  // so switching dates shows a fresh spinner without setState-in-effect.
  function handleSelectDate(newDate: string) {
    setSlotsLoading(true);
    setSelectedDate(newDate);
  }

  if (loadingDoctor) {
    return <LoadingState title="Loading availability…" />;
  }
  if (doctorError || !draft.doctor) {
    return <ErrorState title={doctorError ?? "Something went wrong. Please try again."} />;
  }

  function handleSelectSlot(slot: AppointmentSlot) {
    setSlot(slot);
    router.push("/(booking)/patient-details");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.doctorName}>{draft.doctor.full_name}</Text>
        <Text style={styles.clinicName}>{draft.clinic?.name}</Text>
      </View>

      <DateStrip items={buildDateStripItems(todayDateString(), 14)} selectedDate={selectedDate} onSelect={handleSelectDate} />

      {slotsLoading ? (
        <LoadingState title="Loading slots…" />
      ) : slotsError ? (
        <ErrorState title={slotsError} />
      ) : slots.length === 0 ? (
        <EmptyState title="Doctor is not available on this date." description="Try a different date above." />
      ) : (
        <View style={styles.slotGrid}>
          {slots.map((slot) => {
            const isAvailable = slot.status === "OPEN" && slot.booked_count < slot.max_capacity;
            return (
              <TimeSlotChip
                key={slot.id}
                label={formatTimeLabel(slot.start_time)}
                disabled={!isAvailable}
                onPress={isAvailable ? () => handleSelectSlot(slot) : undefined}
              />
            );
          })}
        </View>
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
    gap: theme.spacing.lg,
  },
  summary: {
    gap: 2,
  },
  doctorName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
});
