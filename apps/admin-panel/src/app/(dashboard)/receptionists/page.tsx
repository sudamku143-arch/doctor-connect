import Link from "next/link";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { listClinicStaff } from "@/lib/api/receptionists";
import { changeStaffRoleAction, toggleStaffActiveAction } from "./actions";
import styles from "../shared.module.css";

export default async function ReceptionistsPage() {
  const staff = await listClinicStaff();

  return (
    <>
      <header className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Receptionists</h1>
          <p className={styles.subtitle}>{staff.length} staff member(s)</p>
        </div>
        <Link href="/receptionists/new">
          <Button>Assign Staff</Button>
        </Link>
      </header>

      <Card>
        <p className={styles.emptyText}>
          Creating a brand-new login is not available yet (needs the Supabase service-role key) — this assigns an
          already-registered user as clinic staff. Ask them to sign up through any app first.
        </p>
      </Card>

      <Card>
        <Table
          headers={["Name", "Email", "Clinic", "Role", "Status", ""]}
          isEmpty={staff.length === 0}
          emptyMessage="No clinic staff yet."
        >
          {staff.map((s) => (
            <tr key={s.id}>
              <td>{s.profile.full_name}</td>
              <td>{s.profile.email}</td>
              <td>{s.clinic.name}</td>
              <td>
                <form action={changeStaffRoleAction.bind(null, s.id, s.role === "RECEPTIONIST" ? "CLINIC_ADMIN" : "RECEPTIONIST")}>
                  <Button type="submit" variant="secondary">
                    {s.role === "RECEPTIONIST" ? "Receptionist" : "Clinic Admin"}
                  </Button>
                </form>
              </td>
              <td>
                <Badge label={s.is_active ? "Active" : "Disabled"} tone={s.is_active ? "success" : "danger"} />
              </td>
              <td>
                <form action={toggleStaffActiveAction.bind(null, s.id, !s.is_active)}>
                  <Button type="submit" variant={s.is_active ? "danger" : "secondary"}>
                    {s.is_active ? "Disable" : "Enable"}
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
