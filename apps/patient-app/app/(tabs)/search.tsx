import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { DoctorCard, DoctorCardSkeleton, EmptyState, ErrorState, ListSkeleton } from "@doctor-connect/ui-native";
import { useLocation } from "@/features/location/LocationContext";
import { searchDoctors, type DoctorSort } from "@/lib/api/doctors";
import type { DoctorListItem } from "@/lib/api/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 6;

async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveRecentSearch(term: string): Promise<string[]> {
  const existing = await loadRecentSearches();
  const next = [term, ...existing.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => undefined);
  return next;
}

const SORT_OPTIONS: { value: DoctorSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "highestRated", label: "Highest Rated" },
  { value: "lowestFee", label: "Lowest Fee" },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { city } = useLocation();
  const [queryText, setQueryText] = useState("");
  const [availableToday, setAvailableToday] = useState(false);
  const [availableThisWeek, setAvailableThisWeek] = useState(false);
  const [sort, setSort] = useState<DoctorSort>("recommended");

  const [results, setResults] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadRecentSearches().then(setRecentSearches);
  }, []);

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
      searchDoctors({ query: queryText, availableToday, availableThisWeek, sort, city })
        .then((rows) => {
          setResults(rows);
          if (queryText.trim()) {
            saveRecentSearch(queryText.trim()).then(setRecentSearches);
          }
        })
        .catch(() => setError("Something went wrong. Please try again."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [queryText, availableToday, availableThisWeek, sort, city]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
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

      {!hasSearched && recentSearches.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.filterRow}>
            {recentSearches.map((term) => (
              <FilterChip key={term} label={term} active={false} onPress={() => setQueryText(term)} />
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <ListSkeleton item={DoctorCardSkeleton} count={3} />
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
            onClinicPress={() => router.push(`/clinic/${item.clinic.id}`)}
            onBook={() => router.push({ pathname: "/(booking)/consultation-type", params: { doctorClinicId: item.doctorClinicId } })}
          />
        ))
      )}
    </ScrollView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
        {label}
      </Text>
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
  recentSection: {
    gap: theme.spacing.xs,
  },
  recentTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.secondary,
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: theme.spacing.md,
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
