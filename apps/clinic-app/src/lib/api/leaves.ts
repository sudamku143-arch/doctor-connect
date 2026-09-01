import type { Appointment } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function addDoctorLeave(input: {
  doctorId: string;
  clinicId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<Appointment[]> {
  const { data, error } = await supabase.rpc("add_doctor_leave", {
    p_doctor_id: input.doctorId,
    p_clinic_id: input.clinicId,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_reason: input.reason ?? null,
  });
  if (error) throw error;
  return (data as Appointment[]) ?? [];
}
