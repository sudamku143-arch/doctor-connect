import type { Clinic } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export interface ClinicWithSpecialties extends Clinic {
  specialtyNames: string[];
}

export async function listNearbyClinics(limit = 5, city?: string | null): Promise<Clinic[]> {
  let query = supabase.from("clinics").select("*").eq("verification_status", "VERIFIED");
  if (city) query = query.eq("city", city);
  const { data, error } = await query.order("name").limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listNearbyClinicsWithSpecialties(
  limit = 5,
  city?: string | null,
): Promise<ClinicWithSpecialties[]> {
  const clinics = await listNearbyClinics(limit, city);
  if (clinics.length === 0) return [];

  const clinicIds = clinics.map((c) => c.id);
  const { data, error } = await supabase
    .from("doctor_clinics")
    .select("clinic_id, doctor:doctors(doctor_specialties(specialty:specialties(name)))")
    .in("clinic_id", clinicIds)
    .eq("is_active", true)
    .returns<{ clinic_id: string; doctor: { doctor_specialties: { specialty: { name: string } }[] } | null }[]>();
  if (error) throw error;

  const namesByClinic = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = namesByClinic.get(row.clinic_id) ?? new Set<string>();
    for (const ds of row.doctor?.doctor_specialties ?? []) {
      if (ds.specialty?.name) set.add(ds.specialty.name);
    }
    namesByClinic.set(row.clinic_id, set);
  }

  return clinics.map((clinic) => ({
    ...clinic,
    specialtyNames: Array.from(namesByClinic.get(clinic.id) ?? []).slice(0, 3),
  }));
}

export async function getClinicById(clinicId: string): Promise<ClinicWithSpecialties | null> {
  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .maybeSingle<Clinic>();
  if (error) throw error;
  if (!clinic) return null;

  const { data, error: specialtiesError } = await supabase
    .from("doctor_clinics")
    .select("doctor:doctors(doctor_specialties(specialty:specialties(name)))")
    .eq("clinic_id", clinicId)
    .eq("is_active", true)
    .returns<{ doctor: { doctor_specialties: { specialty: { name: string } }[] } | null }[]>();
  if (specialtiesError) throw specialtiesError;

  const names = new Set<string>();
  for (const row of data ?? []) {
    for (const ds of row.doctor?.doctor_specialties ?? []) {
      if (ds.specialty?.name) names.add(ds.specialty.name);
    }
  }

  return { ...clinic, specialtyNames: Array.from(names) };
}

// Real, city-agnostic — reads from the actual clinics.city column rather
// than a hardcoded list, so it scales automatically as more cities launch
// beyond Berhampur.
export async function getAvailableCities(): Promise<string[]> {
  const { data, error } = await supabase.from("clinics").select("city").eq("verification_status", "VERIFIED");
  if (error) throw error;
  const cities = Array.from(new Set((data ?? []).map((row) => row.city).filter(Boolean)));
  return cities.sort();
}
