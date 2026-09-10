import type { Prescription } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function getActivePrescription(appointmentId: string): Promise<Prescription | null> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("status", "ACTIVE")
    .maybeSingle<Prescription>();
  if (error) throw error;
  return data;
}

export async function getPrescriptionDownloadUrl(pdfPath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("prescriptions").createSignedUrl(pdfPath, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
