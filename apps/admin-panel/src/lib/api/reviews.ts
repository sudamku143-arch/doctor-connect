import { createClient } from "@/lib/supabase/server";
import type { Doctor, Profile, Review } from "@doctor-connect/types";

export interface AdminReview extends Review {
  doctor: Doctor;
  patient: { profile: Profile | null } | null;
}

export async function listReviews(): Promise<AdminReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, doctor:doctors(*), patient:patients(profile:profiles(*))")
    .order("created_at", { ascending: false })
    .returns<AdminReview[]>();
  if (error) throw error;
  return data ?? [];
}
