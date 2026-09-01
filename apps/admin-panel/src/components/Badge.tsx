import type { AppointmentStatus, VerificationStatus } from "@doctor-connect/types";
import styles from "./Badge.module.css";

type Tone = "info" | "warning" | "success" | "danger" | "neutral";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={[styles.badge, styles[tone]].join(" ")}>{label}</span>;
}

const VERIFICATION_TONE: Record<VerificationStatus, Tone> = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge label={status.charAt(0) + status.slice(1).toLowerCase()} tone={VERIFICATION_TONE[status]} />;
}

const APPOINTMENT_STATUS_DISPLAY: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  PENDING_PAYMENT: { label: "Pending Payment", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  RESCHEDULE_REQUESTED: { label: "Reschedule Requested", tone: "warning" },
  CHECKED_IN: { label: "Checked In", tone: "info" },
  WAITING: { label: "Waiting", tone: "info" },
  IN_CONSULTATION: { label: "In Consultation", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED_BY_PATIENT: { label: "Cancelled", tone: "danger" },
  CANCELLED_BY_CLINIC: { label: "Cancelled by Clinic", tone: "danger" },
  NO_SHOW: { label: "No Show", tone: "danger" },
  REFUND_PENDING: { label: "Refund Pending", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const display = APPOINTMENT_STATUS_DISPLAY[status];
  return <Badge label={display.label} tone={display.tone} />;
}
