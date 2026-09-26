-- Profile photo upload (Clinic App Profile redesign). Public bucket since
-- an avatar is shown freely across the UI (same trust level as a doctor
-- photo); only the owning user can write/replace their own object, keyed
-- by their own auth uid as the path prefix so RLS needs no extra lookup —
-- same shape as the "prescriptions" bucket's clinic-id-prefixed path
-- (0008_prescriptions.sql), just owner-scoped instead of clinic-scoped.
-- Named generically ("avatars", not "clinic-avatars") so the patient app
-- can reuse the same bucket for its own profile photos later.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_bucket_public_read on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_bucket_owner_insert on storage.objects for insert
  with check (bucket_id = 'avatars' and (split_part(name, '/', 1))::uuid = auth.uid());

create policy avatars_bucket_owner_update on storage.objects for update
  using (bucket_id = 'avatars' and (split_part(name, '/', 1))::uuid = auth.uid());

create policy avatars_bucket_owner_delete on storage.objects for delete
  using (bucket_id = 'avatars' and (split_part(name, '/', 1))::uuid = auth.uid());
