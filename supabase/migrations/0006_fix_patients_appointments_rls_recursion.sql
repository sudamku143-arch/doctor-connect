-- Fix: infinite recursion (Postgres 42P17) between the `patients` and
-- `appointments` RLS policies.
--
-- patients_clinic_staff_select (0003_phase3.sql) subqueries appointments
-- directly in its USING clause, and appointments_select (0001_init.sql)
-- subqueries patients directly in its USING clause. Evaluating either
-- policy re-triggers the other's RLS, which re-triggers the first again —
-- an infinite loop. This was latent since Phase 3 and surfaced once the
-- admin panel queried `profiles` in a way that pulled in
-- profiles_clinic_staff_select (0003_phase3.sql), which itself joins
-- patients + appointments and hit the same cycle.
--
-- Fix, matching the existing is_clinic_staff()/is_super_admin() pattern:
-- move the appointments lookup into a security-definer function so it
-- resolves without re-entering appointments' RLS.

create or replace function is_clinic_staff_of_patient(target_patient_id uuid)
returns boolean as $$
  select exists (
    select 1 from appointments a
    where a.patient_id = target_patient_id
      and is_clinic_staff(a.clinic_id)
  );
$$ language sql stable security definer set search_path = public;

revoke execute on function is_clinic_staff_of_patient(uuid) from public;
grant execute on function is_clinic_staff_of_patient(uuid) to authenticated, anon;

drop policy if exists patients_clinic_staff_select on patients;
create policy patients_clinic_staff_select on patients for select
  using (is_clinic_staff_of_patient(id));

drop policy if exists profiles_clinic_staff_select on profiles;
create policy profiles_clinic_staff_select on profiles for select
  using (
    id in (
      select p.profile_id from patients p
      where is_clinic_staff_of_patient(p.id)
    )
  );
