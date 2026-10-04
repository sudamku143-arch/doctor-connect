import type { ClinicCoordinates } from "@/lib/api/clinics";

// Suggested cities in the location picker. This is only a suggestion list
// for the launch region — filtering is always done against the real
// clinics.city column, so a city here with no clinics yet simply shows an
// honest "not available yet" state, and any city that gets clinics is
// picked up automatically from the database whether or not it's listed.
export const POPULAR_CITIES = [
  "Berhampur",
  "Bhubaneswar",
  "Cuttack",
  "Visakhapatnam",
  "Puri",
  "Rourkela",
  "Sambalpur",
];

// Official/alternate names that GPS reverse-geocoding (or a user) may use
// for a city we list under a different name.
const CITY_ALIASES: Record<string, string> = {
  brahmapur: "Berhampur",
  berhampur: "Berhampur",
  vizag: "Visakhapatnam",
  vishakhapatnam: "Visakhapatnam",
  bhubaneshwar: "Bhubaneswar",
};

/** Max distance for "you're near this city's clinics" when GPS gives an unknown locality. */
const NEAREST_CITY_MAX_KM = 40;

export function canonicalCityName(name: string, knownCities: string[]): string {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  const known = knownCities.find((c) => c.toLowerCase() === key);
  if (known) return known;
  return CITY_ALIASES[key] ?? trimmed;
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function nearestClinicCity(
  latitude: number,
  longitude: number,
  clinics: ClinicCoordinates[],
  maxKm = NEAREST_CITY_MAX_KM,
): string | null {
  let best: { city: string; km: number } | null = null;
  for (const clinic of clinics) {
    const km = distanceKm(latitude, longitude, clinic.latitude, clinic.longitude);
    if (km <= maxKm && (!best || km < best.km)) best = { city: clinic.city, km };
  }
  return best?.city ?? null;
}

/**
 * Picks the city to switch to after a GPS fix: a geocoded name that matches
 * a served city (directly or by alias) wins; otherwise the city of the
 * nearest clinic within range; otherwise the geocoded name as-is (the app
 * then shows it has no doctors there yet), or null if geocoding gave nothing.
 */
export function resolveGpsCity(
  geocodedNames: (string | null | undefined)[],
  servedCities: string[],
  position: { latitude: number; longitude: number },
  clinics: ClinicCoordinates[],
): string | null {
  const names = geocodedNames.filter((n): n is string => !!n && n.trim().length > 0);
  for (const name of names) {
    const canonical = canonicalCityName(name, servedCities);
    if (servedCities.includes(canonical)) return canonical;
  }
  const nearest = nearestClinicCity(position.latitude, position.longitude, clinics);
  if (nearest) return nearest;
  return names.length > 0 ? canonicalCityName(names[0], servedCities) : null;
}
