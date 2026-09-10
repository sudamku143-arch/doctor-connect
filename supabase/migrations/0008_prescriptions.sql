-- Prescription upload feature: doctor/receptionist uploads a prescription
-- (photo) for a COMPLETED appointment, the app watermarks it client-side
-- and stores the resulting PDF here; the patient can then download it.

create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  doctor_id uuid not null references doctors (id),
  patient_id uuid not null references patients (id),
  clinic_id uuid not null references clinics (id),
  pdf_path text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUPERSEDED')),
  created_at timestamptz not null default now()
);
create index prescriptions_appointment_id_idx on prescriptions (appointment_id);
create index prescriptions_patient_id_idx on prescriptions (patient_id);
create index prescriptions_clinic_id_idx on prescriptions (clinic_id);

alter table prescriptions enable row level security;

create policy prescriptions_clinic_staff_select on prescriptions for select
  using (is_clinic_staff(clinic_id) or is_super_admin());
create policy prescriptions_clinic_staff_insert on prescriptions for insert
  with check (is_clinic_staff(clinic_id));
create policy prescriptions_clinic_staff_update on prescriptions for update
  using (is_clinic_staff(clinic_id))
  with check (is_clinic_staff(clinic_id));
create policy prescriptions_patient_select on prescriptions for select
  using (patient_id in (select id from patients where profile_id = auth.uid()));

-- Storage: a private bucket, objects named "<clinicId>/<appointmentId>/<file>.pdf"
-- so access can be decided from the path alone (no chicken-and-egg dependency
-- on a prescriptions row existing yet at upload time).
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false)
on conflict (id) do nothing;

create or replace function can_access_prescription_object(object_name text)
returns boolean as $func$
  select
    is_super_admin()
    or is_clinic_staff((split_part(object_name, '/', 1))::uuid)
    or exists (
      select 1 from appointments a
      join patients p on p.id = a.patient_id
      where a.id = (split_part(object_name, '/', 2))::uuid
        and p.profile_id = auth.uid()
    );
$func$ language sql stable security definer set search_path = public;

revoke execute on function can_access_prescription_object(text) from public;
grant execute on function can_access_prescription_object(text) to authenticated;

create policy prescriptions_bucket_select on storage.objects for select
  using (bucket_id = 'prescriptions' and can_access_prescription_object(name));

create policy prescriptions_bucket_insert on storage.objects for insert
  with check (bucket_id = 'prescriptions' and is_clinic_staff((split_part(name, '/', 1))::uuid));

create policy prescriptions_bucket_update on storage.objects for update
  using (bucket_id = 'prescriptions' and is_clinic_staff((split_part(name, '/', 1))::uuid));

-- notifications_owner only lets a user insert their own notification rows,
-- so clinic staff can't directly notify a patient. This mirrors the
-- create_admin_notification / notify_patient_doctor_unavailable pattern
-- already used elsewhere for the same reason.
create or replace function notify_patient_prescription_ready(p_appointment_id uuid)
returns void as $func$
declare
  v_appointment appointments%rowtype;
  v_profile_id uuid;
begin
  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if not is_clinic_staff(v_appointment.clinic_id) then
    raise exception 'Not authorized';
  end if;

  select profile_id into v_profile_id from patients where id = v_appointment.patient_id;
  if v_profile_id is null then
    return;
  end if;

  insert into notifications (user_id, type, title, body, data)
  values (
    v_profile_id,
    'SYSTEM_MESSAGE',
    'Prescription ready',
    'Your prescription is ready to download.',
    jsonb_build_object('appointmentId', p_appointment_id)
  );
end;
$func$ language plpgsql security definer set search_path = public;

revoke execute on function notify_patient_prescription_ready(uuid) from public;
grant execute on function notify_patient_prescription_ready(uuid) to authenticated;
