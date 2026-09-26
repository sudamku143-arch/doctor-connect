import type { DateStripItem } from "@doctor-connect/ui-native";
import type { Clinic } from "@doctor-connect/types";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function todayDateString(): string {
  return toDateString(new Date());
}

// Local calendar date, not toISOString().slice(0, 10) — that converts
// through UTC, which rolls back to the previous day for any timezone
// ahead of UTC (IST included) whenever the local date is fed back in
// here via a local-midnight Date, as addDays() below does.
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function formatDateLabel(dateString: string): string {
  const today = todayDateString();
  const tomorrow = addDays(today, 1);
  if (dateString === today) return "Today";
  if (dateString === tomorrow) return "Tomorrow";
  const date = new Date(`${dateString}T00:00:00`);
  return `${WEEKDAY_SHORT[date.getDay()]}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
}

export function formatTimeLabel(timeString: string): string {
  const [hourStr, minuteStr] = timeString.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function buildDateStripItems(fromDateString: string, days: number): DateStripItem[] {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(fromDateString, index);
    const jsDate = new Date(`${date}T00:00:00`);
    return {
      date,
      label: index === 0 ? "Today" : index === 1 ? "Tmrw" : "",
      dayOfWeek: WEEKDAY_SHORT[jsDate.getDay()] ?? "",
      dayNumber: String(jsDate.getDate()),
    };
  });
}

export function getDirectionsUrl(clinic: Pick<Clinic, "latitude" | "longitude" | "address" | "city">): string {
  if (clinic.latitude != null && clinic.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${clinic.latitude},${clinic.longitude}`;
  }
  const query = encodeURIComponent(`${clinic.address}, ${clinic.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

const TIMINGS_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Honest "open till" label derived from the clinic's own timings jsonb —
// there is no real-time occupancy signal, only the configured hours.
export function getOpenStatusLabel(timings: Clinic["timings"]): string | null {
  const dayKey = TIMINGS_DAY_KEYS[new Date().getDay()];
  const today = timings?.[dayKey];
  if (!today) return "Closed today";

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (nowMinutes < openMinutes) return `Opens ${formatTimeLabel(today.open)}`;
  if (nowMinutes >= closeMinutes) return "Closed now";
  return `Open till ${formatTimeLabel(today.close)}`;
}

export function getPhoneUrl(phone: string): string {
  // tel: URIs with spaces (e.g. seeded numbers like "+91 9000000001") are
  // rejected or silently ignored by some Android dialers — strip everything
  // except digits and a leading "+".
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// Free, no-account video room (Jitsi Meet's public server) keyed by
// appointment id — both the patient and the doctor's side join the same
// URL, so no signaling/backend infra is needed for this to work.
export function getVideoCallUrl(appointmentId: string): string {
  return `https://meet.jit.si/DoctorConnect-${appointmentId}`;
}

// Video appointments open for joining a bit before the scheduled slot
// (not the moment the appointment was booked, which could be days earlier).
const VIDEO_CALL_LEAD_MINUTES = 10;

function videoCallOpensAt(appointmentDate: string, appointmentTime: string): Date {
  const scheduled = new Date(`${appointmentDate}T${appointmentTime}`);
  return new Date(scheduled.getTime() - VIDEO_CALL_LEAD_MINUTES * 60 * 1000);
}

export function isVideoCallJoinable(appointmentDate: string, appointmentTime: string): boolean {
  return Date.now() >= videoCallOpensAt(appointmentDate, appointmentTime).getTime();
}

export function getVideoCallOpensAtLabel(appointmentDate: string, appointmentTime: string): string {
  const opensAt = videoCallOpensAt(appointmentDate, appointmentTime);
  const hh = String(opensAt.getHours()).padStart(2, "0");
  const mm = String(opensAt.getMinutes()).padStart(2, "0");
  return formatTimeLabel(`${hh}:${mm}`);
}
