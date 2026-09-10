-- Patient App fixes: booking/cancellation now write a real notification row
-- (so the Notifications tab has actual content instead of always being
-- empty), and cancellation now records a reason.

alter table appointments add column if not exists cancellation_reason text;

-- ============================================================
-- book_appointment — now also inserts a BOOKING_CONFIRMATION notification
-- ============================================================
create or replace function book_appointment(
  p_slot_id uuid,
  p_reason text default null,
  p_family_member_id uuid default null
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
  v_clinic_verified verification_status;
  v_doctor_name text;
  v_clinic_name text;
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
  select verification_status into v_doctor_verified from doctors where id = v_doctor_clinic.doctor_id;
  select verification_status into v_clinic_verified from clinics where id = v_doctor_clinic.clinic_id;
  if v_doctor_verified <> 'VERIFIED' or v_clinic_verified <> 'VERIFIED' or not v_doctor_clinic.is_active then
    raise exception 'Doctor or clinic is not currently bookable';
  end if;

  select coalesce(max(token_number), 0) + 1 into v_next_token
  from appointments
  where doctor_id = v_doctor_clinic.doctor_id
    and clinic_id = v_doctor_clinic.clinic_id
    and appointment_date = v_slot.date;

  insert into appointments (
    slot_id, patient_id, family_member_id, doctor_id, clinic_id,
    appointment_date, appointment_time, token_number, status,
    booking_source, reason_for_visit
  ) values (
    v_slot.id, v_patient_id, p_family_member_id, v_doctor_clinic.doctor_id, v_doctor_clinic.clinic_id,
    v_slot.date, v_slot.start_time, v_next_token, 'CONFIRMED',
    'ONLINE', p_reason
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
    'Your appointment with ' || coalesce(v_doctor_name, 'the doctor') || ' at ' || coalesce(v_clinic_name, 'the clinic')
      || ' on ' || to_char(v_slot.date, 'DD Mon YYYY') || ' is confirmed.',
    jsonb_build_object('appointmentId', v_appointment.id)
  );

  return v_appointment;
end;
$func$;

-- ============================================================
-- cancel_appointment — now takes an optional reason and inserts a
-- CANCELLATION notification
-- ============================================================
create or replace function cancel_appointment(p_appointment_id uuid, p_reason text default null)
returns appointments
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_appointment appointments%rowtype;
  v_patient_id uuid;
  v_doctor_name text;
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

  update appointments
  set status = 'CANCELLED_BY_PATIENT', cancellation_reason = p_reason
  where id = p_appointment_id
  returning * into v_appointment;

  update appointment_slots
  set booked_count = greatest(booked_count - 1, 0),
      status = case when status = 'FULL' then 'OPEN' else status end
  where id = v_appointment.slot_id;

  select full_name into v_doctor_name from doctors where id = v_appointment.doctor_id;
  insert into notifications (user_id, type, title, body, data)
  values (
    auth.uid(),
    'CANCELLATION',
    'Appointment cancelled',
    'Your appointment with ' || coalesce(v_doctor_name, 'the doctor') || ' on '
      || to_char(v_appointment.appointment_date, 'DD Mon YYYY') || ' has been cancelled.',
    jsonb_build_object('appointmentId', v_appointment.id)
  );

  return v_appointment;
end;
$func$;

grant execute on function cancel_appointment(uuid, text) to authenticated;
revoke execute on function cancel_appointment(uuid) from authenticated, anon, public;
