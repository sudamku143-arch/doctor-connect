import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { DoctorCard, EmptyState, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { searchDoctors, type DoctorSort } from "@/lib/api/doctors";
import type { DoctorListItem } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

const SORT_OPTIONS: { value: DoctorSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "highestRated", label: "Highest Rated" },
  { value: "lowestFee", label: "Lowest Fee" },
];

export default function SearchScreen() {
  const [queryText, setQueryText] = useState("");
  const [availableToday, setAvailableToday] = useState(false);
  const [availableThisWeek, setAvailableThisWeek] = useState(false);
  const [sort, setSort] = useState<DoctorSort>("recommended");

  const [results, setResults] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!queryText.trim() && !availableToday && !availableThisWeek) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setError(null);
      setHasSearched(true);
      searchDoctors({ query: queryText, availableToday, availableThisWeek, sort })
        .then(setResults)
        .catch(() => setError("Something went wrong. Please try again."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [queryText, availableToday, availableThisWeek, sort]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
        <TextInput
          placeholder="Search doctor, specialty or clinic"
          placeholderTextColor={theme.colors.text.tertiary}
          style={styles.searchInput}
          value={queryText}
          onChangeText={setQueryText}
        />
      </View>

      <View style={styles.filterRow}>
        <FilterChip label="Available today" active={availableToday} onPress={() => setAvailableToday((v) => !v)} />
        <FilterChip
          label="Available this week"
          active={availableThisWeek}
          onPress={() => setAvailableThisWeek((v) => !v)}
        />
      </View>

      <View style={styles.filterRow}>
        {SORT_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={sort === option.value}
            onPress={() => setSort(option.value)}
          />
        ))}
      </View>

      {loading ? (
        <LoadingState title="Searching…" />
      ) : error ? (
        <ErrorState title={error} />
      ) : !hasSearched ? (
        <EmptyState
          title="Search for a doctor, specialty, or clinic"
          description="Or use the filters above to browse what's available today."
        />
      ) : results.length === 0 ? (
        <EmptyState title="No doctors found." description="Try a different search term or filter." />
      ) : (
        results.map((item) => (
          <DoctorCard
            key={item.doctorClinicId}
            photoUrl={item.doctor.photo_url}
            name={item.doctor.full_name}
            verified={item.doctor.verification_status === "VERIFIED"}
            qualification={item.doctor.qualification}
            specialtyNames={item.specialties.map((s) => s.name)}
            experienceYears={item.doctor.experience_years}
            averageRating={item.averageRating}
            reviewCount={item.reviewCount}
            clinicName={item.clinic.name}
            consultationFee={item.consultationFee}
            nextAvailableLabel={
              item.nextAvailable
                ? `${formatDateLabel(item.nextAvailable.date)}, ${formatTimeLabel(item.nextAvailable.startTime)}`
                : null
            }
            onViewProfile={() => router.push(`/doctor/${item.doctorClinicId}`)}
            onBook={() => router.push({ pathname: "/(booking)/select-time", params: { doctorClinicId: item.doctorClinicId } })}
          />
        ))
      )}
    </ScrollView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
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
    gap: theme.spacing.md,
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  chipActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  chipLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  chipLabelActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.semibold as any,
  },
});
