import { supabase } from "@/lib/supabase/client";
import { todayDateString } from "@/lib/format";

export async function countTodayAppointments(clinicId: string): Promise<number> {
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("appointment_date", todayDateString());
  if (error) throw error;
  return count ?? 0;
}

// Distinct-patient count has no single-query PostgREST equivalent, but a
// clinic's monthly appointment volume is small enough that fetching just
// the patient_id column and de-duplicating client-side is cheap.
export async function countUniquePatientsThisMonth(clinicId: string): Promise<number> {
  const startOfMonth = `${todayDateString().slice(0, 7)}-01`;
  const { data, error } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("clinic_id", clinicId)
    .gte("appointment_date", startOfMonth);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.patient_id as string)).size;
}

export async function countPendingReschedules(clinicId: string): Promise<number> {
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("status", "RESCHEDULE_REQUESTED");
  if (error) throw error;
  return count ?? 0;
}

export interface ClinicRating {
  average: number | null;
  count: number;
}

// reviews has no clinic_id of its own — it's scoped to the clinic through
// the appointment it was left on (reviews are publicly readable when not
// hidden, and appointments are readable by the clinic's own staff, so this
// embedded filter resolves under RLS with no new policy needed).
export async function getClinicRating(clinicId: string): Promise<ClinicRating> {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating, appointment:appointments!inner(clinic_id)")
    .eq("appointment.clinic_id", clinicId)
    .eq("is_hidden", false);
  if (error) throw error;
  const rows = (data ?? []) as { rating: number }[];
  if (rows.length === 0) return { average: null, count: 0 };
  const total = rows.reduce((sum, row) => sum + row.rating, 0);
  return { average: Math.round((total / rows.length) * 10) / 10, count: rows.length };
}
