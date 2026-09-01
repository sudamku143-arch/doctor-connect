import type { Clinic } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function listNearbyClinics(limit = 5): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("verification_status", "VERIFIED")
    .order("name")
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
