import { createClient } from "@/lib/supabase/server";
import type { Appointment, AppointmentStatus, Clinic, Doctor, Profile } from "@doctor-connect/types";

export interface AdminAppointmentFilters {
  doctorId?: string;
  clinicId?: string;
  patientId?: string;
  date?: string;
  status?: AppointmentStatus;
}

interface AppointmentRow extends Appointment {
  doctor: Doctor;
  clinic: Clinic;
  patient: { profile: Profile | null } | null;
}

export interface AdminAppointment extends Appointment {
  doctor: Doctor;
  clinic: Clinic;
  patientProfile: Profile | null;
}

const SELECT = "*, doctor:doctors(*), clinic:clinics(*), patient:patients(profile:profiles(*))";

function toAdminAppointment(row: AppointmentRow): AdminAppointment {
  const { patient, ...rest } = row;
  return { ...rest, patientProfile: patient?.profile ?? null };
}

export async function listAppointments(filters: AdminAppointmentFilters = {}): Promise<AdminAppointment[]> {
  const supabase = await createClient();
  let query = supabase.from("appointments").select(SELECT).order("appointment_date", { ascending: false }).limit(100);

  if (filters.doctorId) query = query.eq("doctor_id", filters.doctorId);
  if (filters.clinicId) query = query.eq("clinic_id", filters.clinicId);
  if (filters.patientId) query = query.eq("patient_id", filters.patientId);
  if (filters.date) query = query.eq("appointment_date", filters.date);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query.returns<AppointmentRow[]>();
  if (error) throw error;
  return (data ?? []).map(toAdminAppointment);
}

export async function getAppointment(id: string): Promise<AdminAppointment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("appointments").select(SELECT).eq("id", id).maybeSingle<AppointmentRow>();
  if (error) throw error;
  return data ? toAdminAppointment(data) : null;
}

export async function getPaymentForAppointment(appointmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payments").select("*").eq("appointment_id", appointmentId).maybeSingle();
  if (error) throw error;
  return data;
}
