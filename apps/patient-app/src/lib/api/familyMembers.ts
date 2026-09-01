import type { FamilyMember } from "@doctor-connect/types";
import type { FamilyMemberInput } from "@doctor-connect/validation";
import { supabase } from "@/lib/supabase/client";
import { getMyPatientRecord } from "./profile";

export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const patient = await getMyPatientRecord();
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("patient_id", patient.id)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function addFamilyMember(input: FamilyMemberInput): Promise<FamilyMember> {
  const patient = await getMyPatientRecord();
  const { data, error } = await supabase
    .from("family_members")
    .insert({
      patient_id: patient.id,
      name: input.name,
      relation: input.relation,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender ?? null,
    })
    .select()
    .single<FamilyMember>();
  if (error) throw error;
  return data;
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const { error } = await supabase.from("family_members").delete().eq("id", id);
  if (error) throw error;
}
