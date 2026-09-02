"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export async function setReviewHiddenAction(reviewId: string, isHidden: boolean): Promise<void> {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("reviews").update({ is_hidden: isHidden }).eq("id", reviewId);
  if (error) throw error;
  await logAdminAction(supabase, isHidden ? "HIDE_REVIEW" : "RESTORE_REVIEW", "review", reviewId, undefined, { is_hidden: isHidden });
  revalidatePath("/reviews");
}
