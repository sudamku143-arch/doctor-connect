import { createClient } from "@/lib/supabase/server";
import type { AuditLog, Profile } from "@doctor-connect/types";

export interface AuditLogRow extends AuditLog {
  actor: Profile | null;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, actor:profiles(*)")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<AuditLogRow[]>();
  if (error) throw error;
  return data ?? [];
}
