import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { Table } from "@/components/Table";
import {
  getAppointmentsByDay,
  getBookingsByDay,
  getClinicGrowthByMonth,
  getDashboardStats,
  getDoctorGrowthByMonth,
  getNewPatientsByMonth,
  getRecentAppointments,
  getRevenueByDay,
} from "@/lib/api/dashboard";
import { Charts } from "./Charts";
import styles from "../shared.module.css";

export default async function DashboardPage() {
  const [stats, appointmentsByDay, bookingsByDay, revenueByDay, newPatientsByMonth, doctorGrowthByMonth, clinicGrowthByMonth, recent] =
    await Promise.all([
      getDashboardStats(),
      getAppointmentsByDay(),
      getBookingsByDay(),
      getRevenueByDay(),
      getNewPatientsByMonth(),
      getDoctorGrowthByMonth(),
      getClinicGrowthByMonth(),
      getRecentAppointments(),
    ]);

  return (
    <>
      <header>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Overview across all clinics</p>
      </header>

      <section className={styles.filterRow}>
        <StatCard label="Total Doctors" value={String(stats.totalDoctors)} />
        <StatCard label="Total Clinics" value={String(stats.totalClinics)} />
        <StatCard label="Total Patients" value={String(stats.totalPatients)} />
        <StatCard label="Today's Appointments" value={String(stats.todaysAppointments)} />
        <StatCard label="Total Bookings" value={String(stats.totalBookings)} />
        <StatCard label="Total Revenue" value={`₹${stats.totalRevenue}`} />
      </section>

      <Charts
        appointmentsByDay={appointmentsByDay}
        bookingsByDay={bookingsByDay}
        revenueByDay={revenueByDay}
        newPatientsByMonth={newPatientsByMonth}
        doctorGrowthByMonth={doctorGrowthByMonth}
        clinicGrowthByMonth={clinicGrowthByMonth}
      />

      <Card>
        <h2 className={styles.sectionTitle}>Recent appointments</h2>
        <Table
          headers={["Patient", "Doctor", "Clinic", "Date", "Status", ""]}
          isEmpty={recent.length === 0}
          emptyMessage="No appointments yet."
        >
          {recent.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.patient?.profile?.full_name ?? "—"}</td>
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
