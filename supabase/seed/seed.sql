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
