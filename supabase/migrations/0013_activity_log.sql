-- Recent Activity feed (Clinic App dashboard, Phase 8).
--
-- A lightweight, purpose-built log separate from `audit_logs` (which is
-- the Admin Panel's before/after compliance trail for verification/staff/
-- status changes). This one stores ready-made human-readable messages so
-- the dashboard can render them directly with no reconstruction — check-
-- ins, new bookings, cancellations and completed consultations, scoped to
-- one clinic.

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics (id) on delete cascade,
  type text not null,
  message text not null,
  appointment_id uuid references appointments (id) on delete set null,
  actor_id uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index activity_log_clinic_id_created_at_idx on activity_log (clinic_id, created_at desc);

alter table activity_log enable row level security;

create policy activity_log_clinic_staff_select on activity_log for select
  using (is_clinic_staff(clinic_id));

revoke execute on function checkin_appointment(uuid) from public;
revoke execute on function complete_consultation(uuid) from public;
revoke execute on function mark_no_show(uuid) from public;
revoke execute on function cancel_appointment_by_clinic(uuid, text) from public;

-- ============================================================
-- checkin_appointment — now also logs a CHECK_IN activity row
-- ============================================================
create or replace function checkin_appointment(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_appointment appointments%rowtype;
  v_doctor_clinic_id uuid;
  v_patient_name text;
begin
  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if not is_clinic_staff(v_appointment.clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;
  if v_appointment.status not in ('CONFIRMED', 'PENDING_PAYMENT') then
    raise exception 'Appointment cannot be checked in from its current status';
  end if;
  if v_appointment.appointment_date <> current_date then
    raise exception 'Only today''s appointments can be checked in';
  end if;

  select doctor_clinic_id into v_doctor_clinic_id from appointment_slots where id = v_appointment.slot_id;

  update appointments set status = 'CHECKED_IN' where id = p_appointment_id returning * into v_appointment;

  insert into queue_entries (appointment_id, doctor_clinic_id, date, token_number, status, checked_in_at)
  values (p_appointment_id, v_doctor_clinic_id, v_appointment.appointment_date, v_appointment.token_number, 'WAITING', now())
  on conflict (appointment_id) do update set status = 'WAITING', checked_in_at = now();

  select pr.full_name into v_patient_name
  from patients pt join profiles pr on pr.id = pt.profile_id
  where pt.id = v_appointment.patient_id;

  insert into activity_log (clinic_id, type, message, appointment_id, actor_id)
  values (
    v_appointment.clinic_id,
    'CHECK_IN',
    'Patient checked in — ' || coalesce(v_patient_name, 'Patient'),
    v_appointment.id,
    auth.uid()
  );

  return v_appointment;
end;
$func$;

grant execute on function checkin_appointment(uuid) to authenticated;

-- ============================================================
-- complete_consultation — now also logs a CONSULTATION_COMPLETE row
-- ============================================================
create or replace function complete_consultation(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_appointment appointments%rowtype;
  v_patient_name text;
begin
  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if not is_clinic_staff(v_appointment.clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;
  if v_appointment.status <> 'IN_CONSULTATION' then
    raise exception 'Appointment is not currently in consultation';
  end if;

  update appointments set status = 'COMPLETED' where id = p_appointment_id returning * into v_appointment;
  update queue_entries set status = 'COMPLETED', completed_at = now() where appointment_id = p_appointment_id;

  select pr.full_name into v_patient_name
  from patients pt join profiles pr on pr.id = pt.profile_id
  where pt.id = v_appointment.patient_id;

  insert into activity_log (clinic_id, type, message, appointment_id, actor_id)
  values (
    v_appointment.clinic_id,
    'CONSULTATION_COMPLETE',
    'Consultation completed — ' || coalesce(v_patient_name, 'Patient'),
    v_appointment.id,
    auth.uid()
  );

  return v_appointment;
end;
$func$;

grant execute on function complete_consultation(uuid) to authenticated;

-- ============================================================
-- mark_no_show — now also logs a NO_SHOW row
-- ============================================================
create or replace function mark_no_show(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_appointment appointments%rowtype;
  v_patient_name text;
begin
  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if not is_clinic_staff(v_appointment.clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;
  if v_appointment.status not in ('WAITING', 'CHECKED_IN') then
    raise exception 'Appointment cannot be marked no-show from its current status';
  end if;

  update appointments set status = 'NO_SHOW' where id = p_appointment_id returning * into v_appointment;
  update queue_entries set status = 'NO_SHOW' where appointment_id = p_appointment_id;

  select pr.full_name into v_patient_name
  from patients pt join profiles pr on pr.id = pt.profile_id
  where pt.id = v_appointment.patient_id;

  insert into activity_log (clinic_id, type, message, appointment_id, actor_id)
  values (
    v_appointment.clinic_id,
    'NO_SHOW',
    'Marked as no-show — ' || coalesce(v_patient_name, 'Patient'),
    v_appointment.id,
    auth.uid()
  );

  return v_appointment;
end;
$func$;

grant execute on function mark_no_show(uuid) to authenticated;

-- ============================================================
-- cancel_appointment_by_clinic — now also logs a CANCELLED row
-- ============================================================
create or replace function cancel_appointment_by_clinic(p_appointment_id uuid, p_reason text default null)
returns appointments
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_appointment appointments%rowtype;
  v_patient_name text;
begin
  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if not is_clinic_staff(v_appointment.clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;
  if v_appointment.status in ('COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'NO_SHOW', 'REFUNDED') then
    raise exception 'This appointment can no longer be cancelled';
  end if;

  update appointments set status = 'CANCELLED_BY_CLINIC' where id = p_appointment_id returning * into v_appointment;

  update appointment_slots
  set booked_count = greatest(booked_count - 1, 0),
      status = case when status = 'FULL' then 'OPEN' else status end
  where id = v_appointment.slot_id;

  update queue_entries set status = 'NO_SHOW' where appointment_id = p_appointment_id and status in ('WAITING', 'IN_CONSULTATION');

  select pr.full_name into v_patient_name
  from patients pt join profiles pr on pr.id = pt.profile_id
  where pt.id = v_appointment.patient_id;

  insert into activity_log (clinic_id, type, message, appointment_id, actor_id)
  values (
    v_appointment.clinic_id,
    'CANCELLED',
    'Appointment cancelled — ' || coalesce(v_patient_name, 'Patient'),
    v_appointment.id,
    auth.uid()
  );

  return v_appointment;
end;
$func$;

grant execute on function cancel_appointment_by_clinic(uuid, text) to authenticated;

-- ============================================================
-- book_appointment (patient-side, from 0007) — now also logs a
-- NEW_BOOKING activity row for the clinic dashboard to see.
-- ============================================================
create or replace function book_appointment(
  p_slot_id uuid,
  p_reason text default null,
  p_family_member_id uuid default null,
  p_consultation_type consultation_type default 'PHYSICAL'
)
returns appointments
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_patient_id uuid;
  v_slot appointment_slots%rowtype;
  v_doctor_clinic doctor_clinics%rowtype;
  v_doctor_verified verification_status;
  v_doctor_mode consultation_mode;
  v_clinic_verified verification_status;
  v_doctor_name text;
  v_clinic_name text;
  v_patient_name text;
  v_next_token integer;
  v_appointment appointments%rowtype;
begin
  select id into v_patient_id from patients where profile_id = auth.uid();
  if v_patient_id is null then
    raise exception 'Only a patient can book an appointment';
  end if;

  if p_family_member_id is not null then
    if not exists (
      select 1 from family_members
      where id = p_family_member_id and patient_id = v_patient_id
    ) then
      raise exception 'Family member does not belong to this patient';
    end if;
  end if;

  -- Row lock: only one concurrent booking on this slot can proceed past here.
  select * into v_slot from appointment_slots where id = p_slot_id for update;
  if not found then
    raise exception 'Slot not found';
  end if;
  if v_slot.status <> 'OPEN' or v_slot.booked_count >= v_slot.max_capacity then
    raise exception 'Slot is no longer available';
  end if;

  select * into v_doctor_clinic from doctor_clinics where id = v_slot.doctor_clinic_id;
  select verification_status, consultation_mode into v_doctor_verified, v_doctor_mode
    from doctors where id = v_doctor_clinic.doctor_id;
  select verification_status into v_clinic_verified from clinics where id = v_doctor_clinic.clinic_id;
  if v_doctor_verified <> 'VERIFIED' or v_clinic_verified <> 'VERIFIED' or not v_doctor_clinic.is_active then
    raise exception 'Doctor or clinic is not currently bookable';
  end if;
  if p_consultation_type = 'VIDEO' and v_doctor_mode = 'PHYSICAL_ONLY' then
    raise exception 'This doctor does not offer video consultations';
  end if;

  select coalesce(max(token_number), 0) + 1 into v_next_token
  from appointments
  where doctor_id = v_doctor_clinic.doctor_id
    and clinic_id = v_doctor_clinic.clinic_id
    and appointment_date = v_slot.date;

  insert into appointments (
    slot_id, patient_id, family_member_id, doctor_id, clinic_id,
    appointment_date, appointment_time, token_number, status,
    booking_source, reason_for_visit, consultation_type
  ) values (
    v_slot.id, v_patient_id, p_family_member_id, v_doctor_clinic.doctor_id, v_doctor_clinic.clinic_id,
    v_slot.date, v_slot.start_time, v_next_token, 'CONFIRMED',
    'ONLINE', p_reason, p_consultation_type
  )
  returning * into v_appointment;

  update appointment_slots
  set booked_count = booked_count + 1,
      status = case when booked_count + 1 >= max_capacity then 'FULL' else status end
  where id = v_slot.id;

  select full_name into v_doctor_name from doctors where id = v_doctor_clinic.doctor_id;
  select name into v_clinic_name from clinics where id = v_doctor_clinic.clinic_id;
  insert into notifications (user_id, type, title, body, data)
  values (
    auth.uid(),
    'BOOKING_CONFIRMATION',
    'Appointment confirmed',
    'Your ' || (case when p_consultation_type = 'VIDEO' then 'video' else 'in-clinic' end)
      || ' appointment with ' || coalesce(v_doctor_name, 'the doctor') || ' at ' || coalesce(v_clinic_name, 'the clinic')
      || ' on ' || to_char(v_slot.date, 'DD Mon YYYY') || ' is confirmed.',
    jsonb_build_object('appointmentId', v_appointment.id)
  );

  select full_name into v_patient_name from profiles where id = auth.uid();

  insert into activity_log (clinic_id, type, message, appointment_id, actor_id)
  values (
    v_doctor_clinic.clinic_id,
    'NEW_BOOKING',
    'New booking — ' || coalesce(v_patient_name, 'Patient') || ' with Dr. ' || coalesce(v_doctor_name, 'doctor'),
    v_appointment.id,
    auth.uid()
  );

  return v_appointment;
end;
$func$;

grant execute on function book_appointment(uuid, text, uuid, consultation_type) to authenticated;
revoke execute on function book_appointment(uuid, text, uuid, consultation_type) from public;
