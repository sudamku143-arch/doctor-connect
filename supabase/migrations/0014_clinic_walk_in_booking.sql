-- Clinic App "New Appointment" quick-booking (Phase 8, Quick Actions).
--
-- Lets a receptionist book an appointment on behalf of a registered patient
-- who has no prior visit at this clinic yet. The existing patients_select
-- RLS only exposes patients with appointment history at the staff's own
-- clinic (0006_fix_patients_appointments_rls_recursion.sql) — by design, to
-- stop one clinic's staff from browsing every patient in the system. That
-- means a plain table search can't find a genuinely new-to-this-clinic
-- patient, so booking needs a narrow, purpose-built lookup instead of a
-- broader RLS relaxation: exact/partial name-or-phone match, returning only
-- the fields needed to find and verify the right person (never full patient
-- records), and only to a caller who is already staff at *some* clinic.

create or replace function find_patients_for_booking(p_clinic_id uuid, p_query text)
returns table (
  patient_id uuid,
  full_name text,
  phone text,
  gender text,
  date_of_birth date
)
security definer
set search_path = public
language plpgsql
as $func$
begin
  if not is_clinic_staff(p_clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;
  if trim(p_query) = '' then
    return;
  end if;

  return query
    select pt.id, pr.full_name, pr.phone, pt.gender::text, pt.date_of_birth
    from patients pt
    join profiles pr on pr.id = pt.profile_id
    where pr.full_name ilike '%' || trim(p_query) || '%'
       or pr.phone ilike '%' || trim(p_query) || '%'
    limit 20;
end;
$func$;

revoke execute on function find_patients_for_booking(uuid, text) from public;
grant execute on function find_patients_for_booking(uuid, text) to authenticated;

-- Mirrors book_appointment (0007/0013) but for a receptionist booking on
-- behalf of a patient instead of the patient booking for themselves:
-- no auth.uid()-as-patient lookup, patient_id is a parameter, no family
-- member support (walk-ins book for themselves), and booking_source is
-- 'WALK_IN' instead of 'ONLINE'.
create or replace function book_appointment_by_clinic(
  p_patient_id uuid,
  p_slot_id uuid,
  p_consultation_type consultation_type default 'PHYSICAL',
  p_reason text default null
)
returns appointments
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_slot appointment_slots%rowtype;
  v_doctor_clinic doctor_clinics%rowtype;
  v_doctor_verified verification_status;
  v_doctor_mode consultation_mode;
  v_clinic_verified verification_status;
  v_doctor_name text;
  v_clinic_name text;
  v_patient_profile_id uuid;
  v_patient_name text;
  v_next_token integer;
  v_appointment appointments%rowtype;
begin
  select * into v_slot from appointment_slots where id = p_slot_id for update;
  if not found then
    raise exception 'Slot not found';
  end if;

  select * into v_doctor_clinic from doctor_clinics where id = v_slot.doctor_clinic_id;

  if not is_clinic_staff(v_doctor_clinic.clinic_id) then
    raise exception 'Not authorized for this clinic';
  end if;

  select profile_id into v_patient_profile_id from patients where id = p_patient_id;
  if v_patient_profile_id is null then
    raise exception 'Patient not found';
  end if;

  if v_slot.status <> 'OPEN' or v_slot.booked_count >= v_slot.max_capacity then
    raise exception 'Slot is no longer available';
  end if;

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
    v_slot.id, p_patient_id, null, v_doctor_clinic.doctor_id, v_doctor_clinic.clinic_id,
    v_slot.date, v_slot.start_time, v_next_token, 'CONFIRMED',
    'WALK_IN', p_reason, p_consultation_type
  )
  returning * into v_appointment;

  update appointment_slots
  set booked_count = booked_count + 1,
      status = case when booked_count + 1 >= max_capacity then 'FULL' else status end
  where id = v_slot.id;

  select full_name into v_doctor_name from doctors where id = v_doctor_clinic.doctor_id;
  select name into v_clinic_name from clinics where id = v_doctor_clinic.clinic_id;
  select full_name into v_patient_name from profiles where id = v_patient_profile_id;

  insert into notifications (user_id, type, title, body, data)
  values (
    v_patient_profile_id,
    'BOOKING_CONFIRMATION',
    'Appointment confirmed',
    'Your ' || (case when p_consultation_type = 'VIDEO' then 'video' else 'in-clinic' end)
      || ' appointment with ' || coalesce(v_doctor_name, 'the doctor') || ' at ' || coalesce(v_clinic_name, 'the clinic')
      || ' on ' || to_char(v_slot.date, 'DD Mon YYYY') || ' is confirmed.',
    jsonb_build_object('appointmentId', v_appointment.id)
  );

  insert into activity_log (clinic_id, type, message, appointment_id, actor_id)
  values (
    v_doctor_clinic.clinic_id,
    'NEW_BOOKING',
    'Walk-in booking -- ' || coalesce(v_patient_name, 'Patient') || ' with Dr. ' || coalesce(v_doctor_name, 'doctor'),
    v_appointment.id,
    auth.uid()
  );

  return v_appointment;
end;
$func$;

revoke execute on function book_appointment_by_clinic(uuid, uuid, consultation_type, text) from public;
grant execute on function book_appointment_by_clinic(uuid, uuid, consultation_type, text) to authenticated;
