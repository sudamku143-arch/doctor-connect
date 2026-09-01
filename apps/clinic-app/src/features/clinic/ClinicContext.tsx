import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMyClinicStaff, type MyClinicStaff } from "@/lib/api/clinicStaff";
import { useAuth } from "@/features/auth/AuthProvider";

interface ClinicContextValue {
  staff: MyClinicStaff | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const ClinicContext = createContext<ClinicContextValue>({
  staff: null,
  isLoading: true,
  error: null,
  reload: () => {},
});

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [staff, setStaff] = useState<MyClinicStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    getMyClinicStaff()
      .then((data) => {
        if (cancelled) return;
        setStaff(data);
        setError(data ? null : "Your account isn't linked to a clinic yet. Contact your administrator.");
      })
      .catch(() => !cancelled && setError("Something went wrong. Please try again."))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [session, reloadKey]);

  // Derived rather than reset via a synchronous effect: with no session
  // there's nothing to load and no staff record to show.
  return (
    <ClinicContext.Provider
      value={{
        staff: session ? staff : null,
        isLoading: session ? isLoading : false,
        error,
        reload: () => setReloadKey((k) => k + 1),
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  return useContext(ClinicContext);
}
