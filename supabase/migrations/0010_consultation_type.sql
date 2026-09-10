-- Consultation type selection (Video vs Physical), PROMPT.md feature request.
--
-- Two independent settings:
--   doctors.consultation_mode   — what a doctor is willing to offer at all
--                                  ('BOTH' | 'PHYSICAL_ONLY'), set by admin.
--   appointments.consultation_type — what the patient actually picked for
--                                  this booking ('VIDEO' | 'PHYSICAL').
-- Both default to the safest/most-common value so existing rows and any
-- caller that doesn't pass one keep working unchanged.

create type consultation_mode as enum ('BOTH', 'PHYSICAL_ONLY');
create type consultation_type as enum ('VIDEO', 'PHYSICAL');

alter table doctors add column if not exists consultation_mode consultation_mode not null default 'BOTH';
alter table appointments add column if not exists consultation_type consultation_type not null default 'PHYSICAL';

-- ============================================================
-- book_appointment — now takes p_consultation_type and rejects VIDEO
-- against a PHYSICAL_ONLY doctor (server-side, never trust the client here:
-- the same doctor could switch to PHYSICAL_ONLY between the patient loading
-- the booking screen and confirming).
-- ============================================================

drop function if exists book_appointment(uuid, text, uuid);

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

  return v_appointment;
end;
$func$;

grant execute on function book_appointment(uuid, text, uuid, consultation_type) to authenticated;
revoke execute on function book_appointment(uuid, text, uuid, consultation_type) from public;
