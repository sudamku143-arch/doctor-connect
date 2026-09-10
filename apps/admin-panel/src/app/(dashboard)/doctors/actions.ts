"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ConsultationMode, VerificationStatus } from "@doctor-connect/types";
import { requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export interface ActionState {
  error?: string;
}

export async function createDoctorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const qualification = String(formData.get("qualification") ?? "").trim();
  const registrationNumber = String(formData.get("registrationNumber") ?? "").trim();
  const experienceYears = Number(formData.get("experienceYears") ?? 0);
  const bio = String(formData.get("bio") ?? "").trim();
  const consultationMode = (formData.get("consultationMode") as ConsultationMode | null) ?? "BOTH";

  if (!fullName || !qualification || !registrationNumber) {
    return { error: "Name, qualification, and registration number are required." };
  }

  const { data, error } = await supabase
    .from("doctors")
    .insert({
      full_name: fullName,
      qualification,
      registration_number: registrationNumber,
      experience_years: experienceYears || 0,
      bio: bio || null,
      consultation_mode: consultationMode,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) return { error: "Could not create doctor. The registration number may already exist." };

  revalidatePath("/doctors");
  redirect(`/doctors/${data.id}`);
}

export async function updateDoctorAction(doctorId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const qualification = String(formData.get("qualification") ?? "").trim();
  const experienceYears = Number(formData.get("experienceYears") ?? 0);
  const bio = String(formData.get("bio") ?? "").trim();
  const consultationMode = (formData.get("consultationMode") as ConsultationMode | null) ?? "BOTH";

  if (!fullName || !qualification) {
    return { error: "Name and qualification are required." };
  }

  const { error } = await supabase
    .from("doctors")
    .update({
      full_name: fullName,
      qualification,
      experience_years: experienceYears || 0,
      bio: bio || null,
      consultation_mode: consultationMode,
    })
    .eq("id", doctorId);
  if (error) return { error: "Could not save changes." };

  revalidatePath(`/doctors/${doctorId}`);
  return {};
}

export async function setVerificationStatusAction(doctorId: string, status: VerificationStatus): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("doctors").update({ verification_status: status }).eq("id", doctorId);
  if (error) throw error;
  await logAdminAction(supabase, "SET_VERIFICATION_STATUS", "doctor", doctorId, undefined, { verification_status: status });
  revalidatePath(`/doctors/${doctorId}`);
  revalidatePath("/doctors");
}

export async function assignSpecialtiesAction(doctorId: string, formData: FormData): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const specialtyIds = formData.getAll("specialtyIds").map(String);

  await supabase.from("doctor_specialties").delete().eq("doctor_id", doctorId);
  if (specialtyIds.length > 0) {
    const { error } = await supabase
      .from("doctor_specialties")
      .insert(specialtyIds.map((specialtyId) => ({ doctor_id: doctorId, specialty_id: specialtyId })));
    if (error) throw error;
  }
  revalidatePath(`/doctors/${doctorId}`);
}

export async function assignClinicAction(doctorId: string, formData: FormData): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const clinicId = String(formData.get("clinicId") ?? "");
  const fee = Number(formData.get("consultationFee") ?? 0);
  if (!clinicId) return;

  const { error } = await supabase
    .from("doctor_clinics")
    .upsert({ doctor_id: doctorId, clinic_id: clinicId, consultation_fee: fee, is_active: true }, { onConflict: "doctor_id,clinic_id" });
  if (error) throw error;
  revalidatePath(`/doctors/${doctorId}`);
}

export async function toggleDoctorClinicActiveAction(doctorId: string, doctorClinicId: string, isActive: boolean): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("doctor_clinics").update({ is_active: isActive }).eq("id", doctorClinicId);
  if (error) throw error;
  revalidatePath(`/doctors/${doctorId}`);
}
