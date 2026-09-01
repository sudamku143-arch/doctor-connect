import { supabase } from "@/lib/supabase/client";

export interface DoctorReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export async function listDoctorReviews(doctorId: string): Promise<DoctorReview[]> {
  // is_hidden filtering is enforced by the reviews_public_read RLS policy
  // itself — reviewer identity isn't joined here since patients/profiles
  // aren't publicly readable across patients.
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
