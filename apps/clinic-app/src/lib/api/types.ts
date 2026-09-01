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
