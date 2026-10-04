import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { theme } from "@doctor-connect/theme";
import { listClinicCoordinates, searchLocations, type LocationMatch } from "@/lib/api/clinics";
import { useLocation } from "./LocationContext";
import { POPULAR_CITIES, resolveGpsCity } from "./cities";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LocationPickerSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { city, cities: servedCities, recentCities, setCity } = useLocation();
  const [query, setQuery] = useState("");
  const [areaMatches, setAreaMatches] = useState<LocationMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Served cities first (they have doctors), then the rest of the launch-region suggestions.
  const suggestedCities = useMemo(
    () => [...servedCities, ...POPULAR_CITIES.filter((c) => !servedCities.includes(c))],
    [servedCities],
  );
  const recents = recentCities.filter((c) => c !== city);

  const trimmed = query.trim();
  const cityNameMatches = trimmed
    ? suggestedCities.filter((c) => c.toLowerCase().includes(trimmed.toLowerCase()))
    : [];

  // Debounced area/pincode search against real clinic addresses.
  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchLocations(trimmed)
        .then((rows) => {
          if (!cancelled) setAreaMatches(rows.filter((r) => r.area));
        })
        .catch(() => {
          if (!cancelled) setAreaMatches([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  function handleQueryChange(next: string) {
    setQuery(next);
    if (next.trim().length < 2) setAreaMatches([]);
  }

  function close() {
    setQuery("");
    setAreaMatches([]);
    setGpsError(null);
    onClose();
  }

  function select(next: string) {
    setCity(next);
    close();
  }

  async function detectCurrentLocation() {
    setGpsError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError("Location permission was denied. You can pick your city from the list instead.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const [[place], clinics] = await Promise.all([
        Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []),
        listClinicCoordinates().catch(() => []),
      ]);
      const detected = resolveGpsCity(
        [place?.city, place?.district, place?.subregion],
        servedCities,
        { latitude, longitude },
        clinics,
      );
      if (!detected) {
        setGpsError("Couldn't work out your city. Please pick it from the list.");
        return;
      }
      select(detected);
    } catch {
      setGpsError("Couldn't get your location. Check that location services are on and try again.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close location picker" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <Text style={styles.title}>Select Location</Text>
              <Pressable onPress={close} hitSlop={10} style={styles.closeButton} accessibilityLabel="Close">
                <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
              <TextInput
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Search city, area or pincode"
                placeholderTextColor={theme.colors.text.tertiary}
                style={styles.searchInput}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => handleQueryChange("")} hitSlop={8} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={theme.colors.text.tertiary} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={detectCurrentLocation}
              disabled={locating}
              style={({ pressed }) => [styles.gpsButton, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.gpsIcon}>
                {locating ? (
                  <ActivityIndicator size="small" color={theme.colors.primary[600]} />
                ) : (
                  <Ionicons name="locate" size={18} color={theme.colors.primary[600]} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsTitle}>Use current location</Text>
                <Text style={styles.gpsSubtitle}>{locating ? "Detecting your location…" : "Using GPS"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.primary[400]} />
            </Pressable>
            {gpsError ? <Text style={styles.gpsError}>{gpsError}</Text> : null}

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {trimmed ? (
                <>
                  {cityNameMatches.length > 0 ? <SectionLabel label="Cities" /> : null}
                  {cityNameMatches.map((c) => (
                    <CityRow key={c} name={c} live={servedCities.includes(c)} selected={c === city} onPress={() => select(c)} />
                  ))}
                  {areaMatches.length > 0 ? <SectionLabel label="Areas" /> : null}
                  {areaMatches.map((m) => (
                    <CityRow
                      key={`${m.city}|${m.area}`}
                      name={m.city}
                      detail={m.area}
                      live
                      selected={false}
                      onPress={() => select(m.city)}
                    />
                  ))}
                  {searching ? (
                    <ActivityIndicator style={{ marginTop: theme.spacing.md }} color={theme.colors.primary[500]} />
                  ) : cityNameMatches.length === 0 && areaMatches.length === 0 ? (
                    <View style={styles.noResults}>
                      <Ionicons name="map-outline" size={28} color={theme.colors.text.tertiary} />
                      <Text style={styles.noResultsTitle}>No matching locations</Text>
                      <Text style={styles.noResultsText}>
                        We’re launching city by city. Try another city, area or pincode.
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  {recents.length > 0 ? (
                    <>
                      <SectionLabel label="Recent" />
                      {recents.map((c) => (
                        <CityRow
                          key={`recent-${c}`}
                          name={c}
                          icon="time-outline"
                          live={servedCities.includes(c)}
                          selected={false}
                          onPress={() => select(c)}
                        />
                      ))}
                    </>
                  ) : null}
                  <SectionLabel label="Popular cities" />
                  {suggestedCities.map((c) => (
                    <CityRow key={c} name={c} live={servedCities.includes(c)} selected={c === city} onPress={() => select(c)} />
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function CityRow({
  name,
  detail,
  icon = "location-outline",
  live,
  selected,
  onPress,
}: {
  name: string;
  detail?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  live: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cityRow, selected && styles.cityRowSelected, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Ionicons name={icon} size={18} color={selected ? theme.colors.primary[600] : theme.colors.text.tertiary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.cityName, selected && styles.cityNameSelected]}>{name}</Text>
        {detail ? (
          <Text style={styles.cityDetail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      {!live ? <Text style={styles.soonBadge}>Coming soon</Text> : null}
      {selected ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary[500]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: theme.colors.surface.default,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.neutral[200],
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.neutral[100],
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    height: 48,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.surface.subtle,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: 14,
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[100],
  },
  gpsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface.default,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.primary[700],
  },
  gpsSubtitle: {
    fontSize: 12,
    color: theme.colors.primary[500],
    marginTop: 1,
  },
  gpsError: {
    fontSize: 12,
    color: theme.colors.error[500],
    marginTop: theme.spacing.xs,
  },
  list: {
    marginTop: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxs,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 12,
  },
  cityRowSelected: {
    backgroundColor: theme.colors.primary[50],
  },
  cityName: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  cityNameSelected: {
    fontWeight: "600",
    color: theme.colors.primary[700],
  },
  cityDetail: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 1,
  },
  soonBadge: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  noResults: {
    alignItems: "center",
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.xl,
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  noResultsText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
});
