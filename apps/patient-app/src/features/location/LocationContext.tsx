import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAvailableCities } from "@/lib/api/clinics";

const STORAGE_KEY = "selectedCity";

interface LocationContextValue {
  city: string | null;
  cities: string[];
  loading: boolean;
  setCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

// City list comes from the real clinics.city column (not a hardcoded
// Berhampur-only list) — this is genuine infrastructure for the app's
// eventual all-India reach, even though only one city has clinics today.
export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, available] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
        getAvailableCities().catch((): string[] => []),
      ]);
      if (cancelled) return;
      setCities(available);
      if (stored && available.includes(stored)) {
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
  }

  return <LocationContext.Provider value={{ city, cities, loading, setCity }}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within a LocationProvider");
  return ctx;
}
