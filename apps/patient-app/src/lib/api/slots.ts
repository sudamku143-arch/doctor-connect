import type { AppointmentSlot } from "@doctor-connect/types";
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
