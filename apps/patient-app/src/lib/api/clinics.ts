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

export interface LocationMatch {
  city: string;
  /** The clinic address that matched an area/pincode query; null when the
   * city name itself matched. */
  area: string | null;
}

// Area/pincode lookup for the location picker. There's no separate
// areas/pincodes table, so this searches the real clinic addresses (which
// carry the locality and PIN) and cities, and returns which city each hit
// belongs to — selecting it then filters by that city as usual.
export async function searchLocations(query: string): Promise<LocationMatch[]> {
  // Strip anything that would break PostgREST's or() filter syntax.
  const q = query.replace(/[^\p{L}\p{N} -]/gu, "").trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from("clinics")
    .select("city, address")
    .eq("verification_status", "VERIFIED")
    .or(`city.ilike.%${q}%,address.ilike.%${q}%`)
    .limit(20);
  if (error) throw error;

  const seen = new Set<string>();
  const matches: LocationMatch[] = [];
  const cityMatches = q.toLowerCase();
  for (const row of data ?? []) {
    const area = row.city.toLowerCase().includes(cityMatches) ? null : row.address;
    const key = `${row.city}|${area ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push({ city: row.city, area });
  }
  return matches;
}

export interface ClinicCoordinates {
  city: string;
  latitude: number;
  longitude: number;
}

// Clinic coordinates for the "Use current location" fallback: when GPS
// reverse-geocoding returns a locality name that isn't a city we serve
// (e.g. a suburb), the nearest clinic's city is the next best answer.
export async function listClinicCoordinates(): Promise<ClinicCoordinates[]> {
  const { data, error } = await supabase
    .from("clinics")
    .select("city, latitude, longitude")
    .eq("verification_status", "VERIFIED")
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  if (error) throw error;
  return (data ?? []) as ClinicCoordinates[];
}
