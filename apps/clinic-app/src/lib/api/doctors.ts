import type { Doctor } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";
import type { ClinicDoctor } from "./types";

interface DoctorClinicRow {
  id: string;
  consultation_fee: number;
  doctor: Doctor;
}

export async function listClinicDoctors(clinicId: string): Promise<ClinicDoctor[]> {
  const { data, error } = await supabase
    .from("doctor_clinics")
    .select("id, consultation_fee, doctor:doctors(*)")
    .eq("clinic_id", clinicId)
    .eq("is_active", true)
    .returns<DoctorClinicRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => ({
    doctorClinicId: row.id,
    doctor: row.doctor,
    consultationFee: row.consultation_fee,
  }));
}
