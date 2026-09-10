import type { AppointmentSlot, Clinic, ConsultationType, Doctor } from "@doctor-connect/types";
import type { PatientDetailsInput } from "@doctor-connect/validation";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface BookingDraft {
  doctorClinicId: string;
  doctor: Doctor;
  clinic: Clinic;
  consultationFee: number;
  averageRating: number | null;
  reviewCount: number;
  consultationType: ConsultationType;
  slot: AppointmentSlot | null;
  patientDetails: PatientDetailsInput | null;
  familyMemberId: string | null;
  familyMemberName: string | null;
}

interface BookingDraftContextValue {
  draft: Partial<BookingDraft>;
  setDoctorContext: (context: {
    doctorClinicId: string;
    doctor: Doctor;
    clinic: Clinic;
    consultationFee: number;
    averageRating: number | null;
    reviewCount: number;
  }) => void;
  setConsultationType: (consultationType: ConsultationType) => void;
  setSlot: (slot: AppointmentSlot) => void;
  setPatientDetails: (input: {
    patientDetails: PatientDetailsInput;
    familyMemberId: string | null;
    familyMemberName: string | null;
  }) => void;
}

const BookingDraftContext = createContext<BookingDraftContextValue | null>(null);

export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Partial<BookingDraft>>({});

  const value = useMemo<BookingDraftContextValue>(
    () => ({
      draft,
      setDoctorContext: (context) => setDraft((prev) => ({ ...prev, ...context })),
      setConsultationType: (consultationType) => setDraft((prev) => ({ ...prev, consultationType })),
      setSlot: (slot) => setDraft((prev) => ({ ...prev, slot })),
      setPatientDetails: (input) => setDraft((prev) => ({ ...prev, ...input })),
    }),
    [draft],
  );

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

export function useBookingDraft() {
  const context = useContext(BookingDraftContext);
  if (!context) throw new Error("useBookingDraft must be used within a BookingDraftProvider");
  return context;
}
