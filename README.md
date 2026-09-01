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
  migrations/         SQL schema + RLS (not yet applied to any live project)
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

The schema lives in `supabase/migrations/0001_init.sql`. It has **not** been
applied to any live project yet. To apply it to your own Supabase project:

```bash
# via the Supabase CLI, from the project root
supabase link --project-ref <your-project-ref>
supabase db push
```

Dev-only seed data (specialties + a demo clinic/doctor) is in
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

**Phase 1 complete and verified**: monorepo scaffold, design system tokens,
navigation shells, and Supabase-Auth-wired login/signup screens for all three
apps. No live Supabase project is wired up yet — every screen beyond auth
uses static placeholder data until Phase 2 (Patient app backend) begins. See
`docs/ARCHITECTURE.md` for the full phased roadmap.

Verified this session: `pnpm typecheck` and `pnpm lint` pass across all
3 apps + 5 packages; `admin-panel` builds via `next build`; `patient-app` and
`clinic-app` both bundle successfully via `expo export` (no on-device/emulator
check was possible in this environment — visual confirmation on a real device
or emulator is still needed from you).

One fix worth noting: both Expo apps' `metro.config.js` had
`resolver.disableHierarchicalLookup = true`, added to stop a sibling
package's React version from shadowing the app's own — but it actually broke
resolution of nested transitive deps (e.g. `@expo/metro-runtime`, pulled in
transitively via `expo-router`), which live inside another package's own
`node_modules` rather than at the app or workspace root. That's a real bundling
failure, not a false-positive lint. Removed the override; `expo-doctor` still
flags one duplicate-`react-native`-instance warning for `packages/ui-native`
(same version, different pnpm peer-resolution hash for an unrelated peer,
`@react-native/metro-config`) — confirmed via `expo export` that this does not
actually break bundling, so it's left as-is rather than forcing exotic pnpm
overrides for a cosmetic warning.
