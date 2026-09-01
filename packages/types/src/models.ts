import type {
  AppointmentStatus,
  BookingSource,
  Gender,
  NotificationChannel,
  NotificationType,
  PaymentStatus,
  QueueStatus,
  Role,
  SlotStatus,
  VerificationStatus,
} from "./enums";

// Hand-written mirror of supabase/migrations/0001_init.sql. Regenerate from
// the live schema with `supabase gen types typescript` once Phase 2 wires a
// real project, and delete the manual duplication then.

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  profile_id: string;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  patient_id: string;
  name: string;
  relation: string;
  date_of_birth: string | null;
  gender: Gender | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  qualification: string;
  registration_number: string;
  bio: string | null;
  photo_url: string | null;
  experience_years: number;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  photos: string[];
  timings: Record<string, { open: string; close: string } | null>;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface DoctorClinic {
  id: string;
  doctor_id: string;
  clinic_id: string;
  consultation_fee: number;
  is_active: boolean;
}

export interface ClinicStaff {
  id: string;
  profile_id: string;
  clinic_id: string;
  role: Extract<Role, "RECEPTIONIST" | "CLINIC_ADMIN">;
  is_active: boolean;
  created_at: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_clinic_id: string;
  day_of_week: number; // 0 (Sunday) - 6 (Saturday)
  start_time: string; // HH:mm
  end_time: string;
  slot_duration_minutes: number;
  max_patients_per_slot: number;
  is_active: boolean;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  clinic_id: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface BlockedSlot {
  id: string;
  doctor_clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_by: string;
}

export interface AppointmentSlot {
  id: string;
  doctor_clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_count: number;
  status: SlotStatus;
}

export interface Appointment {
  id: string;
  slot_id: string;
  patient_id: string;
  family_member_id: string | null;
  doctor_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  token_number: number | null;
  status: AppointmentStatus;
  booking_source: BookingSource;
  reason_for_visit: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  appointment_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  platform_fee: number;
  clinic_amount: number;
  status: PaymentStatus;
  created_at: string;
  verified_at: string | null;
}

export interface Refund {
  id: string;
  payment_id: string;
  amount: number;
  reason: string | null;
  status: PaymentStatus;
  razorpay_refund_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: "ios" | "android";
  is_active: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface QueueEntry {
  id: string;
  appointment_id: string;
  doctor_clinic_id: string;
  date: string;
  token_number: number;
  status: QueueStatus;
  checked_in_at: string | null;
  called_at: string | null;
  completed_at: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}
