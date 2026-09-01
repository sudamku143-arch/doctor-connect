-- Development-only seed data (§20 of PROMPT.md: never used in production
-- screens). Run manually against a dev Supabase project:
--   psql "$DATABASE_URL" -f supabase/seed/seed.sql
-- Auth users (patients/staff) must be created via Supabase Auth first —
-- this script only seeds catalog + demo clinic/doctor data that has no
-- auth.users dependency.

insert into specialties (name, slug, icon) values
  ('General Physician', 'general-physician', 'stethoscope'),
  ('Pediatrician', 'pediatrician', 'baby'),
  ('Dermatologist', 'dermatologist', 'skin'),
  ('Dentist', 'dentist', 'tooth'),
  ('Cardiologist', 'cardiologist', 'heart'),
  ('Orthopedic', 'orthopedic', 'bone'),
  ('Gynecologist', 'gynecologist', 'female'),
  ('Ophthalmologist', 'ophthalmologist', 'eye')
on conflict (slug) do nothing;

insert into clinics (id, name, address, city, phone, timings, verification_status)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sunrise Multispecialty Clinic',
  '12 MG Road, Berhampur',
  'Berhampur',
  '+91 9000000001',
  '{"mon": {"open": "09:00", "close": "20:00"}, "tue": {"open": "09:00", "close": "20:00"}}',
  'VERIFIED'
)
on conflict (id) do nothing;

insert into doctors (id, full_name, qualification, registration_number, experience_years, verification_status)
values (
  '00000000-0000-0000-0000-000000000002',
  'Dr. Rahul Sharma',
  'MBBS, MD (General Medicine)',
  'OMC-12345',
  12,
  'VERIFIED'
)
on conflict (id) do nothing;

insert into doctor_specialties (doctor_id, specialty_id)
select '00000000-0000-0000-0000-000000000002', id from specialties where slug = 'general-physician'
on conflict do nothing;

insert into doctor_clinics (id, doctor_id, clinic_id, consultation_fee, is_active)
values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  400.00,
  true
)
on conflict (id) do nothing;

insert into doctor_schedules (doctor_clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients_per_slot)
values
  ('00000000-0000-0000-0000-000000000003', 1, '10:00', '13:00', 30, 1),
  ('00000000-0000-0000-0000-000000000003', 1, '15:00', '19:00', 30, 1),
  ('00000000-0000-0000-0000-000000000003', 3, '10:00', '14:00', 30, 1);

-- Phase 2: manually seeded appointment_slots for the demo doctor_clinic, for
-- the next 14 days, matching the doctor_schedules pattern above (Mon/Wed).
-- This is seed-script plumbing only — the recurring-schedule-to-slots
-- generator (with leave/blocked-slot exclusion) is a Phase 5 concern; the
-- Patient App books directly against these rows via the book_appointment RPC.
insert into appointment_slots (doctor_clinic_id, date, start_time, end_time, max_capacity, booked_count, status)
select
  '00000000-0000-0000-0000-000000000003'::uuid,
  d::date,
  s.start_time,
  s.start_time + interval '30 minutes',
  1,
  0,
  'OPEN'::slot_status
from generate_series(current_date, current_date + interval '13 days', interval '1 day') as d
cross join lateral (
  values
    ('10:00'::time), ('10:30'::time), ('11:00'::time), ('11:30'::time), ('12:00'::time), ('12:30'::time),
    ('15:00'::time), ('15:30'::time), ('16:00'::time), ('16:30'::time), ('17:00'::time), ('17:30'::time), ('18:00'::time), ('18:30'::time)
) as s(start_time)
where extract(dow from d) = 1 -- Monday: matches the 10-1 and 3-7 schedule rows
union all
select
  '00000000-0000-0000-0000-000000000003'::uuid,
  d::date,
  s.start_time,
  s.start_time + interval '30 minutes',
  1,
  0,
  'OPEN'::slot_status
from generate_series(current_date, current_date + interval '13 days', interval '1 day') as d
cross join lateral (
  values ('10:00'::time), ('10:30'::time), ('11:00'::time), ('11:30'::time), ('12:00'::time), ('12:30'::time), ('13:00'::time), ('13:30'::time)
) as s(start_time)
where extract(dow from d) = 3 -- Wednesday: matches the 10-2 schedule row
on conflict (doctor_clinic_id, date, start_time) do nothing;
