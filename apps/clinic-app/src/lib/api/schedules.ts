import type { DoctorSchedule } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function listSchedules(doctorClinicId: string): Promise<DoctorSchedule[]> {
  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("doctor_clinic_id", doctorClinicId)
    .order("day_of_week")
    .order("start_time");
  if (error) throw error;
  return data ?? [];
}

export async function addSchedule(input: {
  doctorClinicId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxPatientsPerSlot: number;
}): Promise<DoctorSchedule> {
  const { data, error } = await supabase
    .from("doctor_schedules")
    .insert({
      doctor_clinic_id: input.doctorClinicId,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      slot_duration_minutes: input.slotDurationMinutes,
      max_patients_per_slot: input.maxPatientsPerSlot,
    })
    .select()
    .single<DoctorSchedule>();
  if (error) throw error;
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("doctor_schedules").delete().eq("id", id);
  if (error) throw error;
}

export async function regenerateSlots(doctorClinicId: string, daysAhead = 14): Promise<number> {
  const { data, error } = await supabase.rpc("generate_slots_for_doctor_clinic", {
    p_doctor_clinic_id: doctorClinicId,
    p_days_ahead: daysAhead,
  });
  if (error) throw error;
  return data as number;
}
