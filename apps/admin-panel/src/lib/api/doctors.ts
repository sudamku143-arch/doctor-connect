import { createClient } from "@/lib/supabase/server";
import type { Clinic, Doctor, Specialty, VerificationStatus } from "@doctor-connect/types";

export interface DoctorWithSpecialties extends Doctor {
  specialties: Specialty[];
}

interface DoctorSpecialtyRow {
  doctor_id: string;
  specialty: Specialty;
}

export async function listDoctors(filters: { status?: VerificationStatus; query?: string } = {}): Promise<DoctorWithSpecialties[]> {
  const supabase = await createClient();
  let query = supabase.from("doctors").select("*").order("created_at", { ascending: false });
  if (filters.status) query = query.eq("verification_status", filters.status);
  if (filters.query) query = query.ilike("full_name", `%${filters.query}%`);

  const { data: doctors, error } = await query.returns<Doctor[]>();
  if (error) throw error;
  if (!doctors || doctors.length === 0) return [];

  const { data: links, error: linksError } = await supabase
    .from("doctor_specialties")
    .select("doctor_id, specialty:specialties(*)")
    .in(
      "doctor_id",
      doctors.map((d) => d.id),
    )
    .returns<DoctorSpecialtyRow[]>();
  if (linksError) throw linksError;

  const specialtiesByDoctor = new Map<string, Specialty[]>();
  for (const link of links ?? []) {
    const list = specialtiesByDoctor.get(link.doctor_id) ?? [];
    list.push(link.specialty);
    specialtiesByDoctor.set(link.doctor_id, list);
  }

  return doctors.map((doctor) => ({ ...doctor, specialties: specialtiesByDoctor.get(doctor.id) ?? [] }));
}

export async function getDoctor(id: string): Promise<DoctorWithSpecialties | null> {
  const supabase = await createClient();
  const { data: doctor, error } = await supabase.from("doctors").select("*").eq("id", id).maybeSingle<Doctor>();
  if (error) throw error;
  if (!doctor) return null;

  const { data: links, error: linksError } = await supabase
    .from("doctor_specialties")
    .select("doctor_id, specialty:specialties(*)")
    .eq("doctor_id", id)
    .returns<DoctorSpecialtyRow[]>();
  if (linksError) throw linksError;

  return { ...doctor, specialties: (links ?? []).map((l) => l.specialty) };
}

export async function listAllSpecialties(): Promise<Specialty[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("specialties").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export interface DoctorClinicAssignment {
  id: string;
  clinic: Clinic;
  consultation_fee: number;
  is_active: boolean;
}

export async function listDoctorClinics(doctorId: string): Promise<DoctorClinicAssignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctor_clinics")
    .select("id, consultation_fee, is_active, clinic:clinics(*)")
    .eq("doctor_id", doctorId)
    .returns<DoctorClinicAssignment[]>();
  if (error) throw error;
  return data ?? [];
}
