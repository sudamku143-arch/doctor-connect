import { Platform } from "react-native";
import { supabase } from "@/lib/supabase/client";

export async function upsertPushToken(expoPushToken: string, userId: string): Promise<void> {
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform: Platform.OS === "ios" ? "ios" : "android",
      is_active: true,
    },
    { onConflict: "expo_push_token" },
  );
  if (error) throw error;
}
