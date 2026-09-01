import type { Appointment, Doctor, Profile } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";
import type { ClinicAppointment } from "./types";

export type AppointmentBucket = "today" | "upcoming" | "completed" | "cancelled";

const CANCELLED_STATUSES = ["CANCELLED_BY_PATIENT", "CANCELLED_BY_CLINIC", "NO_SHOW", "REFUND_PENDING", "REFUNDED"];
const NON_TERMINAL_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "CHECKED_IN",
  "WAITING",
  "IN_CONSULTATION",
];

const APPOINTMENT_SELECT = "*, doctor:doctors(*), patient:patients(profile:profiles(*))";

interface AppointmentRow extends Appointment {
  doctor: Doctor;
  patient: { profile: Profile | null } | null;
}

function toClinicAppointment(row: AppointmentRow): ClinicAppointment {
  const { patient, ...rest } = row;
  return { ...rest, patientProfile: patient?.profile ?? null };
}

export async function listClinicAppointments(
  clinicId: string,
  bucket: AppointmentBucket,
  filters: { doctorId?: string; date?: string } = {},
): Promise<ClinicAppointment[]> {
  let query = supabase.from("appointments").select(APPOINTMENT_SELECT).eq("clinic_id", clinicId);

  const todayStr = new Date().toISOString().slice(0, 10);
  if (bucket === "today") {
    query = query.eq("appointment_date", todayStr).order("appointment_time", { ascending: true });
  } else if (bucket === "upcoming") {
    query = query
      .gt("appointment_date", todayStr)
      .in("status", NON_TERMINAL_STATUSES)
      .order("appointment_date", { ascending: true });
  } else if (bucket === "completed") {
    query = query.eq("status", "COMPLETED").order("appointment_date", { ascending: false });
  } else {
    query = query.in("status", CANCELLED_STATUSES).order("appointment_date", { ascending: false });
  }

  if (filters.doctorId) query = query.eq("doctor_id", filters.doctorId);
  if (filters.date) query = query.eq("appointment_date", filters.date);

  const { data, error } = await query.returns<AppointmentRow[]>();
  if (error) throw error;
  return (data ?? []).map(toClinicAppointment);
}

export async function getClinicAppointmentDetails(id: string): Promise<ClinicAppointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .maybeSingle<AppointmentRow>();
  if (error) throw error;
  return data ? toClinicAppointment(data) : null;
}

export async function checkinAppointment(appointmentId: string): Promise<Appointment> {
  const { data, error } = await supabase.rpc("checkin_appointment", { p_appointment_id: appointmentId }).single<Appointment>();
  if (error) throw error;
  return data;
}

export async function completeConsultation(appointmentId: string): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc("complete_consultation", { p_appointment_id: appointmentId })
    .single<Appointment>();
  if (error) throw error;
  return data;
}

export async function markNoShow(appointmentId: string): Promise<Appointment> {
  const { data, error } = await supabase.rpc("mark_no_show", { p_appointment_id: appointmentId }).single<Appointment>();
  if (error) throw error;
  return data;
}

export async function cancelAppointmentByClinic(appointmentId: string, reason?: string): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc("cancel_appointment_by_clinic", { p_appointment_id: appointmentId, p_reason: reason ?? null })
    .single<Appointment>();
  if (error) throw error;
  return data;
}

export async function requestRescheduleByClinic(appointmentId: string): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc("request_reschedule_by_clinic", { p_appointment_id: appointmentId })
    .single<Appointment>();
  if (error) throw error;
  return data;
}

export async function notifyPatientDoctorUnavailable(appointmentId: string): Promise<void> {
  const { error } = await supabase.rpc("notify_patient_doctor_unavailable", { p_appointment_id: appointmentId });
  if (error) throw error;
}
