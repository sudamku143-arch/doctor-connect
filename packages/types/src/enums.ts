// Mirrors the Postgres enums defined in supabase/migrations/0001_init.sql.
// Keep these two in sync by hand until Phase 2, when we switch to
// `supabase gen types typescript` generated from the live schema.

export const Role = {
  PATIENT: "PATIENT",
  RECEPTIONIST: "RECEPTIONIST",
  CLINIC_ADMIN: "CLINIC_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const VerificationStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

// Section 9 of PROMPT.md — the full appointment state machine.
// Transitions are enforced server-side only; never trust a client-sent status.
export const AppointmentStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  RESCHEDULE_REQUESTED: "RESCHEDULE_REQUESTED",
  CHECKED_IN: "CHECKED_IN",
  WAITING: "WAITING",
  IN_CONSULTATION: "IN_CONSULTATION",
  COMPLETED: "COMPLETED",
  CANCELLED_BY_PATIENT: "CANCELLED_BY_PATIENT",
  CANCELLED_BY_CLINIC: "CANCELLED_BY_CLINIC",
  NO_SHOW: "NO_SHOW",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const PaymentStatus = {
  CREATED: "CREATED",
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const BookingSource = {
  ONLINE: "ONLINE",
  WALK_IN: "WALK_IN",
} as const;
export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const SlotStatus = {
  OPEN: "OPEN",
  FULL: "FULL",
  BLOCKED: "BLOCKED",
} as const;
export type SlotStatus = (typeof SlotStatus)[keyof typeof SlotStatus];

export const QueueStatus = {
  WAITING: "WAITING",
  CALLED: "CALLED",
  IN_CONSULTATION: "IN_CONSULTATION",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
} as const;
export type QueueStatus = (typeof QueueStatus)[keyof typeof QueueStatus];

export const NotificationType = {
  BOOKING_CONFIRMATION: "BOOKING_CONFIRMATION",
  PAYMENT_CONFIRMATION: "PAYMENT_CONFIRMATION",
  APPOINTMENT_REMINDER_7D: "APPOINTMENT_REMINDER_7D",
  APPOINTMENT_REMINDER_24H: "APPOINTMENT_REMINDER_24H",
  APPOINTMENT_REMINDER_SAME_DAY: "APPOINTMENT_REMINDER_SAME_DAY",
  DOCTOR_UNAVAILABLE: "DOCTOR_UNAVAILABLE",
  RESCHEDULE_REQUEST: "RESCHEDULE_REQUEST",
  CANCELLATION: "CANCELLATION",
  QUEUE_UPDATE: "QUEUE_UPDATE",
  CLINIC_MESSAGE: "CLINIC_MESSAGE",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationChannel = {
  PUSH: "PUSH",
  SMS: "SMS",
  EMAIL: "EMAIL",
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];
