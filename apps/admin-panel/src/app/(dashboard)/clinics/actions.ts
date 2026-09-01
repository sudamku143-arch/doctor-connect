"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VerificationStatus } from "@doctor-connect/types";
import { requireSuperAdmin } from "@/lib/auth";
import type { ActionState } from "../doctors/actions";

export async function createClinicAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !address || !city) {
    return { error: "Name, address, and city are required." };
  }

  const { data, error } = await supabase
    .from("clinics")
    .insert({ name, address, city, phone: phone || null })
    .select("id")
    .single<{ id: string }>();
  if (error) return { error: "Could not create clinic. Please try again." };

  revalidatePath("/clinics");
  redirect(`/clinics/${data.id}`);
}

export async function updateClinicAction(clinicId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !address || !city) {
    return { error: "Name, address, and city are required." };
  }

  const { error } = await supabase.from("clinics").update({ name, address, city, phone: phone || null }).eq("id", clinicId);
  if (error) return { error: "Could not save changes." };

  revalidatePath(`/clinics/${clinicId}`);
  return {};
}

export async function setClinicVerificationStatusAction(clinicId: string, status: VerificationStatus): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("clinics").update({ verification_status: status }).eq("id", clinicId);
  if (error) throw error;
  revalidatePath(`/clinics/${clinicId}`);
  revalidatePath("/clinics");
}
