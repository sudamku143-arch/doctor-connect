import { createClient } from "@/lib/supabase/server";
import type { Clinic, VerificationStatus } from "@doctor-connect/types";

export async function listClinics(filters: { status?: VerificationStatus; query?: string } = {}): Promise<Clinic[]> {
  const supabase = await createClient();
  let query = supabase.from("clinics").select("*").order("created_at", { ascending: false });
  if (filters.status) query = query.eq("verification_status", filters.status);
  if (filters.query) query = query.ilike("name", `%${filters.query}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getClinic(id: string): Promise<Clinic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clinics").select("*").eq("id", id).maybeSingle<Clinic>();
  if (error) throw error;
  return data;
}

export interface ClinicDoctorRow {
  doctorClinicId: string;
  doctorId: string;
  fullName: string;
  qualification: string;
  consultationFee: number;
}

export async function listClinicDoctorAssignments(clinicId: string): Promise<ClinicDoctorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctor_clinics")
    .select("id, consultation_fee, doctor:doctors(id, full_name, qualification)")
    .eq("clinic_id", clinicId)
    .returns<{ id: string; consultation_fee: number; doctor: { id: string; full_name: string; qualification: string } }[]>();
  if (error) throw error;
  return (data ?? []).map((row) => ({
    doctorClinicId: row.id,
    doctorId: row.doctor.id,
    fullName: row.doctor.full_name,
    qualification: row.doctor.qualification,
    consultationFee: row.consultation_fee,
  }));
}
