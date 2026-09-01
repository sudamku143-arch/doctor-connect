import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { searchPatients } from "@/lib/api/patients";
import styles from "../shared.module.css";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const patients = q ? await searchPatients(q) : [];

  return (
    <>
      <header>
        <h1 className={styles.title}>Patients</h1>
        <p className={styles.subtitle}>Search by name, mobile, or email. No medical detail is shown here.</p>
      </header>

      <Card>
        <form className={styles.filterRow}>
          <input type="text" name="q" placeholder="Search patients" defaultValue={q ?? ""} className={styles.searchInput} />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </Card>

      <Card>
        <Table
          headers={["Name", "Mobile", "Email", ""]}
          isEmpty={patients.length === 0}
          emptyMessage={q ? "No patients found." : "Search for a patient to get started."}
        >
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>{patient.profile.full_name}</td>
              <td>{patient.profile.phone ?? "—"}</td>
              <td>{patient.profile.email ?? "—"}</td>
              <td>
                <Link href={`/patients/${patient.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
