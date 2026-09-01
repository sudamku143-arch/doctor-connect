import Link from "next/link";
import { VerificationBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { listClinics } from "@/lib/api/clinics";
import type { VerificationStatus } from "@doctor-connect/types";
import styles from "../shared.module.css";

const STATUSES: VerificationStatus[] = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];

export default async function ClinicsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = params.status as VerificationStatus | undefined;
  const clinics = await listClinics({ status, query: params.q });

  return (
    <>
      <header className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Clinics</h1>
          <p className={styles.subtitle}>{clinics.length} clinic(s)</p>
        </div>
        <Link href="/clinics/new">
          <Button>Add Clinic</Button>
        </Link>
      </header>

      <Card>
        <form className={styles.filterRow}>
          <input type="text" name="q" placeholder="Search by name" defaultValue={params.q ?? ""} className={styles.searchInput} />
          <select name="status" defaultValue={status ?? ""} className={styles.filterSelect}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </Card>

      <Card>
        <Table headers={["Name", "City", "Status", ""]} isEmpty={clinics.length === 0} emptyMessage="No clinics found.">
          {clinics.map((clinic) => (
            <tr key={clinic.id}>
              <td>{clinic.name}</td>
              <td>{clinic.city}</td>
              <td>
                <VerificationBadge status={clinic.verification_status} />
              </td>
              <td>
                <Link href={`/clinics/${clinic.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
