import type { ActivityLog } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function listRecentActivity(clinicId: string, limit = 8): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ActivityLog[]>();
  if (error) throw error;
  return data ?? [];
}

export async function countActivitySince(clinicId: string, sinceIso: string): Promise<number> {
  const { count, error } = await supabase
    .from("activity_log")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .gt("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}
