import type { DateStripItem } from "@doctor-connect/ui-native";

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

export function formatFullDateLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return `${WEEKDAY_SHORT[date.getDay()]}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
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

export const DAY_OF_WEEK_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Same free, no-account Jitsi room the Patient App joins — keyed by
// appointment id, so both sides land in the same room with no signaling
// backend needed.
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
