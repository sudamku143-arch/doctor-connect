import type { Appointment, Doctor, Patient, Profile } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";
import type { ClinicAppointment } from "./types";

export interface PatientSearchResult extends Patient {
  profile: Profile;
}

interface PatientRow extends Patient {
  profile: Profile;
}

// RLS (profiles_clinic_staff_select / patients_clinic_staff_select) already
// scopes results to patients with an appointment at this clinic — no need to
// filter by clinic_id again here.
export async function searchPatients(query: string): Promise<PatientSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("patients")
    .select("*, profile:profiles!inner(*)")
    .or(`full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`, { foreignTable: "profiles" })
    .limit(20)
    .returns<PatientRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getPatient(patientId: string): Promise<PatientSearchResult | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*, profile:profiles(*)")
    .eq("id", patientId)
    .maybeSingle<PatientRow>();
  if (error) throw error;
  return data;
}

export async function getPatientByAppointmentId(appointmentId: string): Promise<PatientSearchResult | null> {
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("id", appointmentId)
    .maybeSingle<{ patient_id: string }>();
  if (appointmentError) throw appointmentError;
  if (!appointment) return null;

  const { data, error } = await supabase
    .from("patients")
    .select("*, profile:profiles(*)")
    .eq("id", appointment.patient_id)
    .maybeSingle<PatientRow>();
  if (error) throw error;
  return data;
}

interface AppointmentRow extends Appointment {
  doctor: Doctor;
}

export async function getPatientHistoryAtClinic(patientId: string, clinicId: string): Promise<ClinicAppointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, doctor:doctors(*)")
    .eq("patient_id", patientId)
    .eq("clinic_id", clinicId)
    .order("appointment_date", { ascending: false })
    .returns<AppointmentRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, patientProfile: null }));
}
