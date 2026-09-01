-- Doctor Connect — Phase 4 additions (Admin Panel backend)
-- Adds: super-admin write policies (doctors/clinics/staff/reviews — none of
-- these had an admin write path before; doctors/clinics had no creation
-- path anywhere in the app), a tightened reviews_owner_write policy (only
-- COMPLETED appointments may be reviewed, per PROMPT.md §7 — previously
-- unenforced), widened clinic RPCs so a super admin can also cancel/
-- reschedule, and an admin notification RPC.

alter type notification_type add value if not exists 'SYSTEM_MESSAGE';

-- ============================================================
-- Doctor management
-- ============================================================

create policy doctors_admin_write on doctors for insert
  with check (is_super_admin());
create policy doctors_admin_update on doctors for update
  using (is_super_admin())
  with check (is_super_admin());

create policy doctor_specialties_admin_write on doctor_specialties for insert
  with check (is_super_admin());
create policy doctor_specialties_admin_delete on doctor_specialties for delete
  using (is_super_admin());

create policy doctor_clinics_admin_write on doctor_clinics for insert
  with check (is_super_admin());
create policy doctor_clinics_admin_update on doctor_clinics for update
  using (is_super_admin())
  with check (is_super_admin());

-- ============================================================
-- Clinic management (additive to Phase 3's clinics_staff_write)
-- ============================================================

create policy clinics_admin_write on clinics for insert
  with check (is_super_admin());
create policy clinics_admin_update on clinics for update
  using (is_super_admin())
  with check (is_super_admin());

-- ============================================================
-- Receptionist management — assign an existing user, not create a login
-- (no service-role key this phase; see docs/ARCHITECTURE.md)
-- ============================================================

create policy clinic_staff_admin_write on clinic_staff for insert
  with check (is_super_admin());
create policy clinic_staff_admin_update on clinic_staff for update
  using (is_super_admin())
  with check (is_super_admin());

-- ============================================================
-- Reviews: admin moderation + tightened patient-write rule
-- ============================================================

create policy reviews_admin_moderate on reviews for update
  using (is_super_admin())
  with check (is_super_admin());

drop policy if exists reviews_owner_write on reviews;
create policy reviews_owner_write on reviews for insert
  with check (
    patient_id in (select id from patients where profile_id = auth.uid())
    and exists (
      select 1 from appointments a
      where a.id = reviews.appointment_id
        and a.patient_id = reviews.patient_id
        and a.status = 'COMPLETED'
    )
  );

-- ============================================================
-- Widen clinic-side cancel/reschedule RPCs to also allow a super admin
-- ============================================================

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
  if not (is_clinic_staff(v_appointment.clinic_id) or is_super_admin()) then
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
  if not (is_clinic_staff(v_appointment.clinic_id) or is_super_admin()) then
    raise exception 'Not authorized for this clinic';
  end if;
  if v_appointment.status in ('COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'NO_SHOW', 'REFUNDED') then
    raise exception 'This appointment can no longer be rescheduled';
  end if;

  update appointments set status = 'RESCHEDULE_REQUESTED' where id = p_appointment_id returning * into v_appointment;
  return v_appointment;
end;
$$;

-- ============================================================
-- Admin-issued notifications
-- ============================================================

create or replace function create_admin_notification(
  p_target_type text,
  p_target_id uuid,
  p_title text,
  p_body text
)
returns integer
security definer
set search_path = public
language plpgsql
as $$
declare
  v_count integer := 0;
begin
  if not is_super_admin() then
    raise exception 'Not authorized';
  end if;

  if p_target_type = 'PATIENT' then
    insert into notifications (user_id, type, title, body)
    values (p_target_id, 'SYSTEM_MESSAGE', p_title, p_body);
    v_count := 1;
  elsif p_target_type = 'CLINIC_STAFF' then
    insert into notifications (user_id, type, title, body)
    select cs.profile_id, 'SYSTEM_MESSAGE', p_title, p_body
    from clinic_staff cs
    where cs.clinic_id = p_target_id and cs.is_active = true;
    get diagnostics v_count = row_count;
  elsif p_target_type = 'ALL_PATIENTS' then
    insert into notifications (user_id, type, title, body)
    select p.id, 'SYSTEM_MESSAGE', p_title, p_body
    from profiles p
    where p.role = 'PATIENT';
    get diagnostics v_count = row_count;
  else
    raise exception 'Unknown notification target type: %', p_target_type;
  end if;

  return v_count;
end;
$$;

grant execute on function create_admin_notification(text, uuid, text, text) to authenticated;
