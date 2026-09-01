-- Doctor Connect — Phase 2 additions (Patient App backend)
-- Adds: doctors.languages, a doctor_ratings view, and the two
-- security-definer RPCs on appointment booking's critical path
-- (double-booking prevention, PROMPT.md §10/§31). The full recurring
-- schedule -> appointment_slots generator (with leave/blocked-slot
-- exclusion) stays a Phase 5 concern; Phase 2 books against manually
-- seeded slots only.

alter table doctors add column if not exists languages text[] not null default '{}';

-- ============================================================
-- doctor_ratings — real (currently-empty) aggregate instead of fake numbers
-- ============================================================

create or replace view doctor_ratings as
select
  doctor_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*) as review_count
from reviews
where is_hidden = false
group by doctor_id;

-- ============================================================
-- book_appointment — atomic slot lock + insert (double-booking prevention)
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
as $$
declare
  v_patient_id uuid;
  v_slot appointment_slots%rowtype;
  v_doctor_clinic doctor_clinics%rowtype;
  v_doctor_verified verification_status;
  v_clinic_verified verification_status;
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

  return v_appointment;
end;
$$;

grant execute on function book_appointment(uuid, text, uuid) to authenticated;

-- ============================================================
-- cancel_appointment — releases slot capacity atomically
-- ============================================================

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
  if v_appointment.patient_id <> v_patient_id then
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

grant execute on function cancel_appointment(uuid) to authenticated;
