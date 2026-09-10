import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
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

export async function uploadPrescription(input: {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  clinicId: string;
  watermarkedImageDataUrl: string;
}): Promise<Prescription> {
  // 1. Wrap the (already watermarked) flattened image in a single-page PDF.
  // There is no live text in this HTML — just an <img> — so the resulting
  // PDF has no selectable/editable text layer, only a rasterized picture.
  const html = `<html><body style="margin:0;padding:0;"><img src="${input.watermarkedImageDataUrl}" style="width:100%;display:block;" /></body></html>`;
  const { uri: pdfUri } = await Print.printToFileAsync({ html, base64: false });

  // 2. Read the generated PDF back as base64 so it can be uploaded.
  const pdfBase64 = await FileSystem.readAsStringAsync(pdfUri, { encoding: "base64" });

  // 3. Upload to the private "prescriptions" bucket, path-scoped by clinic
  // then appointment so storage RLS can decide access without needing a
  // prescriptions row to already exist.
  const path = `${input.clinicId}/${input.appointmentId}/${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("prescriptions")
    .upload(path, decode(pdfBase64), { contentType: "application/pdf", upsert: false });
  if (uploadError) throw uploadError;

  // 4. Supersede any previous prescription for this appointment.
  const { error: supersedeError } = await supabase
    .from("prescriptions")
    .update({ status: "SUPERSEDED" })
    .eq("appointment_id", input.appointmentId)
    .eq("status", "ACTIVE");
  if (supersedeError) throw supersedeError;

  // 5. Record the new active prescription.
  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      appointment_id: input.appointmentId,
      doctor_id: input.doctorId,
      patient_id: input.patientId,
      clinic_id: input.clinicId,
      pdf_path: path,
      status: "ACTIVE",
    })
    .select()
    .single<Prescription>();
  if (error) throw error;

  // 6. Notify the patient (in-app notification row — no push infra exists yet).
  await supabase.rpc("notify_patient_prescription_ready", { p_appointment_id: input.appointmentId });

  return data;
}
