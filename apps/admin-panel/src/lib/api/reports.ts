import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus, Clinic, Doctor } from "@doctor-connect/types";

const CANCELLED_STATUSES: AppointmentStatus[] = ["CANCELLED_BY_PATIENT", "CANCELLED_BY_CLINIC"];

export interface ReportSummary {
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  cancellationRate: number;
  noShowRate: number;
  revenue: number;
}

interface AppointmentForReport {
  id: string;
  status: AppointmentStatus;
  doctor_id: string;
  clinic_id: string;
  doctor: Doctor;
  clinic: Clinic;
}

async function fetchAppointmentsInRange(fromDate: string, toDate: string): Promise<AppointmentForReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, status, doctor_id, clinic_id, doctor:doctors(*), clinic:clinics(*)")
    .gte("appointment_date", fromDate)
    .lte("appointment_date", toDate)
    .returns<AppointmentForReport[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getReportSummary(fromDate: string, toDate: string): Promise<ReportSummary> {
  const supabase = await createClient();
  const appointments = await fetchAppointmentsInRange(fromDate, toDate);

  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledCount = appointments.filter((a) => CANCELLED_STATUSES.includes(a.status)).length;
  const noShowCount = appointments.filter((a) => a.status === "NO_SHOW").length;
  const total = appointments.length;

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount, created_at")
    .eq("status", "SUCCESS")
    .gte("created_at", fromDate)
    .lte("created_at", toDate);
  if (paymentsError) throw paymentsError;
  const revenue = (payments ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return {
    totalAppointments: total,
    completedCount,
    cancelledCount,
    noShowCount,
    cancellationRate: total > 0 ? Math.round((cancelledCount / total) * 1000) / 10 : 0,
    noShowRate: total > 0 ? Math.round((noShowCount / total) * 1000) / 10 : 0,
    revenue,
  };
}

export interface PerformanceRow {
  id: string;
  name: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export async function getDoctorPerformance(fromDate: string, toDate: string): Promise<PerformanceRow[]> {
  const appointments = await fetchAppointmentsInRange(fromDate, toDate);
  const byDoctor = new Map<string, PerformanceRow>();
  for (const a of appointments) {
    const row = byDoctor.get(a.doctor_id) ?? { id: a.doctor_id, name: a.doctor.full_name, total: 0, completed: 0, cancelled: 0, noShow: 0 };
    row.total += 1;
    if (a.status === "COMPLETED") row.completed += 1;
    if (CANCELLED_STATUSES.includes(a.status)) row.cancelled += 1;
    if (a.status === "NO_SHOW") row.noShow += 1;
    byDoctor.set(a.doctor_id, row);
  }
  return Array.from(byDoctor.values()).sort((a, b) => b.total - a.total);
}

export async function getClinicPerformance(fromDate: string, toDate: string): Promise<PerformanceRow[]> {
  const appointments = await fetchAppointmentsInRange(fromDate, toDate);
  const byClinic = new Map<string, PerformanceRow>();
  for (const a of appointments) {
    const row = byClinic.get(a.clinic_id) ?? { id: a.clinic_id, name: a.clinic.name, total: 0, completed: 0, cancelled: 0, noShow: 0 };
    row.total += 1;
    if (a.status === "COMPLETED") row.completed += 1;
    if (CANCELLED_STATUSES.includes(a.status)) row.cancelled += 1;
    if (a.status === "NO_SHOW") row.noShow += 1;
    byClinic.set(a.clinic_id, row);
  }
  return Array.from(byClinic.values()).sort((a, b) => b.total - a.total);
}
