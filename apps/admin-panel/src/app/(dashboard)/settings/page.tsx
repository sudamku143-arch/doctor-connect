import { Card } from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import styles from "../shared.module.css";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user!.id).maybeSingle();

  return (
    <>
      <header>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Your admin account.</p>
      </header>

      <Card>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Name</span>
          <span className={styles.rowValue}>{profile?.full_name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Email</span>
          <span className={styles.rowValue}>{profile?.email ?? user?.email}</span>
        </div>
      </Card>

      <Card>
        <p className={styles.emptyText}>
          Creating receptionist logins and suspending patient/staff accounts both need the Supabase{" "}
          <strong>service-role key</strong>, which isn&apos;t configured in this environment yet. Add it as a
          server-only <code>SUPABASE_SERVICE_ROLE_KEY</code> env var (never <code>NEXT_PUBLIC_</code>) to enable those
          later.
        </p>
      </Card>

      <LogoutButton />
    </>
  );
}
