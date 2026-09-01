import { notFound } from "next/navigation";
import { AppointmentStatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { getAppointment, getPaymentForAppointment } from "@/lib/api/appointments";
import { cancelAppointmentAction, rescheduleAppointmentAction } from "../actions";
import styles from "../../shared.module.css";

const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED_BY_PATIENT", "CANCELLED_BY_CLINIC", "NO_SHOW", "REFUNDED"];

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [appointment, payment] = await Promise.all([getAppointment(id), getPaymentForAppointment(id)]);
  if (!appointment) notFound();

  const isTerminal = TERMINAL_STATUSES.includes(appointment.status);
  const cancel = cancelAppointmentAction.bind(null, id);
  const reschedule = rescheduleAppointmentAction.bind(null, id);

  return (
    <>
      <header className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{appointment.patientProfile?.full_name ?? "Patient"}</h1>
          <p className={styles.subtitle}>
            {appointment.doctor.full_name} · {appointment.clinic.name}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </header>

      <Card>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Date</span>
          <span className={styles.rowValue}>{appointment.appointment_date}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Time</span>
          <span className={styles.rowValue}>{appointment.appointment_time}</span>
        </div>
        {appointment.token_number != null ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Token</span>
            <span className={styles.rowValue}>#{appointment.token_number}</span>
          </div>
        ) : null}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Booking source</span>
          <span className={styles.rowValue}>{appointment.booking_source}</span>
        </div>
        {appointment.reason_for_visit ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Reason</span>
            <span className={styles.rowValue}>{appointment.reason_for_visit}</span>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Payment</h2>
        {payment ? (
          <>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Amount</span>
              <span className={styles.rowValue}>₹{payment.amount}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Status</span>
              <span className={styles.rowValue}>{payment.status}</span>
            </div>
          </>
        ) : (
          <p className={styles.emptyText}>No payment record — this appointment did not require payment (pre-Phase 6).</p>
        )}
      </Card>

      {!isTerminal ? (
        <Card>
          <div className={styles.actionRow}>
            <form action={reschedule}>
              <Button type="submit" variant="secondary">
                Request Reschedule
              </Button>
            </form>
            <form action={cancel}>
              <Button type="submit" variant="danger">
                Cancel Appointment
              </Button>
            </form>
          </div>
        </Card>
      ) : null}
    </>
  );
}
