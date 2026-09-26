-- Clinic App self-serve "Register your clinic" flow.
--
-- Security note found while building this: `profiles_update_own`
-- (0001_init.sql) is `using (id = auth.uid())` with no WITH CHECK at all,
-- so any signed-in user could currently call
-- `update profiles set role = 'SUPER_ADMIN' where id = auth.uid()` directly
-- from the client and self-escalate — role was never meant to be
-- client-writable, it just had no guard yet because nothing needed to
-- change its own role before now. This migration closes that hole with a
-- BEFORE UPDATE trigger, and gives register_clinic() a narrow, explicit,
-- audited way through it (a transaction-local flag a trigger checks for —
-- the standard Postgres pattern for "this one security-definer path may
-- do the thing a general guard blocks").

create or replace function prevent_self_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and not is_super_admin()
     and coalesce(current_setting('doctorconnect.allow_role_change', true), 'false') <> 'true' then
    raise exception 'Role cannot be changed directly';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
  before update on profiles
  for each row execute function prevent_self_role_change();

-- ============================================================
-- register_clinic — turns the just-signed-up caller into the CLINIC_ADMIN
-- of a brand-new clinic. Called right after supabase.auth.signUp() while
-- the trigger-created profile is still fresh (role='PATIENT', an empty
-- patients row, no clinic_staff link yet).
-- ============================================================

create or replace function register_clinic(
  p_clinic_name text,
  p_address text,
  p_city text,
  p_phone text default null
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

  insert into clinics (name, address, city, phone)
  values (trim(p_clinic_name), trim(p_address), trim(p_city), nullif(trim(coalesce(p_phone, '')), ''))
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

revoke execute on function register_clinic(text, text, text, text) from public;
grant execute on function register_clinic(text, text, text, text) to authenticated;
