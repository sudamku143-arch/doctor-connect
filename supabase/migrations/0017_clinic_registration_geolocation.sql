-- Register Clinic screen: save the clinic's exact coordinates (captured
-- via the new "use my current location" auto-fill) alongside its text
-- address, not just the address string — needed for accurate "Get
-- Directions" in the patient app and for real distance-based nearby-clinic
-- sorting/search, neither of which can work from free-text alone.
--
-- Adding p_latitude/p_longitude as new trailing default-valued parameters
-- is a documented-safe CREATE OR REPLACE FUNCTION change: it replaces the
-- existing 4-arg register_clinic in place rather than creating a second
-- overload, so any caller still passing only the original 4 arguments is
-- unaffected.

create or replace function register_clinic(
  p_clinic_name text,
  p_address text,
  p_city text,
  p_phone text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns clinics
security definer
set search_path = public
language plpgsql
as $func$
declare
  v_profile_id uuid := auth.uid();
  v_patient_id uuid;
  v_clinic clinics%rowtype;
begin
  if v_profile_id is null then
    raise exception 'Not signed in';
  end if;
  if trim(coalesce(p_clinic_name, '')) = '' or trim(coalesce(p_address, '')) = '' or trim(coalesce(p_city, '')) = '' then
    raise exception 'Clinic name, address and city are required';
  end if;
  if exists (select 1 from clinic_staff where profile_id = v_profile_id) then
    raise exception 'This account is already linked to a clinic';
  end if;

  insert into clinics (name, address, city, phone, latitude, longitude)
  values (trim(p_clinic_name), trim(p_address), trim(p_city), nullif(trim(coalesce(p_phone, '')), ''), p_latitude, p_longitude)
  returning * into v_clinic;

  insert into clinic_staff (profile_id, clinic_id, role, is_active)
  values (v_profile_id, v_clinic.id, 'CLINIC_ADMIN', true);

  perform set_config('doctorconnect.allow_role_change', 'true', true);
  update profiles set role = 'CLINIC_ADMIN' where id = v_profile_id;

  -- Clean up the patients row the signup trigger always creates — but only
  -- when it's still untouched (no appointments/reviews against it), so a
  -- rare existing-patient caller can't have real history yanked out from
  -- under them by a foreign-key error or a silent delete.
  select id into v_patient_id from patients where profile_id = v_profile_id;
  if v_patient_id is not null
     and not exists (select 1 from appointments where patient_id = v_patient_id)
     and not exists (select 1 from reviews where patient_id = v_patient_id) then
    delete from patients where id = v_patient_id;
  end if;

  return v_clinic;
end;
$func$;

revoke execute on function register_clinic(text, text, text, text, double precision, double precision) from public;
grant execute on function register_clinic(text, text, text, text, double precision, double precision) to authenticated;
