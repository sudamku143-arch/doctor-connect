import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAvailableCities } from "@/lib/api/clinics";

const STORAGE_KEY = "selectedCity";
const RECENTS_KEY = "recentCities";
const MAX_RECENTS = 3;

interface LocationContextValue {
  city: string | null;
  /** Cities that currently have verified clinics (i.e. where results exist). */
  cities: string[];
  /** Most recently selected cities, newest first. */
  recentCities: string[];
  loading: boolean;
  setCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

// City list comes from the real clinics.city column (not a hardcoded
// Berhampur-only list) — this is genuine infrastructure for the app's
// eventual all-India reach, even though only one city has clinics today.
// Any city may be selected (e.g. the user's GPS city before we launch
// there); screens filter by it and show an honest empty state.
export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [recentCities, setRecentCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, storedRecents, available] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(RECENTS_KEY).catch(() => null),
        getAvailableCities().catch((): string[] => []),
      ]);
      if (cancelled) return;
      setCities(available);
      setRecentCities(parseRecents(storedRecents));
      if (stored) {
        setCityState(stored);
      } else if (available.length > 0) {
        setCityState(available[0]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setCity(next: string) {
    setCityState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
    setRecentCities((prev) => {
      const updated = [next, ...prev.filter((c) => c !== next)].slice(0, MAX_RECENTS);
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated)).catch(() => undefined);
      return updated;
    });
  }

  return (
    <LocationContext.Provider value={{ city, cities, recentCities, loading, setCity }}>
      {children}
    </LocationContext.Provider>
  );
}

function parseRecents(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string").slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within a LocationProvider");
  return ctx;
}
