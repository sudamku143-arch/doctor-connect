import Link from "next/link";
import { notFound } from "next/navigation";
import { VerificationBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { getClinic, listClinicDoctorAssignments } from "@/lib/api/clinics";
import { EditForm } from "./EditForm";
import { setClinicVerificationStatusAction } from "../actions";
import styles from "../../shared.module.css";

export default async function ClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [clinic, doctors] = await Promise.all([getClinic(id), listClinicDoctorAssignments(id)]);
  if (!clinic) notFound();

  const approve = setClinicVerificationStatusAction.bind(null, id, "VERIFIED");
  const reject = setClinicVerificationStatusAction.bind(null, id, "REJECTED");
  const suspend = setClinicVerificationStatusAction.bind(null, id, "SUSPENDED");

  return (
    <>
      <header className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{clinic.name}</h1>
          <p className={styles.subtitle}>
            {clinic.address}, {clinic.city}
          </p>
        </div>
        <VerificationBadge status={clinic.verification_status} />
      </header>

      <Card>
        <div className={styles.actionRow}>
          <form action={approve}>
            <Button type="submit" variant="secondary">
              Approve
            </Button>
          </form>
          <form action={reject}>
            <Button type="submit" variant="danger">
              Reject
            </Button>
          </form>
          <form action={suspend}>
            <Button type="submit" variant="danger">
              Suspend
            </Button>
          </form>
          <Link href={`/appointments?clinicId=${id}`}>
            <Button variant="secondary">View Appointments</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Edit details</h2>
        <EditForm clinic={clinic} />
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Doctors at this clinic</h2>
        {doctors.length === 0 ? (
          <p className={styles.emptyText}>No doctors assigned yet — assign one from the doctor&apos;s own page.</p>
        ) : (
          doctors.map((doctor) => (
            <div key={doctor.doctorClinicId} className={styles.row}>
              <span className={styles.rowLabel}>
                {doctor.fullName} — {doctor.qualification}
              </span>
              <Link href={`/doctors/${doctor.doctorId}`}>View</Link>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
