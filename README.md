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

The schema lives in `supabase/migrations/0001_init.sql` (initial schema + RLS)
and `supabase/migrations/0002_phase2.sql` (Phase 2: `doctors.languages`, the
`doctor_ratings` view, and the `book_appointment`/`cancel_appointment` RPCs).
Both are applied to the project this repo is currently wired to. To apply
them to a different Supabase project:

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
UI outside `PROMPT.md` §30's MVP list), and the recurring-schedule-to-slots
generator with leave/blocked-slot exclusion (a dedicated Phase 5 concern —
Phase 2 books against manually seeded `appointment_slots` rows instead).

Verified this session: `pnpm typecheck` and `pnpm lint` pass across all 3
apps + 5 packages; `admin-panel` builds via `next build`; `patient-app` and
`clinic-app` both bundle successfully via `expo export`; the schema, Phase 2
migration, and seed data are applied to the live dev Supabase project (no
on-device/emulator check was possible in this environment — visual
confirmation of the actual booking flow on a real device or emulator is still
needed from you).

See `docs/ARCHITECTURE.md` for the full phased roadmap.
