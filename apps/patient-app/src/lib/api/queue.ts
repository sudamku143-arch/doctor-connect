import type { QueueEntry } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export interface QueueSnapshot {
  entry: QueueEntry | null;
  currentlyConsultingToken: number | null;
  patientsBeforeCount: number;
}

export async function getQueueSnapshot(appointmentId: string): Promise<QueueSnapshot> {
  const { data: entry, error: entryError } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle<QueueEntry>();
  if (entryError) throw entryError;

  if (!entry) {
    return { entry: null, currentlyConsultingToken: null, patientsBeforeCount: 0 };
  }

  const { data: peers, error: peersError } = await supabase
    .from("queue_entries")
    .select("token_number, status")
    .eq("doctor_clinic_id", entry.doctor_clinic_id)
    .eq("date", entry.date);
  if (peersError) throw peersError;

  const consulting = (peers ?? []).find((peer) => peer.status === "IN_CONSULTATION");
  const patientsBeforeCount = (peers ?? []).filter(
    (peer) => peer.status === "WAITING" && peer.token_number < entry.token_number,
  ).length;

  return {
    entry,
    currentlyConsultingToken: consulting?.token_number ?? null,
    patientsBeforeCount,
  };
}

export async function getAverageSlotDurationMinutes(doctorClinicId: string): Promise<number> {
  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("slot_duration_minutes")
    .eq("doctor_clinic_id", doctorClinicId)
    .limit(1)
    .maybeSingle<{ slot_duration_minutes: number }>();
  if (error) throw error;
  return data?.slot_duration_minutes ?? 30;
}

export function subscribeToQueueEntry(appointmentId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`queue-entry-${appointmentId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "queue_entries", filter: `appointment_id=eq.${appointmentId}` },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
