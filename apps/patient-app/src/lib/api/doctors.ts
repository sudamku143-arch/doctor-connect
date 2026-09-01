import type { Clinic, Doctor, Specialty } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";
import type { DoctorListItem } from "./types";

export type DoctorSort = "recommended" | "highestRated" | "lowestFee";

export interface DoctorSearchFilters {
  query?: string;
  specialtyId?: string;
  availableToday?: boolean;
  availableThisWeek?: boolean;
  sort?: DoctorSort;
}

interface DoctorClinicRow {
  id: string;
  consultation_fee: number;
  is_active: boolean;
  doctor: Doctor;
  clinic: Clinic;
}

export async function searchDoctors(filters: DoctorSearchFilters = {}): Promise<DoctorListItem[]> {
  let doctorIdsForSpecialty: string[] | null = null;
  if (filters.specialtyId) {
    const { data, error } = await supabase
      .from("doctor_specialties")
      .select("doctor_id")
      .eq("specialty_id", filters.specialtyId);
    if (error) throw error;
    doctorIdsForSpecialty = (data ?? []).map((row) => row.doctor_id);
    if (doctorIdsForSpecialty.length === 0) return [];
  }

  let query = supabase
    .from("doctor_clinics")
    .select("id, consultation_fee, is_active, doctor:doctors!inner(*), clinic:clinics!inner(*)")
    .eq("is_active", true)
    .eq("doctor.verification_status", "VERIFIED")
    .eq("clinic.verification_status", "VERIFIED");

  if (doctorIdsForSpecialty) {
    query = query.in("doctor_id", doctorIdsForSpecialty);
  }

  const { data: rows, error } = await query.returns<DoctorClinicRow[]>();
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const doctorIds = rows.map((row) => row.doctor.id);
  const doctorClinicIds = rows.map((row) => row.id);

  const [specialtiesByDoctor, ratingsByDoctor, nextAvailableByDoctorClinic] = await Promise.all([
    fetchSpecialtiesForDoctors(doctorIds),
    fetchRatingsForDoctors(doctorIds),
    fetchNextAvailableForDoctorClinics(doctorClinicIds),
  ]);

  let items: DoctorListItem[] = rows.map((row) => ({
    doctorClinicId: row.id,
    doctor: row.doctor,
    clinic: row.clinic,
    specialties: specialtiesByDoctor.get(row.doctor.id) ?? [],
    consultationFee: row.consultation_fee,
    averageRating: ratingsByDoctor.get(row.doctor.id)?.average_rating ?? null,
    reviewCount: ratingsByDoctor.get(row.doctor.id)?.review_count ?? 0,
    nextAvailable: nextAvailableByDoctorClinic.get(row.id) ?? null,
  }));

  if (filters.query?.trim()) {
    const needle = filters.query.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.doctor.full_name.toLowerCase().includes(needle) ||
        item.clinic.name.toLowerCase().includes(needle) ||
        item.specialties.some((specialty) => specialty.name.toLowerCase().includes(needle)),
    );
  }

  if (filters.availableToday || filters.availableThisWeek) {
    const today = new Date();
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + (filters.availableToday ? 0 : 6));
    const todayStr = toDateString(today);
    const horizonStr = toDateString(horizon);
    items = items.filter((item) => {
      if (!item.nextAvailable) return false;
      if (filters.availableToday) return item.nextAvailable.date === todayStr;
      return item.nextAvailable.date >= todayStr && item.nextAvailable.date <= horizonStr;
    });
  }

  const sort = filters.sort ?? "recommended";
  items.sort((a, b) => {
    if (sort === "lowestFee") return a.consultationFee - b.consultationFee;
    if (sort === "highestRated") return (b.averageRating ?? -1) - (a.averageRating ?? -1);
    // "recommended": verified rating first, then experience.
    return (b.averageRating ?? -1) - (a.averageRating ?? -1) || b.doctor.experience_years - a.doctor.experience_years;
  });

  return items;
}

export async function getDoctorProfile(doctorClinicId: string): Promise<DoctorListItem | null> {
  const { data: row, error } = await supabase
    .from("doctor_clinics")
    .select("id, consultation_fee, is_active, doctor:doctors!inner(*), clinic:clinics!inner(*)")
    .eq("id", doctorClinicId)
    .maybeSingle<DoctorClinicRow>();
  if (error) throw error;
  if (!row) return null;

  const [specialtiesByDoctor, ratingsByDoctor, nextAvailableByDoctorClinic] = await Promise.all([
    fetchSpecialtiesForDoctors([row.doctor.id]),
    fetchRatingsForDoctors([row.doctor.id]),
    fetchNextAvailableForDoctorClinics([row.id]),
  ]);

  return {
    doctorClinicId: row.id,
    doctor: row.doctor,
    clinic: row.clinic,
    specialties: specialtiesByDoctor.get(row.doctor.id) ?? [],
    consultationFee: row.consultation_fee,
    averageRating: ratingsByDoctor.get(row.doctor.id)?.average_rating ?? null,
    reviewCount: ratingsByDoctor.get(row.doctor.id)?.review_count ?? 0,
    nextAvailable: nextAvailableByDoctorClinic.get(row.id) ?? null,
  };
}

export async function listTopDoctors(limit = 5): Promise<DoctorListItem[]> {
  const items = await searchDoctors({ sort: "highestRated" });
  return items.slice(0, limit);
}

export async function getDoctorClinicId(doctorId: string, clinicId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("doctor_clinics")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinicId)
    .maybeSingle<{ id: string }>();
  if (error) throw error;
  return data?.id ?? null;
}

async function fetchSpecialtiesForDoctors(doctorIds: string[]): Promise<Map<string, Specialty[]>> {
  if (doctorIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("doctor_specialties")
    .select("doctor_id, specialty:specialties(*)")
    .in("doctor_id", doctorIds)
    .returns<{ doctor_id: string; specialty: Specialty }[]>();
  if (error) throw error;

  const map = new Map<string, Specialty[]>();
  for (const row of data ?? []) {
    const list = map.get(row.doctor_id) ?? [];
    list.push(row.specialty);
    map.set(row.doctor_id, list);
  }
  return map;
}

async function fetchRatingsForDoctors(
  doctorIds: string[],
): Promise<Map<string, { average_rating: number | null; review_count: number }>> {
  if (doctorIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("doctor_ratings")
    .select("doctor_id, average_rating, review_count")
    .in("doctor_id", doctorIds);
  if (error) throw error;

  const map = new Map<string, { average_rating: number | null; review_count: number }>();
  for (const row of data ?? []) {
    map.set(row.doctor_id, { average_rating: row.average_rating, review_count: row.review_count });
  }
  return map;
}

async function fetchNextAvailableForDoctorClinics(
  doctorClinicIds: string[],
): Promise<Map<string, { date: string; startTime: string }>> {
  if (doctorClinicIds.length === 0) return new Map();
  const todayStr = toDateString(new Date());
  const { data, error } = await supabase
    .from("appointment_slots")
    .select("doctor_clinic_id, date, start_time")
    .in("doctor_clinic_id", doctorClinicIds)
    .eq("status", "OPEN")
    .gte("date", todayStr)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;

  const map = new Map<string, { date: string; startTime: string }>();
  for (const row of data ?? []) {
    if (!map.has(row.doctor_clinic_id)) {
      map.set(row.doctor_clinic_id, { date: row.date, startTime: row.start_time });
    }
  }
  return map;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
