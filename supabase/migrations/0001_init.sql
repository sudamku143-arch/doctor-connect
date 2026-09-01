-- Doctor Connect — initial schema
-- Mirrors packages/types/src/models.ts and docs/ARCHITECTURE.md.
-- Written to disk only in Phase 1; not applied to any live project yet.

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type role as enum ('PATIENT', 'RECEPTIONIST', 'CLINIC_ADMIN', 'SUPER_ADMIN');
create type verification_status as enum ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
create type gender as enum ('MALE', 'FEMALE', 'OTHER');
create type appointment_status as enum (
  'PENDING_PAYMENT', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'CHECKED_IN', 'WAITING',
  'IN_CONSULTATION', 'COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC',
  'NO_SHOW', 'REFUND_PENDING', 'REFUNDED'
);
create type payment_status as enum ('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUND_PENDING', 'REFUNDED');
create type booking_source as enum ('ONLINE', 'WALK_IN');
create type slot_status as enum ('OPEN', 'FULL', 'BLOCKED');
create type queue_status as enum ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW');
create type notification_type as enum (
  'BOOKING_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'APPOINTMENT_REMINDER_7D',
  'APPOINTMENT_REMINDER_24H', 'APPOINTMENT_REMINDER_SAME_DAY', 'DOCTOR_UNAVAILABLE',
  'RESCHEDULE_REQUEST', 'CANCELLATION', 'QUEUE_UPDATE', 'CLINIC_MESSAGE'
);
create type notification_channel as enum ('PUSH', 'SMS', 'EMAIL');

-- ============================================================
-- updated_at helper
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- TABLES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role role not null default 'PATIENT',
  full_name text not null,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

create table patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  date_of_birth date,
  gender gender,
  address text,
  created_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  name text not null,
  relation text not null,
  date_of_birth date,
  gender gender,
  created_at timestamptz not null default now()
);
create index family_members_patient_id_idx on family_members (patient_id);

-- New Supabase Auth users self-register as patients (§3 of docs/ARCHITECTURE.md
-- — staff accounts are created by admins through a separate, explicit RPC,
-- never through this trigger). Runs as SECURITY DEFINER so it can write to
-- profiles/patients despite the caller having no RLS grant on those tables yet.
create or replace function handle_new_user()
returns trigger as $$
declare
  new_profile_id uuid;
begin
  insert into profiles (id, role, full_name, email, phone)
  values (
    new.id,
    'PATIENT',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  )
  returning id into new_profile_id;

  insert into patients (profile_id) values (new_profile_id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  qualification text not null,
  registration_number text not null,
  bio text,
  photo_url text,
  experience_years integer not null default 0,
  verification_status verification_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger doctors_set_updated_at before update on doctors
  for each row execute function set_updated_at();

create table doctor_specialties (
  doctor_id uuid not null references doctors (id) on delete cascade,
  specialty_id uuid not null references specialties (id) on delete cascade,
  primary key (doctor_id, specialty_id)
);

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  phone text,
  photos jsonb not null default '[]',
  timings jsonb not null default '{}',
  verification_status verification_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clinics_set_updated_at before update on clinics
  for each row execute function set_updated_at();

create table doctor_clinics (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  clinic_id uuid not null references clinics (id) on delete cascade,
  consultation_fee numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  unique (doctor_id, clinic_id)
);
create index doctor_clinics_doctor_id_idx on doctor_clinics (doctor_id);
create index doctor_clinics_clinic_id_idx on doctor_clinics (clinic_id);

create table clinic_staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  clinic_id uuid not null references clinics (id) on delete cascade,
  role role not null check (role in ('RECEPTIONIST', 'CLINIC_ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_id, clinic_id)
);
create index clinic_staff_clinic_id_idx on clinic_staff (clinic_id);

create table doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_clinic_id uuid not null references doctor_clinics (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_duration_minutes integer not null default 30,
  max_patients_per_slot integer not null default 1,
  is_active boolean not null default true,
  check (end_time > start_time)
);
create index doctor_schedules_doctor_clinic_id_idx on doctor_schedules (doctor_clinic_id);

create table doctor_leaves (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  clinic_id uuid references clinics (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index doctor_leaves_doctor_id_idx on doctor_leaves (doctor_id);

create table blocked_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_clinic_id uuid not null references doctor_clinics (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_by uuid not null references profiles (id),
  check (end_time > start_time)
);
create index blocked_slots_doctor_clinic_id_date_idx on blocked_slots (doctor_clinic_id, date);

create table appointment_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_clinic_id uuid not null references doctor_clinics (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  max_capacity integer not null default 1,
  booked_count integer not null default 0,
  status slot_status not null default 'OPEN',
  unique (doctor_clinic_id, date, start_time),
  check (booked_count >= 0 and booked_count <= max_capacity)
);
create index appointment_slots_doctor_clinic_id_date_idx on appointment_slots (doctor_clinic_id, date);
create index appointment_slots_status_idx on appointment_slots (status);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references appointment_slots (id),
  patient_id uuid not null references patients (id),
  family_member_id uuid references family_members (id),
  doctor_id uuid not null references doctors (id),
  clinic_id uuid not null references clinics (id),
  appointment_date date not null,
  appointment_time time not null,
  token_number integer,
  status appointment_status not null default 'PENDING_PAYMENT',
  booking_source booking_source not null default 'ONLINE',
  reason_for_visit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger appointments_set_updated_at before update on appointments
  for each row execute function set_updated_at();
create index appointments_doctor_id_idx on appointments (doctor_id);
create index appointments_clinic_id_idx on appointments (clinic_id);
create index appointments_patient_id_idx on appointments (patient_id);
create index appointments_appointment_date_idx on appointments (appointment_date);
create index appointments_status_idx on appointments (status);
create index appointments_slot_id_idx on appointments (slot_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id),
  razorpay_order_id text,
  razorpay_payment_id text,
  amount numeric(10, 2) not null,
  platform_fee numeric(10, 2) not null default 0,
  clinic_amount numeric(10, 2) not null default 0,
  status payment_status not null default 'CREATED',
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
create index payments_appointment_id_idx on payments (appointment_id);
create index payments_status_idx on payments (status);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments (id),
  amount numeric(10, 2) not null,
  reason text,
  status payment_status not null default 'PENDING',
  razorpay_refund_id text,
  created_at timestamptz not null default now()
);
create index refunds_payment_id_idx on refunds (payment_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references appointments (id),
  patient_id uuid not null references patients (id),
  doctor_id uuid not null references doctors (id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_doctor_id_idx on reviews (doctor_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on notifications (user_id);
create index notifications_user_id_read_at_idx on notifications (user_id, read_at);

create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index push_tokens_user_id_idx on push_tokens (user_id);

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  channel notification_channel not null,
  enabled boolean not null default true,
  unique (user_id, type, channel)
);

create table scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  type notification_type not null,
  send_at timestamptz not null,
  sent_at timestamptz
);
create index scheduled_notifications_pending_idx on scheduled_notifications (send_at) where sent_at is null;

create table queue_entries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references appointments (id),
  doctor_clinic_id uuid not null references doctor_clinics (id),
  date date not null,
  token_number integer not null,
  status queue_status not null default 'WAITING',
  checked_in_at timestamptz,
  called_at timestamptz,
  completed_at timestamptz
);
create index queue_entries_doctor_clinic_id_date_idx on queue_entries (doctor_clinic_id, date);
create index queue_entries_status_idx on queue_entries (status);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY (baseline — hardened further in Phase 7)
-- ============================================================

alter table profiles enable row level security;
alter table patients enable row level security;
alter table family_members enable row level security;
alter table doctors enable row level security;
alter table specialties enable row level security;
alter table doctor_specialties enable row level security;
alter table clinics enable row level security;
alter table doctor_clinics enable row level security;
alter table clinic_staff enable row level security;
alter table doctor_schedules enable row level security;
alter table doctor_leaves enable row level security;
alter table blocked_slots enable row level security;
alter table appointment_slots enable row level security;
alter table appointments enable row level security;
alter table payments enable row level security;
alter table refunds enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table push_tokens enable row level security;
alter table notification_preferences enable row level security;
alter table scheduled_notifications enable row level security;
alter table queue_entries enable row level security;
alter table audit_logs enable row level security;

-- Helper: is the current user staff at a given clinic (any active role)?
create or replace function is_clinic_staff(target_clinic_id uuid)
returns boolean as $$
  select exists (
    select 1 from clinic_staff cs
    where cs.clinic_id = target_clinic_id
      and cs.profile_id = auth.uid()
      and cs.is_active = true
  );
$$ language sql stable security definer set search_path = public;

-- Helper: is the current user a super admin?
create or replace function is_super_admin()
returns boolean as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN'
  );
$$ language sql stable security definer set search_path = public;

-- profiles: users read/update their own row; super admins read all.
create policy profiles_select_own on profiles for select
  using (id = auth.uid() or is_super_admin());
create policy profiles_update_own on profiles for update
  using (id = auth.uid());

-- patients: a patient manages their own record.
create policy patients_select_own on patients for select
  using (profile_id = auth.uid() or is_super_admin());
create policy patients_modify_own on patients for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- family_members: scoped through the owning patient.
create policy family_members_owner on family_members for all
  using (patient_id in (select id from patients where profile_id = auth.uid()))
  with check (patient_id in (select id from patients where profile_id = auth.uid()));

-- doctors, specialties, doctor_specialties: publicly readable (only verified
-- doctors are surfaced to patients at the query layer / API, not via RLS).
create policy doctors_public_read on doctors for select using (true);
create policy specialties_public_read on specialties for select using (true);
create policy doctor_specialties_public_read on doctor_specialties for select using (true);

-- clinics: publicly readable.
create policy clinics_public_read on clinics for select using (true);
create policy doctor_clinics_public_read on doctor_clinics for select using (true);

-- clinic_staff: visible to staff of the same clinic and super admins.
create policy clinic_staff_select on clinic_staff for select
  using (is_clinic_staff(clinic_id) or is_super_admin());

-- doctor_schedules / blocked_slots: publicly readable (needed to render
-- availability); writes restricted to clinic staff.
create policy doctor_schedules_public_read on doctor_schedules for select using (true);
create policy doctor_schedules_staff_write on doctor_schedules for all
  using (is_clinic_staff((select clinic_id from doctor_clinics where id = doctor_clinic_id)))
  with check (is_clinic_staff((select clinic_id from doctor_clinics where id = doctor_clinic_id)));

create policy blocked_slots_public_read on blocked_slots for select using (true);
create policy blocked_slots_staff_write on blocked_slots for all
  using (is_clinic_staff((select clinic_id from doctor_clinics where id = doctor_clinic_id)))
  with check (is_clinic_staff((select clinic_id from doctor_clinics where id = doctor_clinic_id)));

create policy doctor_leaves_staff on doctor_leaves for all
  using (clinic_id is null or is_clinic_staff(clinic_id))
  with check (clinic_id is null or is_clinic_staff(clinic_id));

-- appointment_slots: publicly readable (availability); mutated only via
-- SECURITY DEFINER RPCs (Phase 5), not direct client writes.
create policy appointment_slots_public_read on appointment_slots for select using (true);

-- appointments: visible to the owning patient or the clinic's staff.
create policy appointments_select on appointments for select
  using (
    patient_id in (select id from patients where profile_id = auth.uid())
    or is_clinic_staff(clinic_id)
    or is_super_admin()
  );

-- payments/refunds: visible to the appointment's patient or clinic staff.
create policy payments_select on payments for select
  using (
    appointment_id in (
      select id from appointments a
      where a.patient_id in (select id from patients where profile_id = auth.uid())
         or is_clinic_staff(a.clinic_id)
    )
    or is_super_admin()
  );
create policy refunds_select on refunds for select
  using (
    payment_id in (
      select p.id from payments p
      join appointments a on a.id = p.appointment_id
      where a.patient_id in (select id from patients where profile_id = auth.uid())
         or is_clinic_staff(a.clinic_id)
    )
    or is_super_admin()
  );

-- reviews: publicly readable (unless hidden), owner can write their own.
create policy reviews_public_read on reviews for select using (is_hidden = false or is_super_admin());
create policy reviews_owner_write on reviews for insert
  with check (patient_id in (select id from patients where profile_id = auth.uid()));

-- notifications / push_tokens / notification_preferences: owner only.
create policy notifications_owner on notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_owner on push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_owner on notification_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- queue_entries: visible to the appointment's patient or clinic staff.
create policy queue_entries_select on queue_entries for select
  using (
    appointment_id in (
      select id from appointments a
      where a.patient_id in (select id from patients where profile_id = auth.uid())
         or is_clinic_staff(a.clinic_id)
    )
    or is_super_admin()
  );

-- audit_logs: super admin only.
create policy audit_logs_super_admin on audit_logs for select using (is_super_admin());
