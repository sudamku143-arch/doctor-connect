import { decode } from "base64-arraybuffer";
import type { Profile } from "@doctor-connect/types";
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

// Uploads to the shared "avatars" bucket, path-prefixed by the caller's own
// auth uid (0015_clinic_profile_avatar.sql) — always the same file name so
// a re-upload replaces the old photo instead of accumulating orphans, and
// a cache-busting query param keeps the CDN/RN <Image> cache from serving
// the just-replaced photo back.
export async function uploadMyAvatar(base64Jpeg: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const path = `${user.id}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, decode(base64Jpeg), { contentType: "image/jpeg", upsert: true });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
  if (updateError) throw updateError;

  return avatarUrl;
}
