"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { findProfileByEmail } from "@/lib/api/receptionists";
import type { ActionState } from "../doctors/actions";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export async function sendNotificationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSuperAdmin();

  const targetType = String(formData.get("targetType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const patientEmail = String(formData.get("patientEmail") ?? "").trim();
  const clinicId = String(formData.get("clinicId") ?? "");

  if (!title || !body) {
    return { error: "Title and body are required." };
  }

  let targetId: string | null = null;
  if (targetType === "PATIENT") {
    const profile = await findProfileByEmail(patientEmail);
    if (!profile) return { error: "No registered user found with that email." };
    targetId = profile.id;
  } else if (targetType === "CLINIC_STAFF") {
    if (!clinicId) return { error: "Select a clinic." };
    targetId = clinicId;
  }

  const { error } = await supabase.rpc("create_admin_notification", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_title: title,
    p_body: body,
  });
  if (error) return { error: "Could not send notification. Please try again." };

  await logAdminAction(supabase, "SEND_NOTIFICATION", "notification_broadcast", targetId ?? NIL_UUID, undefined, {
    targetType,
    title,
  });

  return {};
}
