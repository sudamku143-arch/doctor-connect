import type { Appointment, Clinic, Doctor, Specialty } from "@doctor-connect/types";

// View-model shapes composed from joined Supabase queries — not raw table
// rows. Kept alongside the api/ layer that produces them rather than in the
// shared types package, since they're patient-app screen-shape specific.

export interface DoctorListItem {
  doctorClinicId: string;
  doctor: Doctor;
  clinic: Clinic;
  specialties: Specialty[];
  consultationFee: number;
  averageRating: number | null;
  reviewCount: number;
  nextAvailable: { date: string; startTime: string } | null;
}

export interface AppointmentWithDetails extends Appointment {
  doctor: Doctor;
  clinic: Clinic;
}
