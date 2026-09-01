import type { DateStripItem } from "@doctor-connect/ui-native";
import type { Clinic } from "@doctor-connect/types";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function todayDateString(): string {
  return toDateString(new Date());
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
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

export function getPhoneUrl(phone: string): string {
  return `tel:${phone}`;
}
