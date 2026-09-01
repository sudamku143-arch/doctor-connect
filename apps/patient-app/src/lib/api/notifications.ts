import { NotificationType, type Notification } from "@doctor-connect/types";
import { supabase } from "@/lib/supabase/client";

const ALL_NOTIFICATION_TYPES = Object.values(NotificationType);

export async function listNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw error;
}

// Simplified master switch: one row per notification type on the PUSH
// channel, rather than exposing per-type granularity in the UI (§18's
// "Notifications" settings entry doesn't call for per-type toggles).
export async function getPushNotificationsEnabled(): Promise<boolean> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("enabled")
    .eq("channel", "PUSH");
  if (error) throw error;
  if (!data || data.length === 0) return true; // no rows yet = default on
  return data.every((row) => row.enabled);
}

export async function setPushNotificationsEnabled(enabled: boolean): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const rows = ALL_NOTIFICATION_TYPES.map((type) => ({
    user_id: user.id,
    type,
    channel: "PUSH" as const,
    enabled,
  }));
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(rows, { onConflict: "user_id,type,channel" });
  if (error) throw error;
}
