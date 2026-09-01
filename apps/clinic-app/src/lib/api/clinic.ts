import type { Clinic } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function updateClinic(
  id: string,
  input: { name: string; address: string; city: string; phone: string | null },
): Promise<Clinic> {
  const { data, error } = await supabase
    .from("clinics")
    .update({ name: input.name, address: input.address, city: input.city, phone: input.phone })
    .eq("id", id)
    .select()
    .single<Clinic>();
  if (error) throw error;
  return data;
}
