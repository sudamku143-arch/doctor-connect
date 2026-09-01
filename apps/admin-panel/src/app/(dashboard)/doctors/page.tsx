import Link from "next/link";
import { VerificationBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { listDoctors } from "@/lib/api/doctors";
import type { VerificationStatus } from "@doctor-connect/types";
import styles from "../shared.module.css";

const STATUSES: VerificationStatus[] = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status as VerificationStatus | undefined;
  const doctors = await listDoctors({ status, query: params.q });

  return (
    <>
      <header className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Doctors</h1>
          <p className={styles.subtitle}>{doctors.length} doctor(s)</p>
        </div>
        <Link href="/doctors/new">
          <Button>Add Doctor</Button>
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
        <Table
          headers={["Name", "Qualification", "Specialties", "Status", ""]}
          isEmpty={doctors.length === 0}
          emptyMessage="No doctors found."
        >
          {doctors.map((doctor) => (
            <tr key={doctor.id}>
              <td>{doctor.full_name}</td>
              <td>{doctor.qualification}</td>
              <td>{doctor.specialties.map((s) => s.name).join(", ") || "—"}</td>
              <td>
                <VerificationBadge status={doctor.verification_status} />
              </td>
              <td>
                <Link href={`/doctors/${doctor.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
