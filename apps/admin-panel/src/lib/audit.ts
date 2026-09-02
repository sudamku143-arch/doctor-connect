import type { SupabaseClient } from "@supabase/supabase-js";

// Wraps the log_admin_action RPC (0005_phase7.sql) — the only thing that's
// ever allowed to write to audit_logs. Failures here never block the
// primary action; they're swallowed so a logging hiccup can't stop an
// admin from actually doing their job.
export async function logAdminAction(
  supabase: SupabaseClient,
  action: string,
  entityType: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
): Promise<void> {
  try {
    await supabase.rpc("log_admin_action", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_before: before ?? null,
      p_after: after ?? null,
    });
  } catch {
    // best-effort — see comment above
  }
}
