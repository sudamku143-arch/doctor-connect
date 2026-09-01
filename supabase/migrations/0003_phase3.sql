-- Doctor Connect — Phase 3 additions (Clinic/Receptionist App backend)
-- Adds: the leave/blocked-slot-aware slot generator, doctor leave / blocked
-- slot RPCs that keep appointment_slots in sync, the queue/check-in/
-- consultation RPCs, clinic-side cancellation, and two RLS additions
-- (clinic staff visibility into patients, clinic-admin clinic profile writes).
--
-- No walk-in support: every appointment these RPCs operate on was booked
-- online through the Patient App (Phase 2's book_appointment). This is an
-- explicit, confirmed scope decision — see docs/ARCHITECTURE.md.

-- ============================================================
-- generate_slots_for_doctor_clinic — the slot engine
-- ============================================================

create or replace function generate_slots_for_doctor_clinic(
  p_doctor_clinic_id uuid,
  p_days_ahead integer default 14
)
returns integer
security definer
set search_path = public
language plpgsql
as $$
declare
  v_clinic_id uuid;
  v_day date;
  v_end_day date;
  v_schedule doctor_schedules%rowtype;
  v_slot_start time;
  v_slot_end time;
  v_inserted integer := 0;
begin
  select clinic_id into v_clinic_id from doctor_clinics where id = p_doctor_clinic_id;
  if v_clinic_id is null then
    raise exception 'Doctor clinic not found';
  end if;
  if not is_clinic_staff(v_clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;

  v_day := current_date;
  v_end_day := current_date + p_days_ahead;

  while v_day <= v_end_day loop
    if exists (
      select 1 from doctor_leaves dl
      where dl.doctor_id = (select doctor_id from doctor_clinics where id = p_doctor_clinic_id)
        and (dl.clinic_id is null or dl.clinic_id = v_clinic_id)
        and v_day between dl.start_date and dl.end_date
    ) then
      v_day := v_day + 1;
      continue;
    end if;

    for v_schedule in
      select * from doctor_schedules
      where doctor_clinic_id = p_doctor_clinic_id
        and is_active = true
        and day_of_week = extract(dow from v_day)::smallint
    loop
      v_slot_start := v_schedule.start_time;
      while v_slot_start < v_schedule.end_time loop
        v_slot_end := v_slot_start + make_interval(mins => v_schedule.slot_duration_minutes);

        if not exists (
          select 1 from blocked_slots bs
          where bs.doctor_clinic_id = p_doctor_clinic_id
            and bs.date = v_day
            and v_slot_start < bs.end_time
            and v_slot_end > bs.start_time
        ) then
          insert into appointment_slots (doctor_clinic_id, date, start_time, end_time, max_capacity, booked_count, status)
          values (p_doctor_clinic_id, v_day, v_slot_start, v_slot_end, v_schedule.max_patients_per_slot, 0, 'OPEN')
          on conflict (doctor_clinic_id, date, start_time) do nothing;
          if found then
            v_inserted := v_inserted + 1;
          end if;
        end if;

        v_slot_start := v_slot_end;
      end loop;
    end loop;

    v_day := v_day + 1;
  end loop;

  return v_inserted;
end;
$$;

grant execute on function generate_slots_for_doctor_clinic(uuid, integer) to authenticated;

-- ============================================================
-- add_doctor_leave — inserts leave, blocks matching future open slots,
-- returns already-booked appointments in range for manual review
-- ============================================================

create or replace function add_doctor_leave(
  p_doctor_id uuid,
  p_clinic_id uuid,
  p_start_date date,
  p_end_date date,
  p_reason text default null
)
returns setof appointments
security definer
set search_path = public
language plpgsql
as $$
begin
  if not is_clinic_staff(p_clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;

  insert into doctor_leaves (doctor_id, clinic_id, start_date, end_date, reason, created_by)
  values (p_doctor_id, p_clinic_id, p_start_date, p_end_date, p_reason, auth.uid());

  update appointment_slots aslot
  set status = 'BLOCKED'
  from doctor_clinics dc
  where dc.id = aslot.doctor_clinic_id
    and dc.doctor_id = p_doctor_id
    and dc.clinic_id = p_clinic_id
    and aslot.date between p_start_date and p_end_date
    and aslot.status = 'OPEN'
    and aslot.booked_count = 0;

  return query
    select a.* from appointments a
    where a.doctor_id = p_doctor_id
      and a.clinic_id = p_clinic_id
      and a.appointment_date between p_start_date and p_end_date
      and a.status not in ('COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'NO_SHOW', 'REFUNDED');
end;
$$;

grant execute on function add_doctor_leave(uuid, uuid, date, date, text) to authenticated;

-- ============================================================
-- add_blocked_slot — same pattern, scoped to one time range on one date
-- ============================================================

create or replace function add_blocked_slot(
  p_doctor_clinic_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_reason text default null
)
returns setof appointments
security definer
set search_path = public
language plpgsql
as $$
declare
  v_clinic_id uuid;
  v_doctor_id uuid;
begin
  select clinic_id, doctor_id into v_clinic_id, v_doctor_id from doctor_clinics where id = p_doctor_clinic_id;
  if v_clinic_id is null then
    raise exception 'Doctor clinic not found';
  end if;
  if not is_clinic_staff(v_clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;

  insert into blocked_slots (doctor_clinic_id, date, start_time, end_time, reason, created_by)
  values (p_doctor_clinic_id, p_date, p_start_time, p_end_time, p_reason, auth.uid());

  update appointment_slots
  set status = 'BLOCKED'
  where doctor_clinic_id = p_doctor_clinic_id
    and date = p_date
    and start_time < p_end_time
    and end_time > p_start_time
    and status = 'OPEN'
    and booked_count = 0;

  return query
    select a.* from appointments a
    where a.doctor_id = v_doctor_id
      and a.clinic_id = v_clinic_id
      and a.appointment_date = p_date
      and a.appointment_time < p_end_time
      and a.appointment_time >= p_start_time
      and a.status not in ('COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'NO_SHOW', 'REFUNDED');
end;
$$;

grant execute on function add_blocked_slot(uuid, date, time, time, text) to authenticated;

-- ============================================================
-- Appointment/queue lifecycle RPCs (clinic-side)
-- ============================================================

create or replace function checkin_appointment(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $$
declare
  v_appointment appointments%rowtype;
  v_doctor_clinic_id uuid;
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

  return v_appointment;
end;
$$;

grant execute on function checkin_appointment(uuid) to authenticated;

create or replace function call_next_patient(p_doctor_clinic_id uuid, p_date date)
returns queue_entries
security definer
set search_path = public
language plpgsql
as $$
declare
  v_clinic_id uuid;
  v_entry queue_entries%rowtype;
begin
  select clinic_id into v_clinic_id from doctor_clinics where id = p_doctor_clinic_id;
  if not is_clinic_staff(v_clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;

  if exists (
    select 1 from queue_entries
    where doctor_clinic_id = p_doctor_clinic_id and date = p_date and status = 'IN_CONSULTATION'
  ) then
    raise exception 'Complete or mark the current patient before calling the next one';
  end if;

  select * into v_entry from queue_entries
  where doctor_clinic_id = p_doctor_clinic_id and date = p_date and status = 'WAITING'
  order by token_number asc
  limit 1
  for update;

  if not found then
    raise exception 'No patients waiting';
  end if;

  update queue_entries set status = 'IN_CONSULTATION', called_at = now() where id = v_entry.id returning * into v_entry;
  update appointments set status = 'IN_CONSULTATION' where id = v_entry.appointment_id;

  return v_entry;
end;
$$;

grant execute on function call_next_patient(uuid, date) to authenticated;

create or replace function complete_consultation(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $$
declare
  v_appointment appointments%rowtype;
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

  return v_appointment;
end;
$$;

grant execute on function complete_consultation(uuid) to authenticated;

create or replace function mark_no_show(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $$
declare
  v_appointment appointments%rowtype;
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

  return v_appointment;
end;
$$;

grant execute on function mark_no_show(uuid) to authenticated;

create or replace function cancel_appointment_by_clinic(p_appointment_id uuid, p_reason text default null)
returns appointments
security definer
set search_path = public
language plpgsql
as $$
declare
  v_appointment appointments%rowtype;
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

  return v_appointment;
end;
$$;

grant execute on function cancel_appointment_by_clinic(uuid, text) to authenticated;

create or replace function request_reschedule_by_clinic(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $$
declare
  v_appointment appointments%rowtype;
begin
  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if not is_clinic_staff(v_appointment.clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;
  if v_appointment.status in ('COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'NO_SHOW', 'REFUNDED') then
    raise exception 'This appointment can no longer be rescheduled';
  end if;

  update appointments set status = 'RESCHEDULE_REQUESTED' where id = p_appointment_id returning * into v_appointment;
  return v_appointment;
end;
$$;

grant execute on function request_reschedule_by_clinic(uuid) to authenticated;

create or replace function notify_patient_doctor_unavailable(p_appointment_id uuid)
returns notifications
security definer
set search_path = public
language plpgsql
as $$
declare
  v_appointment appointments%rowtype;
  v_doctor_name text;
  v_profile_id uuid;
  v_notification notifications%rowtype;
begin
  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if not is_clinic_staff(v_appointment.clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;

  select full_name into v_doctor_name from doctors where id = v_appointment.doctor_id;
  select profile_id into v_profile_id from patients where id = v_appointment.patient_id;

  insert into notifications (user_id, type, title, body, data)
  values (
    v_profile_id,
    'DOCTOR_UNAVAILABLE',
    'Doctor unavailable for your appointment',
    format('Your appointment with %s may need to be rescheduled because the doctor is unavailable.', v_doctor_name),
    jsonb_build_object('appointmentId', p_appointment_id)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

grant execute on function notify_patient_doctor_unavailable(uuid) to authenticated;

-- ============================================================
-- RLS additions
-- ============================================================

create policy patients_clinic_staff_select on patients for select
  using (
    id in (select a.patient_id from appointments a where is_clinic_staff(a.clinic_id))
  );

-- Patient name/phone/email live on profiles, not patients — clinic staff
-- need the same visibility there for Screens 6/12 to show patient identity.
create policy profiles_clinic_staff_select on profiles for select
  using (
    id in (
      select p.profile_id from patients p
      join appointments a on a.patient_id = p.id
      where is_clinic_staff(a.clinic_id)
    )
  );

create policy clinics_staff_write on clinics for update
  using (
    exists (
      select 1 from clinic_staff cs
      where cs.clinic_id = clinics.id and cs.profile_id = auth.uid() and cs.role = 'CLINIC_ADMIN' and cs.is_active
    )
  )
  with check (
    exists (
      select 1 from clinic_staff cs
      where cs.clinic_id = clinics.id and cs.profile_id = auth.uid() and cs.role = 'CLINIC_ADMIN' and cs.is_active
    )
  );
