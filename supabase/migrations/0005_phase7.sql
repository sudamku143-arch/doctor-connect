-- Doctor Connect — Phase 7 (Security / RLS hardening pass)
--
-- Critical fix: cancel_appointment (0002_phase2.sql) checked ownership with
-- `if v_appointment.patient_id <> v_patient_id`. When the caller has no
-- `patients` row (every clinic-staff/super-admin account, or an anonymous
-- request), v_patient_id is NULL, `<> NULL` evaluates to NULL, and
-- PL/pgSQL's `IF NULL THEN` is treated as false — the exception never
-- fired, so any authenticated non-patient session could cancel any
-- appointment by id. Every other RPC avoids this because is_clinic_staff()/
-- is_super_admin() are exists()-based and always return true/false, never
-- NULL — this was the one place a direct value comparison was used instead.

create or replace function cancel_appointment(p_appointment_id uuid)
returns appointments
security definer
set search_path = public
language plpgsql
as $$
declare
  v_appointment appointments%rowtype;
  v_patient_id uuid;
begin
  select id into v_patient_id from patients where profile_id = auth.uid();

  select * into v_appointment from appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if v_patient_id is null or v_appointment.patient_id <> v_patient_id then
    raise exception 'You can only cancel your own appointment';
  end if;
  if v_appointment.status in ('COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'NO_SHOW', 'REFUNDED') then
    raise exception 'This appointment can no longer be cancelled';
  end if;

  update appointments set status = 'CANCELLED_BY_PATIENT' where id = p_appointment_id
  returning * into v_appointment;

  update appointment_slots
  set booked_count = greatest(booked_count - 1, 0),
      status = case when status = 'FULL' then 'OPEN' else status end
  where id = v_appointment.slot_id;

  return v_appointment;
end;
$$;

-- ============================================================
-- Close the PUBLIC-execute default: Postgres grants EXECUTE on new
-- functions to PUBLIC automatically (unlike tables). Every RPC below is a
-- mutation entry point never referenced inside an RLS policy, so revoking
-- PUBLIC (leaving the existing `authenticated` grant) is a pure tightening
-- with no behavior change for any legitimate caller. Trigger functions are
-- included for hygiene, even though Postgres won't let them be invoked
-- directly outside trigger context regardless of grants.
-- ============================================================

revoke execute on function handle_new_user() from public;
revoke execute on function set_updated_at() from public;
revoke execute on function book_appointment(uuid, text, uuid) from public;
revoke execute on function cancel_appointment(uuid) from public;
revoke execute on function generate_slots_for_doctor_clinic(uuid, integer) from public;
revoke execute on function add_doctor_leave(uuid, uuid, date, date, text) from public;
revoke execute on function add_blocked_slot(uuid, date, time, time, text) from public;
revoke execute on function checkin_appointment(uuid) from public;
revoke execute on function call_next_patient(uuid, date) from public;
revoke execute on function complete_consultation(uuid) from public;
revoke execute on function mark_no_show(uuid) from public;
revoke execute on function cancel_appointment_by_clinic(uuid, text) from public;
revoke execute on function request_reschedule_by_clinic(uuid) from public;
revoke execute on function notify_patient_doctor_unavailable(uuid) from public;
revoke execute on function create_admin_notification(text, uuid, text, text) from public;

-- is_clinic_staff/is_super_admin ARE referenced inside RLS policy bodies
-- (e.g. patients_clinic_staff_select), so anon still needs EXECUTE for an
-- anonymous read of a protected table to evaluate to "zero rows" instead of
-- erroring out. Revoke the implicit PUBLIC grant, then grant explicitly to
-- both roles that need it, in the same migration so there's no window where
-- a real caller is broken.
revoke execute on function is_clinic_staff(uuid) from public;
grant execute on function is_clinic_staff(uuid) to authenticated, anon;
revoke execute on function is_super_admin() from public;
grant execute on function is_super_admin() to authenticated, anon;

-- ============================================================
-- Tighten patients_modify_own: drop client-side DELETE on a patient's own
-- root identity row (no legitimate use anywhere in the app).
-- ============================================================

drop policy if exists patients_modify_own on patients;
create policy patients_insert_own on patients for insert
  with check (profile_id = auth.uid());
create policy patients_update_own on patients for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ============================================================
-- Tighten notifications_owner: real notifications only ever come from
-- security-definer RPCs (which bypass RLS) — clients should only ever
-- read their own and mark them read, never insert/delete arbitrary rows.
-- ============================================================

drop policy if exists notifications_owner on notifications;
create policy notifications_select_own on notifications for select
  using (user_id = auth.uid());
create policy notifications_update_own on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- Audit logging — makes audit_logs functional for the first time (it has
-- had an enabled RLS policy since 0001_init.sql but nothing ever wrote to
-- it).
-- ============================================================

create or replace function log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb default null,
  p_after jsonb default null
)
returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  if not is_super_admin() then
    raise exception 'Not authorized';
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, before, after)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after);
end;
$$;

revoke execute on function log_admin_action(text, text, uuid, jsonb, jsonb) from public;
grant execute on function log_admin_action(text, text, uuid, jsonb, jsonb) to authenticated;
