import type { Clinic, ClinicStaff } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export interface MyClinicStaff extends ClinicStaff {
  clinic: Clinic;
}

export async function getMyClinicStaff(): Promise<MyClinicStaff | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("clinic_staff")
    .select("*, clinic:clinics(*)")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle<MyClinicStaff>();
  if (error) throw error;
  return data;
}
