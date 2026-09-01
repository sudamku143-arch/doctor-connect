import type { Appointment, AppointmentStatus, Clinic, Doctor } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";
import type { AppointmentWithDetails } from "./types";

const UPCOMING_STATUSES: AppointmentStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "CHECKED_IN",
  "WAITING",
  "IN_CONSULTATION",
];
const CANCELLED_STATUSES: AppointmentStatus[] = [
  "CANCELLED_BY_PATIENT",
  "CANCELLED_BY_CLINIC",
  "NO_SHOW",
  "REFUND_PENDING",
  "REFUNDED",
];

export type AppointmentBucket = "upcoming" | "completed" | "cancelled";

interface AppointmentRow extends Appointment {
  doctor: Doctor;
  clinic: Clinic;
}

const APPOINTMENT_SELECT = "*, doctor:doctors(*), clinic:clinics(*)";

export async function bookAppointment(input: {
  slotId: string;
  reason: string;
  familyMemberId?: string | null;
}): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc("book_appointment", {
      p_slot_id: input.slotId,
      p_reason: input.reason,
      p_family_member_id: input.familyMemberId ?? null,
    })
    .single<Appointment>();
  if (error) throw error;
  return data;
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc("cancel_appointment", { p_appointment_id: appointmentId })
    .single<Appointment>();
  if (error) throw error;
  return data;
}

export async function listMyAppointments(bucket: AppointmentBucket): Promise<AppointmentWithDetails[]> {
  let query = supabase.from("appointments").select(APPOINTMENT_SELECT);

  if (bucket === "upcoming") {
    query = query.in("status", UPCOMING_STATUSES).order("appointment_date", { ascending: true });
  } else if (bucket === "completed") {
    query = query.eq("status", "COMPLETED").order("appointment_date", { ascending: false });
  } else {
    query = query.in("status", CANCELLED_STATUSES).order("appointment_date", { ascending: false });
  }

  const { data, error } = await query.returns<AppointmentRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getAppointmentDetails(id: string): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .maybeSingle<AppointmentRow>();
  if (error) throw error;
  return data;
}

export async function getNextUpcomingAppointment(): Promise<AppointmentWithDetails | null> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .in("status", UPCOMING_STATUSES)
    .gte("appointment_date", todayStr)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(1)
    .maybeSingle<AppointmentRow>();
  if (error) throw error;
  return data;
}
