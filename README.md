# Doctor Connect

A production-ready Doctor Appointment Platform: a Patient mobile app, a
Clinic/Receptionist mobile app, and an Admin web panel, backed by Supabase.
See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full architecture
proposal, database schema, and phased roadmap. This is a clean, standalone
project — not connected to or dependent on any other project.

## Structure

```
apps/
  patient-app/     Expo (React Native) — patients search, book, and manage appointments
  clinic-app/       Expo (React Native) — receptionists manage schedule, queue, check-in
  admin-panel/       Next.js — platform admin: verification, oversight, reports
packages/
  theme/             design tokens (colors, spacing, typography, radii, shadows)
  ui-native/          shared RN components (patient-app + clinic-app)
  types/             shared TS enums + DB row types
  validation/         shared zod schemas
  config/             shared eslint rules
supabase/
  migrations/         SQL schema + RLS (applied to the dev Supabase project)
  seed/               dev-only seed data
```

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A Supabase project (for auth/DB) — see "Environment variables" below
- Expo Go app or an Android/iOS emulator, to run the mobile apps

## Setup

```bash
pnpm install
```

## Running each app

```bash
pnpm dev:patient   # Expo dev server for the Patient app
pnpm dev:clinic    # Expo dev server for the Clinic/Receptionist app
pnpm dev:admin     # Next.js dev server for the Admin panel (http://localhost:3000)
```

## Environment variables

Each app reads its Supabase URL/anon key from its own env file — copy the
`.env.example` in that app to `.env.local` and fill in real values:

- `apps/patient-app/.env.example` → `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `apps/clinic-app/.env.example` → same two variables
- `apps/admin-panel/.env.example` → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit `.env.local` files or the Supabase **service-role** key anywhere
in this repo — only the public URL and anon key belong in client apps.

## Database

The schema lives in `supabase/migrations/0001_init.sql` (initial schema + RLS),
`supabase/migrations/0002_phase2.sql` (Phase 2: `doctors.languages`, the
`doctor_ratings` view, and the `book_appointment`/`cancel_appointment` RPCs),
`supabase/migrations/0003_phase3.sql` (Phase 3: the leave/blocked-slot-
aware `generate_slots_for_doctor_clinic` generator, the
`add_doctor_leave`/`add_blocked_slot` RPCs that keep slots in sync, the
queue/check-in/consultation RPCs, clinic-side cancellation/reschedule, and
two RLS additions so clinic staff can see their own patients' names), and
`supabase/migrations/0004_phase4.sql` (Phase 4: super-admin write policies
for doctors/clinics/clinic_staff/reviews — none had an admin write path
before; a tightened `reviews_owner_write` that only allows reviewing a
`COMPLETED` appointment; `cancel_appointment_by_clinic`/
`request_reschedule_by_clinic` widened to also allow a super admin; the
`create_admin_notification` RPC; and the new `SYSTEM_MESSAGE` notification
type), and `supabase/migrations/0005_phase7.sql` (Phase 7: a critical fix to
`cancel_appointment`'s ownership check, `PUBLIC`-execute revoked from every
RPC, two RLS policies tightened to drop unused delete/insert capability, and
the `log_admin_action` RPC that makes `audit_logs` functional for the first
time — see the "Phase 7 audit findings" section of `docs/ARCHITECTURE.md`
for the full writeup). All five are applied to the project this repo is
currently wired to. To apply them to a different Supabase project:

```bash
# via the Supabase CLI, from the project root
supabase link --project-ref <your-project-ref>
supabase db push
```

...or paste each migration file's contents into that project's SQL Editor, in
order — the same way they were applied here, since that avoids needing the
project's DB password in this environment.

Dev-only seed data (specialties, a demo clinic/doctor, and ~14 days of
bookable `appointment_slots` for that demo doctor) is in
`supabase/seed/seed.sql` — run it manually against a dev database only, never
against production.

### First Super Admin

There is no public signup flow for admin/clinic-staff roles by design (see
`docs/ARCHITECTURE.md` §3). To create the first Super Admin:

1. Create a user via the Supabase Auth dashboard (or have them sign up once
   through any app's flow).
2. In the SQL editor, update their `profiles.role` to `'SUPER_ADMIN'`.

### First clinic staff account

There's still no receptionist/clinic-admin *signup* — the Admin Panel's
Receptionists section (Phase 4) can only assign an **already-registered**
user as staff (it needs the Supabase service-role key to create a brand-new
login, which isn't configured in this environment — see Settings in the
admin panel). So the very first clinic staff account still needs the manual
SQL step below; after that, promoting further staff can be done from the
Admin Panel itself (Receptionists → Assign Staff, by the user's email).

1. Create a user the same way as the Super Admin above (Auth dashboard, or
   sign up once through any app).
2. In the SQL editor:
   ```sql
   update profiles set role = 'CLINIC_ADMIN' where id = '<their auth user id>';
   insert into clinic_staff (profile_id, clinic_id, role)
   values ('<their auth user id>', '00000000-0000-0000-0000-000000000001', 'CLINIC_ADMIN');
   ```
   (`00000000-0000-0000-0000-000000000001` is the seeded demo clinic from
   `supabase/seed/seed.sql`.)
3. Log into the clinic app with that account.

Note: the `handle_new_user` trigger also creates a `patients` row for every
new `auth.users` insert, including staff accounts — harmless but unused.
Revisit once/if the service-role key is wired up and receptionist creation
stops going through the patient-signup trigger path.

## Checks

```bash
pnpm typecheck   # tsc --noEmit across every app + package
pnpm lint        # eslint across every app + package
```

## Status

**Phase 1 complete**: monorepo scaffold, design system tokens, navigation
shells, and Supabase-Auth-wired login/signup screens for all three apps.

**Phase 2 complete**: the Patient App is wired to a live Supabase project —
every screen from Search through Profile (`PROMPT.md` Screens 5–18) reads and
writes real data instead of placeholders. Booking goes straight to
`CONFIRMED` with no payment gate (Razorpay is Phase 6); double-booking
prevention is enforced server-side via the `book_appointment`/
`cancel_appointment` RPCs (`supabase/migrations/0002_phase2.sql`), which
atomically lock the slot row rather than trusting a client-side check.

Scope intentionally deferred past Phase 2 (see the Phase 2 plan for the full
reasoning): distance-based search filter/sort (no geolocation capture yet),
Add to Calendar and profile-photo upload (both need a new native module for
UI outside `PROMPT.md` §30's MVP list). The recurring-schedule-to-slots
generator originally slated for Phase 5 was pulled forward and built for real
in Phase 3 instead (see below).

**Phase 3 complete**: the Clinic/Receptionist App is wired to the same
Supabase project — Dashboard, Today's Queue, Appointments, Appointment
Details, Doctor Schedule, Add Availability, Doctor Leave, Block Slot,
Affected Appointments, Patient Management, Clinic Profile, and Receptionist
Profile (`PROMPT.md` Screens 2–3, 5–14) all read and write real data.
`generate_slots_for_doctor_clinic` (`supabase/migrations/0003_phase3.sql`)
turns a saved weekly schedule into real bookable slots, skipping days/times
already covered by a doctor leave or blocked slot; marking a leave or
blocking a slot immediately closes matching future open, unbooked slots
without ever touching an existing booking — those surface on the Affected
Appointments screen for a manual Notify/Reschedule/Cancel decision, never a
silent change. Queue check-in/call-next/complete/no-show and clinic-side
cancel/reschedule are all RPCs authorized against the caller's own
`clinic_staff` row, never a raw client table write.

**Explicit, confirmed scope decision overriding `PROMPT.md`'s own listed
features**: no walk-in patient support. `PROMPT.md` calls for it in §1, §6
Screen 4, §16, and §30's Clinic MVP list, but the user asked for it to be
removed entirely — every appointment the clinic app manages was booked
online through the Patient App. `appointments.booking_source`'s `WALK_IN`
enum value stays defined (harmless, not worth an enum-drop migration) but
nothing writes it.

**Phase 4 complete**: the Admin Panel is wired to the same Supabase project —
Dashboard (real stats + `recharts` charts), Doctors, Clinics, Receptionists,
Patients, Appointments, Payments, Reviews, Notifications, Reports, and
Settings (`PROMPT.md` §7) all read and write real data. Since there's no
Doctor app and no clinic self-registration anywhere in the platform, the
Admin Panel is also where doctors and clinics actually get created (Add
Doctor / Add Clinic), not just verified — the literal screen spec assumes
they already exist. `app/(dashboard)/layout.tsx` also got a real auth guard
for the first time (`proxy.ts` — Next.js 16 renamed `middleware.ts`, see
`node_modules/next/dist/docs`); before Phase 4, any authenticated user, not
just a Super Admin, could reach `/dashboard`.

**Confirmed, scoped-down capability**: creating a brand-new receptionist
*login* and suspending/banning a patient or staff *login* both need the
Supabase service-role key, and the user chose to skip sharing it this phase.
Receptionist Management instead assigns an already-registered user (found by
email) to a clinic, changes their role, and toggles `clinic_staff.is_active`
(a real access cutoff — `is_clinic_staff()` checks it — just not an
auth-level ban). Patient account suspension is dropped from this phase
entirely; both are documented in Settings and revisitable once the key is
available.

**Patient App addition**: a small "Leave a Review" action on a `COMPLETED`
appointment (rating + comment) — Phase 2 never built review submission (not
in the Patient MVP list), so without this the Admin Reviews screen would
have nothing to moderate. `reviews_owner_write` was also tightened
(`0004_phase4.sql`) to actually enforce "only completed appointments may be
reviewed," which was previously unenforced server-side.

**Phase 6 (Razorpay) is on hold** — no Razorpay account set up yet — and
will be picked up once one exists. Skipped ahead to Phase 7.

**Phase 7 complete**: a full security/RLS audit against `PROMPT.md` §14's
checklist. Found and fixed one critical, concretely exploitable bug — see
`docs/ARCHITECTURE.md`'s "Phase 7 audit findings" for the complete
writeup, but in short: `cancel_appointment` let any already-authenticated
non-patient session (which includes every clinic-staff and super-admin
account in this project) cancel any patient's appointment, due to a `NULL`-
comparison bug in its ownership check. Also revoked the `PUBLIC`-execute
default Postgres grants to every function on creation (unlike tables),
tightened two overly-broad RLS policies, and wired up `audit_logs` (which
had existed since Phase 1 with nothing ever writing to it) into the Admin
Panel's access/status-changing actions, viewable at `/settings/audit-log`.
Rate limiting and storage-bucket policies are documented as intentionally
not built yet (no custom backend server or file upload exists to secure),
rather than stubbed.

Also fixed as housekeeping found during the audit: `apps/clinic-app` and
`apps/admin-panel` never had their own `.env.local` (only `patient-app`'s
was created, back in Phase 2) — both apps were never actually runnable
locally in this environment until now.

Verified this session: `pnpm typecheck` and `pnpm lint` pass across all 3
apps + 5 packages; `admin-panel` builds via `next build` (all 21 routes);
`patient-app` and `clinic-app` both bundle successfully via `expo export`;
the schema and all five migrations, plus seed data, are applied to the live
dev Supabase project (no on-device/emulator or browser check was possible in
this environment — visual confirmation of the actual admin flows, and the
patient-app review flow, on a real device/browser is still needed from you).

See `docs/ARCHITECTURE.md` for the full phased roadmap.
