import { createClient } from "@/lib/supabase/server";
import type { Appointment, Clinic, Doctor } from "@doctor-connect/types";

export interface DashboardStats {
  totalDoctors: number;
  totalClinics: number;
  totalPatients: number;
  todaysAppointments: number;
  totalBookings: number;
  totalRevenue: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [doctors, clinics, patients, todays, bookings, payments] = await Promise.all([
    supabase.from("doctors").select("*", { count: "exact", head: true }),
    supabase.from("clinics").select("*", { count: "exact", head: true }),
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("amount").eq("status", "SUCCESS"),
  ]);

  const totalRevenue = (payments.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return {
    totalDoctors: doctors.count ?? 0,
    totalClinics: clinics.count ?? 0,
    totalPatients: patients.count ?? 0,
    todaysAppointments: todays.count ?? 0,
    totalBookings: bookings.count ?? 0,
    totalRevenue,
  };
}

export interface DayCount {
  date: string;
  count: number;
}

async function countByDay(days: number): Promise<DayCount[]> {
  const supabase = await createClient();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromStr = from.toISOString().slice(0, 10);

  const { data, error } = await supabase.from("appointments").select("appointment_date").gte("appointment_date", fromStr);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const day = row.appointment_date.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, count: counts.get(dateStr) ?? 0 };
  });
}

export async function getAppointmentsByDay(days = 14): Promise<DayCount[]> {
  return countByDay(days);
}

export async function getBookingsByDay(days = 14): Promise<DayCount[]> {
  return countByDay(days);
}

export interface DayAmount {
  date: string;
  amount: number;
}

export async function getRevenueByDay(days = 14): Promise<DayAmount[]> {
  const supabase = await createClient();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromStr = from.toISOString().slice(0, 10);

  const { data, error } = await supabase.from("payments").select("amount, created_at").eq("status", "SUCCESS").gte("created_at", fromStr);
  if (error) throw error;

  const amounts = new Map<string, number>();
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    amounts.set(day, (amounts.get(day) ?? 0) + Number(row.amount));
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, amount: amounts.get(dateStr) ?? 0 };
  });
}

export interface MonthCount {
  month: string;
  count: number;
}

async function countByMonth(
  table: "profiles" | "doctors" | "clinics",
  months: number,
  roleFilter?: string,
): Promise<MonthCount[]> {
  const supabase = await createClient();
  const from = new Date();
  from.setMonth(from.getMonth() - (months - 1), 1);
  const fromStr = from.toISOString().slice(0, 10);

  let query = supabase.from(table).select("created_at").gte("created_at", fromStr);
  if (roleFilter) query = query.eq("role", roleFilter);
  const { data, error } = await query;
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = (row as { created_at: string }).created_at.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: months }, (_, i) => {
    const d = new Date(from);
    d.setMonth(d.getMonth() + i);
    const key = d.toISOString().slice(0, 7);
    return { month: key, count: counts.get(key) ?? 0 };
  });
}

export async function getNewPatientsByMonth(months = 6): Promise<MonthCount[]> {
  return countByMonth("profiles", months, "PATIENT");
}

export async function getDoctorGrowthByMonth(months = 6): Promise<MonthCount[]> {
  return countByMonth("doctors", months);
}

export async function getClinicGrowthByMonth(months = 6): Promise<MonthCount[]> {
  return countByMonth("clinics", months);
}

interface RecentAppointmentRow extends Appointment {
  doctor: Doctor;
  clinic: Clinic;
  patient: { profile: { full_name: string } | null } | null;
}

export async function getRecentAppointments(limit = 10): Promise<RecentAppointmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, doctor:doctors(*), clinic:clinics(*), patient:patients(profile:profiles(full_name))")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RecentAppointmentRow[]>();
  if (error) throw error;
  return data ?? [];
}
