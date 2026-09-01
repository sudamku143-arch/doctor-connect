import { createClient } from "@/lib/supabase/server";
import type { Clinic, Profile } from "@doctor-connect/types";

export interface ClinicStaffRow {
  id: string;
  role: "RECEPTIONIST" | "CLINIC_ADMIN";
  is_active: boolean;
  profile: Profile;
  clinic: Clinic;
}

export async function listClinicStaff(): Promise<ClinicStaffRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_staff")
    .select("id, role, is_active, profile:profiles(*), clinic:clinics(*)")
    .order("created_at", { ascending: false })
    .returns<ClinicStaffRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function findProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").ilike("email", email.trim()).maybeSingle<Profile>();
  if (error) throw error;
  return data;
}
