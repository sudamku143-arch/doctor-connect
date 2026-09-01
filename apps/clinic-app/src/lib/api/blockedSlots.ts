import type { Appointment } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function addBlockedSlot(input: {
  doctorClinicId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}): Promise<Appointment[]> {
  const { data, error } = await supabase.rpc("add_blocked_slot", {
    p_doctor_clinic_id: input.doctorClinicId,
    p_date: input.date,
    p_start_time: input.startTime,
    p_end_time: input.endTime,
    p_reason: input.reason ?? null,
  });
  if (error) throw error;
  return (data as Appointment[]) ?? [];
}
