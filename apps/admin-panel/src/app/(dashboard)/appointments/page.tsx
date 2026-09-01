import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { listAppointments } from "@/lib/api/appointments";
import { listDoctors } from "@/lib/api/doctors";
import { listClinics } from "@/lib/api/clinics";
import type { AppointmentStatus } from "@doctor-connect/types";
import styles from "../shared.module.css";

const STATUSES: AppointmentStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "CHECKED_IN",
  "WAITING",
  "IN_CONSULTATION",
  "COMPLETED",
  "CANCELLED_BY_PATIENT",
  "CANCELLED_BY_CLINIC",
  "NO_SHOW",
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string; clinicId?: string; date?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status as AppointmentStatus | undefined;

  const [appointments, doctors, clinics] = await Promise.all([
    listAppointments({ doctorId: params.doctorId, clinicId: params.clinicId, date: params.date, status }),
    listDoctors(),
    listClinics(),
  ]);

  return (
    <>
      <header>
        <h1 className={styles.title}>Appointments</h1>
        <p className={styles.subtitle}>{appointments.length} appointment(s) (most recent 100)</p>
      </header>

      <Card>
        <form className={styles.filterRow}>
          <select name="doctorId" defaultValue={params.doctorId ?? ""} className={styles.filterSelect}>
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
          <select name="clinicId" defaultValue={params.clinicId ?? ""} className={styles.filterSelect}>
            <option value="">All clinics</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="date" name="date" defaultValue={params.date ?? ""} className={styles.searchInput} />
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
          headers={["Patient", "Doctor", "Clinic", "Date", "Status", ""]}
          isEmpty={appointments.length === 0}
          emptyMessage="No appointments found."
        >
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.patientProfile?.full_name ?? "—"}</td>
              <td>{appointment.doctor.full_name}</td>
              <td>{appointment.clinic.name}</td>
              <td>
                {appointment.appointment_date} {appointment.appointment_time}
              </td>
              <td>
                <AppointmentStatusBadge status={appointment.status} />
              </td>
              <td>
                <Link href={`/appointments/${appointment.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
