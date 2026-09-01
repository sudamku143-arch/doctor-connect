"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";

export async function cancelAppointmentAction(appointmentId: string): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.rpc("cancel_appointment_by_clinic", { p_appointment_id: appointmentId, p_reason: null });
  if (error) throw error;
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/appointments");
}

export async function rescheduleAppointmentAction(appointmentId: string): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.rpc("request_reschedule_by_clinic", { p_appointment_id: appointmentId });
  if (error) throw error;
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/appointments");
}
