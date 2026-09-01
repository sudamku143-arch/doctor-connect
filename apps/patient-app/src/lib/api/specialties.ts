import type { Specialty } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export interface SpecialtyWithCount extends Specialty {
  doctorCount: number;
}

export async function listSpecialties(): Promise<SpecialtyWithCount[]> {
  const [{ data: specialties, error: specialtiesError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from("specialties").select("*").order("name"),
    supabase
      .from("doctor_specialties")
      .select("specialty_id, doctor:doctors!inner(verification_status)")
      .eq("doctor.verification_status", "VERIFIED"),
  ]);
  if (specialtiesError) throw specialtiesError;
  if (linksError) throw linksError;

  const counts = new Map<string, number>();
  for (const link of links ?? []) {
    counts.set(link.specialty_id, (counts.get(link.specialty_id) ?? 0) + 1);
  }

  return (specialties ?? []).map((specialty) => ({
    ...specialty,
    doctorCount: counts.get(specialty.id) ?? 0,
  }));
}
