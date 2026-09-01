import { createClient } from "@/lib/supabase/server";
import type { Appointment, Clinic, Doctor, Patient, Profile } from "@doctor-connect/types";

export interface PatientRow extends Patient {
  profile: Profile;
}

export async function searchPatients(query: string): Promise<PatientRow[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*, profile:profiles!inner(*)")
    .or(`full_name.ilike.%${query.trim()}%,phone.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`, { foreignTable: "profiles" })
    .limit(30)
    .returns<PatientRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getPatient(id: string): Promise<PatientRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("patients").select("*, profile:profiles(*)").eq("id", id).maybeSingle<PatientRow>();
  if (error) throw error;
  return data;
}

interface AppointmentRow extends Appointment {
  doctor: Doctor;
  clinic: Clinic;
}

export async function getPatientAppointments(patientId: string): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, doctor:doctors(*), clinic:clinics(*)")
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false })
    .returns<AppointmentRow[]>();
  if (error) throw error;
  return data ?? [];
}
