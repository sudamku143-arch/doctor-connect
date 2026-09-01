import type { QueueEntry } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export interface QueueEntryWithPatient extends QueueEntry {
  patientName: string;
}

interface QueueEntryRow extends QueueEntry {
  appointment: { patient: { profile: { full_name: string } | null } | null } | null;
}

export async function getTodayQueue(doctorClinicId: string, date: string): Promise<QueueEntryWithPatient[]> {
  const { data, error } = await supabase
    .from("queue_entries")
    .select("*, appointment:appointments(patient:patients(profile:profiles(full_name)))")
    .eq("doctor_clinic_id", doctorClinicId)
    .eq("date", date)
    .order("token_number", { ascending: true })
    .returns<QueueEntryRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { appointment, ...entry } = row;
    return { ...entry, patientName: appointment?.patient?.profile?.full_name ?? "Patient" };
  });
}

export async function callNextPatient(doctorClinicId: string, date: string): Promise<QueueEntry> {
  const { data, error } = await supabase
    .rpc("call_next_patient", { p_doctor_clinic_id: doctorClinicId, p_date: date })
    .single<QueueEntry>();
  if (error) throw error;
  return data;
}

export function subscribeToClinicQueue(doctorClinicId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`clinic-queue-${doctorClinicId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "queue_entries", filter: `doctor_clinic_id=eq.${doctorClinicId}` },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
