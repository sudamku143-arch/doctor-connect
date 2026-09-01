import { createClient } from "@/lib/supabase/server";

// Server Actions are independent POST endpoints — the layout's redirect
// guard doesn't cover them (see the Next.js data-security guidance bundled
// in node_modules/next/dist/docs). Every mutating action calls this first.
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string }>();
  if (profile?.role !== "SUPER_ADMIN") throw new Error("Not authorized");

  return { supabase, userId: user.id };
}
