import type { Clinic } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

// Called right after supabase.auth.signUp() succeeds, while the fresh
// account is still an untouched auto-created patient profile — turns the
// caller into the CLINIC_ADMIN of a brand-new clinic (register_clinic RPC,
// 0016_clinic_self_registration.sql / 0017_clinic_registration_geolocation.sql).
export async function registerClinic(input: {
  clinicName: string;
  address: string;
  city: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Clinic> {
  const { data, error } = await supabase
    .rpc("register_clinic", {
      p_clinic_name: input.clinicName,
      p_address: input.address,
      p_city: input.city,
      p_phone: input.phone ?? null,
      p_latitude: input.latitude ?? null,
      p_longitude: input.longitude ?? null,
    })
    .single<Clinic>();
  if (error) throw error;
  return data;
}
