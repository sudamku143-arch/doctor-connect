-- Video-call reminder notifications: a scheduled job that pushes a
-- "your video call is starting" notification to the patient once a VIDEO
-- appointment enters its join window (same 10-minute lead the apps use to
-- enable the "Join Video Call" button — see apps/*/src/lib/format.ts).
--
-- Requires the pg_cron and pg_net extensions, which Supabase supports
-- enabling directly via SQL as the project owner (no superuser needed).

-- Run 0011_video_call_reminder_type.sql first and let it commit — this
-- file's INSERT references the enum value that migration adds.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function send_video_call_reminders()
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  r record;
  v_tokens text[];
begin
  for r in
    select a.id, p.profile_id, d.full_name as doctor_name
    from appointments a
    join patients p on p.id = a.patient_id
    join doctors d on d.id = a.doctor_id
    where a.consultation_type = 'VIDEO'
      and a.status in ('CONFIRMED', 'CHECKED_IN', 'WAITING')
      and a.video_reminder_sent_at is null
      and (a.appointment_date + a.appointment_time)::timestamp - now() <= interval '10 minutes'
      and (a.appointment_date + a.appointment_time)::timestamp >= now() - interval '5 minutes'
  loop
    select array_agg(expo_push_token) into v_tokens
    from push_tokens
    where user_id = r.profile_id and is_active = true;

    if v_tokens is not null and array_length(v_tokens, 1) > 0 then
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'to', v_tokens,
          'title', 'Video call starting soon',
          'body', 'Your video consultation with Dr. ' || coalesce(r.doctor_name, 'your doctor') || ' is about to begin. Tap to join.',
          'data', jsonb_build_object('appointmentId', r.id)
        )
      );
    end if;

    insert into notifications (user_id, type, title, body, data)
    values (
      r.profile_id,
      'VIDEO_CALL_REMINDER',
      'Video call starting soon',
      'Your video consultation with Dr. ' || coalesce(r.doctor_name, 'your doctor') || ' is about to begin.',
      jsonb_build_object('appointmentId', r.id)
    );

    update appointments set video_reminder_sent_at = now() where id = r.id;
  end loop;
end;
$$;

revoke execute on function send_video_call_reminders() from public, authenticated, anon;

select cron.schedule('video-call-reminders', '* * * * *', $cron$select send_video_call_reminders()$cron$);
