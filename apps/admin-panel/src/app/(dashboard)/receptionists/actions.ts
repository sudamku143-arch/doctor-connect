"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { findProfileByEmail } from "@/lib/api/receptionists";
import type { ActionState } from "../doctors/actions";

export async function assignStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const clinicId = String(formData.get("clinicId") ?? "");
  const role = String(formData.get("role") ?? "RECEPTIONIST");

  if (!email || !clinicId) {
    return { error: "Email and clinic are required." };
  }

  const profile = await findProfileByEmail(email);
  if (!profile) {
    return { error: "No registered user found with that email. They must sign up through any app first." };
  }

  const { data, error } = await supabase
    .from("clinic_staff")
    .upsert({ profile_id: profile.id, clinic_id: clinicId, role, is_active: true }, { onConflict: "profile_id,clinic_id" })
    .select("id")
    .single<{ id: string }>();
  if (error) return { error: "Could not assign this user. They may already be staff at this clinic." };

  await logAdminAction(supabase, "ASSIGN_STAFF", "clinic_staff", data.id, undefined, { profile_id: profile.id, clinic_id: clinicId, role });
  revalidatePath("/receptionists");
  redirect("/receptionists");
}

export async function changeStaffRoleAction(staffId: string, role: "RECEPTIONIST" | "CLINIC_ADMIN"): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("clinic_staff").update({ role }).eq("id", staffId);
  if (error) throw error;
  await logAdminAction(supabase, "CHANGE_STAFF_ROLE", "clinic_staff", staffId, undefined, { role });
  revalidatePath("/receptionists");
}

export async function toggleStaffActiveAction(staffId: string, isActive: boolean): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("clinic_staff").update({ is_active: isActive }).eq("id", staffId);
  if (error) throw error;
  await logAdminAction(supabase, "TOGGLE_STAFF_ACTIVE", "clinic_staff", staffId, undefined, { is_active: isActive });
  revalidatePath("/receptionists");
}
