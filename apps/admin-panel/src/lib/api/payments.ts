import { createClient } from "@/lib/supabase/server";
import type { Appointment, Clinic, Doctor, Payment, Profile } from "@doctor-connect/types";

export interface AdminPayment extends Payment {
  appointment: (Appointment & { doctor: Doctor; clinic: Clinic; patient: { profile: Profile | null } | null }) | null;
}

export async function listPayments(): Promise<AdminPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, appointment:appointments(*, doctor:doctors(*), clinic:clinics(*), patient:patients(profile:profiles(*)))")
    .order("created_at", { ascending: false })
    .returns<AdminPayment[]>();
  if (error) throw error;
  return data ?? [];
}
