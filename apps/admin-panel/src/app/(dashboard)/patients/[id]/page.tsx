import { notFound } from "next/navigation";
import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { getPatient, getPatientAppointments } from "@/lib/api/patients";
import styles from "../../shared.module.css";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [patient, appointments] = await Promise.all([getPatient(id), getPatientAppointments(id)]);
  if (!patient) notFound();

  return (
    <>
      <header>
        <h1 className={styles.title}>{patient.profile.full_name}</h1>
        <p className={styles.subtitle}>
          {patient.profile.phone ?? "No mobile on file"} · {patient.profile.email ?? "No email on file"}
        </p>
      </header>

      <Card>
        <h2 className={styles.sectionTitle}>Appointment history</h2>
        <Table
          headers={["Doctor", "Clinic", "Date", "Status"]}
          isEmpty={appointments.length === 0}
          emptyMessage="No appointment history yet."
        >
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.doctor.full_name}</td>
              <td>{appointment.clinic.name}</td>
              <td>
                {appointment.appointment_date} {appointment.appointment_time}
              </td>
              <td>
                <AppointmentStatusBadge status={appointment.status} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card>
        <p className={styles.emptyText}>
          Suspending a patient&apos;s account needs the Supabase service-role key (to ban the login), which isn&apos;t wired up
          yet — see <Link href="/settings">Settings</Link>.
        </p>
      </Card>
    </>
  );
}
