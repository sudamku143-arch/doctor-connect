import type { AppointmentSlot, ConsultationType } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function listSlotsForDate(doctorClinicId: string, date: string): Promise<AppointmentSlot[]> {
  const { data, error } = await supabase
    .from("appointment_slots")
    .select("*")
    .eq("doctor_clinic_id", doctorClinicId)
    .eq("date", date)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function bookAppointmentByClinic(params: {
  patientId: string;
  slotId: string;
  consultationType: ConsultationType;
  reason?: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .rpc("book_appointment_by_clinic", {
      p_patient_id: params.patientId,
      p_slot_id: params.slotId,
      p_consultation_type: params.consultationType,
      p_reason: params.reason ?? null,
    })
    .single<{ id: string }>();
  if (error) throw error;
  return data;
}
