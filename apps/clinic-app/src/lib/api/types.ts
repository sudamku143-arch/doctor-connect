import type { Appointment, Doctor, Profile } from "@doctor-connect/types";

// View-model shapes composed from joined Supabase queries — kept alongside
// the api/ layer that produces them, same pattern as the patient app.

export interface ClinicDoctor {
  doctorClinicId: string;
  doctor: Doctor;
  consultationFee: number;
}

export interface ClinicAppointment extends Appointment {
  doctor: Doctor;
  patientProfile: Profile | null;
}

// Minimal identifying fields returned by find_patients_for_booking — never
// the full patient record, since this lookup intentionally bypasses the
// "patient has history at this clinic" RLS restriction (see 0014).
export interface BookingPatientMatch {
  patient_id: string;
  full_name: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
}
