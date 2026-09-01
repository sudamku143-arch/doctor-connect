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

export async function hasReviewed(appointmentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("appointment_id", appointmentId)
    .maybeSingle<{ id: string }>();
  if (error) throw error;
  return data != null;
}

export async function submitReview(input: {
  appointmentId: string;
  doctorId: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (patientError) throw patientError;

  // reviews_owner_write RLS (0004_phase4.sql) also enforces that the
  // appointment is COMPLETED and owned by this patient server-side.
  const { error } = await supabase.from("reviews").insert({
    appointment_id: input.appointmentId,
    patient_id: patient.id,
    doctor_id: input.doctorId,
    rating: input.rating,
    comment: input.comment ?? null,
  });
  if (error) throw error;
}
