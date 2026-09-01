import type { Patient, Profile } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

export async function getMyProfile(): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (error) throw error;
  return data;
}

export async function getMyPatientRecord(): Promise<Patient> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("profile_id", user.id)
    .single<Patient>();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(input: { fullName: string; phone: string | null }): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName, phone: input.phone })
    .eq("id", user.id);
  if (error) throw error;
}
