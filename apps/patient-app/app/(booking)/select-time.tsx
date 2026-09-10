import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { DateStrip, EmptyState, ErrorState, LoadingState, TimeSlotChip } from "@doctor-connect/ui-native";
import type { AppointmentSlot } from "@doctor-connect/types";
import { getDoctorProfile } from "@/lib/api/doctors";
import { listSlotsForDate } from "@/lib/api/slots";
import { buildDateStripItems, formatTimeLabel, todayDateString } from "@/lib/format";
import { useBookingDraft } from "@/features/booking/BookingDraftContext";

export default function SelectTimeScreen() {
  const insets = useSafeAreaInsets();
  const { doctorClinicId, date } = useLocalSearchParams<{ doctorClinicId: string; date?: string }>();
  const { draft, setDoctorContext, setSlot } = useBookingDraft();

  const [loadingDoctor, setLoadingDoctor] = useState(!draft.doctor);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(date || todayDateString());
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

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
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
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
    setSelectedSlot(null);
    setSelectedDate(newDate);
  }

  if (loadingDoctor) {
    return <LoadingState title="Loading availability…" />;
  }
  if (doctorError || !draft.doctor) {
    return <ErrorState title={doctorError ?? "Something went wrong. Please try again."} />;
  }

  function handleConfirm() {
    if (!selectedSlot) return;
    setSlot(selectedSlot);
    router.push("/(booking)/patient-details");
  }

  const photoUrl = draft.doctor.photo_url;
  const averageRating = draft.averageRating;
  const reviewCount = draft.reviewCount ?? 0;

  return (
    <>
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[700]]}
        style={[styles.headerGradient, { paddingTop: insets.top + theme.spacing.md }]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()} hitSlop={6}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary[700]} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={2}>
            Select Date & Time
          </Text>
          <Pressable style={styles.iconButton} onPress={() => setShowCalendar(true)} hitSlop={6}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary[700]} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.doctorCard}>
          <View style={styles.doctorTopRow}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <FontAwesome5 name="user-md" size={28} color={theme.colors.primary[500]} />
              </View>
            )}
            <View style={styles.identity}>
              <Text style={styles.doctorName} numberOfLines={1}>
                {draft.doctor.full_name}
              </Text>
              <View style={styles.clinicRow}>
                <Ionicons name="location" size={13} color={theme.colors.primary[500]} />
                <Text style={styles.clinicName} numberOfLines={1}>
                  {draft.clinic?.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.pillBadge}>
              <Ionicons name="star" size={13} color={theme.colors.warning[500]} />
              <Text style={styles.pillBadgeText}>
                {averageRating != null ? averageRating.toFixed(1) : "New"}
                {reviewCount > 0 ? ` • ${reviewCount}+ Reviews` : ""}
              </Text>
            </View>
            <View style={styles.pillBadge}>
              <Ionicons name="time-outline" size={13} color={theme.colors.primary[600]} />
              <Text style={styles.pillBadgeText}>{draft.doctor.experience_years}+ Years Experience</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <DateStrip items={buildDateStripItems(todayDateString(), 7)} selectedDate={selectedDate} onSelect={handleSelectDate} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timezoneRow}>
              <Ionicons name="time-outline" size={12} color={theme.colors.text.tertiary} />
              <Text style={styles.timezoneText}>IST (GMT+5:30)</Text>
            </View>
          </View>

          <View style={styles.slotsCard}>
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
                    <View key={slot.id} style={styles.slotItem}>
                      <TimeSlotChip
                        label={formatTimeLabel(slot.start_time)}
                        selected={selectedSlot?.id === slot.id}
                        disabled={!isAvailable}
                        onPress={isAvailable ? () => setSelectedSlot(slot) : undefined}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.md }]}>
        <Pressable disabled={!selectedSlot} onPress={handleConfirm}>
          <LinearGradient
            colors={selectedSlot ? [theme.colors.primary[500], theme.colors.primary[700]] : [theme.colors.neutral[200], theme.colors.neutral[200]]}
            style={styles.confirmButton}
          >
            <Text style={[styles.confirmButtonText, !selectedSlot && styles.confirmButtonTextDisabled]}>Confirm Appointment</Text>
          </LinearGradient>
        </Pressable>
        <View style={styles.cancellationRow}>
          <Ionicons name="shield-checkmark-outline" size={12} color={theme.colors.text.tertiary} />
          <Text style={styles.cancellationText}>Free cancellation up to 2 hours before appointment</Text>
        </View>
      </View>

      {showCalendar ? (
        <DateTimePicker
          value={new Date(`${selectedDate}T00:00:00`)}
          mode="date"
          minimumDate={new Date()}
          display="default"
          onChange={(event, picked) => {
            setShowCalendar(false);
            if (event.type === "set" && picked) {
              handleSelectDate(picked.toISOString().slice(0, 10));
            }
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
    textAlign: "center",
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  doctorCard: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    gap: theme.spacing.sm,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  doctorTopRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  photoFallback: {
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  doctorName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  clinicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
  },
  pillBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  timezoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timezoneText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  slotsCard: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  slotItem: {
    width: "47%",
  },
  footer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface.default,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  confirmButton: {
    height: 52,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
  },
  confirmButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
  cancellationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cancellationText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
