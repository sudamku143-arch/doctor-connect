-- Split into its own migration (run + committed before 0012) because
-- Postgres will not let a newly-added enum value be referenced by an
-- INSERT in the same transaction that added it.

alter type notification_type add value if not exists 'VIDEO_CALL_REMINDER';
alter table appointments add column if not exists video_reminder_sent_at timestamptz;
