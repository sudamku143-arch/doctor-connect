import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { Button, DateStrip, EmptyState, ErrorState, LoadingState, TimeSlotChip } from "@doctor-connect/ui-native";
import type { AppointmentSlot, ConsultationType } from "@doctor-connect/types";
import { useClinic } from "@/features/clinic/ClinicContext";
import { bookAppointmentByClinic, listSlotsForDate } from "@/lib/api/booking";
import { listClinicDoctors } from "@/lib/api/doctors";
import { findPatientsForBooking } from "@/lib/api/patients";
import type { BookingPatientMatch, ClinicDoctor } from "@/lib/api/types";
import { buildDateStripItems, formatTimeLabel, todayDateString } from "@/lib/format";

// One scrolling screen with progressive sections rather than a multi-step
// wizard (unlike the patient app's own booking flow) — a receptionist
// booking a walk-in wants speed, not hand-holding.
export default function NewAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const { staff } = useClinic();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<BookingPatientMatch[]>([]);
  const [patient, setPatient] = useState<BookingPatientMatch | null>(null);

  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctor, setDoctor] = useState<ClinicDoctor | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>("PHYSICAL");

  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState<AppointmentSlot | null>(null);

  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (!staff) return;
    listClinicDoctors(staff.clinic_id)
      .then(setDoctors)
      .finally(() => setDoctorsLoading(false));
  }, [staff]);

  // Slot/loading resets happen in selectDoctor/selectDate (the event
  // handlers that change these inputs), so this effect only fetches.
  useEffect(() => {
    if (!doctor) return;
    let cancelled = false;
    listSlotsForDate(doctor.doctorClinicId, selectedDate)
      .then((next) => {
        if (!cancelled) setSlots(next);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctor, selectedDate]);

  async function handleSearch() {
    if (!staff || !query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      setResults(await findPatientsForBooking(staff.clinic_id, query));
    } finally {
      setSearching(false);
    }
  }

  function selectDoctor(next: ClinicDoctor) {
    setDoctor(next);
    setSlot(null);
    setSlotsLoading(true);
    if (next.doctor.consultation_mode === "PHYSICAL_ONLY") setConsultationType("PHYSICAL");
  }

  function selectDate(next: string) {
    setSelectedDate(next);
    setSlot(null);
    if (doctor) setSlotsLoading(true);
  }

  async function handleConfirm() {
    if (!patient || !slot) return;
    setBooking(true);
    setBookingError(null);
    try {
      const appointment = await bookAppointmentByClinic({
        patientId: patient.patient_id,
        slotId: slot.id,
        consultationType,
        reason: reason.trim() || undefined,
      });
      router.replace(`/appointment/${appointment.id}`);
    } catch {
      setBookingError("Could not book this appointment. The slot may no longer be available.");
    } finally {
      setBooking(false);
    }
  }

  if (!staff) return <LoadingState title="Loading…" />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.md, paddingBottom: insets.bottom + theme.spacing.xxxl }]}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>New Appointment</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Find patient</Text>
        {patient ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedIconCircle}>
              <Ionicons name="person" size={18} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{patient.full_name}</Text>
              {patient.phone ? <Text style={styles.selectedMeta}>{patient.phone}</Text> : null}
            </View>
            <Pressable onPress={() => setPatient(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={theme.colors.text.tertiary} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
              <TextInput
                placeholder="Search by name or mobile number"
                placeholderTextColor={theme.colors.text.tertiary}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <Pressable onPress={handleSearch} hitSlop={8}>
                <Ionicons name="arrow-forward-circle" size={26} color={theme.colors.primary[500]} />
              </Pressable>
            </View>
            {searching ? (
              <LoadingState title="Searching…" />
            ) : searched && results.length === 0 ? (
              <EmptyState
                icon="person-outline"
                title="No matching patient"
                description="They'll need to register on the patient app first."
              />
            ) : (
              results.map((match) => (
                <Pressable key={match.patient_id} style={styles.resultRow} onPress={() => setPatient(match)}>
                  <Text style={styles.resultName}>{match.full_name}</Text>
                  {match.phone ? <Text style={styles.resultMeta}>{match.phone}</Text> : null}
                </Pressable>
              ))
            )}
          </>
        )}
      </View>

      {patient ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Choose doctor</Text>
          {doctorsLoading ? (
            <LoadingState title="Loading doctors…" />
          ) : doctors.length === 0 ? (
            <EmptyState title="No doctors at this clinic yet" />
          ) : (
            <View style={styles.doctorList}>
              {doctors.map((item) => {
                const isSelected = doctor?.doctorClinicId === item.doctorClinicId;
                return (
                  <Pressable
                    key={item.doctorClinicId}
                    style={[styles.doctorRow, isSelected && styles.doctorRowSelected]}
                    onPress={() => selectDoctor(item)}
                  >
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>{item.doctor.full_name}</Text>
                      <Text style={styles.doctorMeta}>{item.doctor.qualification} • ₹{item.consultationFee}</Text>
                    </View>
                    {isSelected ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary[600]} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {doctor ? (
        <>
          {doctor.doctor.consultation_mode === "BOTH" ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Consultation type</Text>
              <View style={styles.typeRow}>
                <TypeChip
                  label="In-Clinic"
                  icon="business"
                  selected={consultationType === "PHYSICAL"}
                  onPress={() => setConsultationType("PHYSICAL")}
                />
                <TypeChip
                  label="Video Call"
                  icon="videocam"
                  selected={consultationType === "VIDEO"}
                  onPress={() => setConsultationType("VIDEO")}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{doctor.doctor.consultation_mode === "BOTH" ? "4." : "3."} Date & time</Text>
            <DateStrip items={buildDateStripItems(todayDateString(), 7)} selectedDate={selectedDate} onSelect={selectDate} />
            <View style={styles.slotsCard}>
              {slotsLoading ? (
                <LoadingState title="Loading slots…" />
              ) : slots.length === 0 ? (
                <EmptyState title="No slots on this date" description="Try a different date above." />
              ) : (
                <View style={styles.slotGrid}>
                  {slots.map((item) => {
                    const isAvailable = item.status === "OPEN" && item.booked_count < item.max_capacity;
                    return (
                      <View key={item.id} style={styles.slotItem}>
                        <TimeSlotChip
                          label={formatTimeLabel(item.start_time)}
                          selected={slot?.id === item.id}
                          disabled={!isAvailable}
                          onPress={isAvailable ? () => setSlot(item) : undefined}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <TextInput
              placeholder="Reason for visit (optional)"
              placeholderTextColor={theme.colors.text.tertiary}
              style={styles.reasonInput}
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </View>
        </>
      ) : null}

      {bookingError ? <ErrorState title={bookingError} /> : null}

      {slot ? (
        <Button label="Confirm Appointment" onPress={handleConfirm} loading={booking} />
      ) : null}
    </ScrollView>
  );
}

function TypeChip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.typeChip, selected && styles.typeChipSelected]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={selected ? theme.colors.text.inverse : theme.colors.primary[600]} />
      <Text style={[styles.typeChipLabel, selected && styles.typeChipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    height: 52,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  resultRow: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 2,
    ...theme.cardShadow,
  },
  resultName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  resultMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.cardShadow,
  },
  selectedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  selectedInfo: {
    flex: 1,
    gap: 1,
  },
  selectedName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  selectedMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  doctorList: {
    gap: theme.spacing.xs,
  },
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  doctorRowSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  doctorInfo: {
    flex: 1,
    gap: 1,
  },
  doctorName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  doctorMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  typeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary[600],
  },
  typeChipLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  typeChipLabelSelected: {
    color: theme.colors.text.inverse,
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
    width: "31%",
  },
  reasonInput: {
    minHeight: 52,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    textAlignVertical: "top",
  },
});
