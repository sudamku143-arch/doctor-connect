# Doctor Connect — Architecture Proposal + Phase 1 Plan

## Context

PROMPT.md specifies a from-scratch, production-grade Doctor Appointment Platform: a Patient mobile app, a Clinic/Receptionist mobile app, and an Admin web panel, backed by Supabase, with Razorpay payments and a receptionist-centric operational model (no Doctor app in V1). The spec's own "First Task" (§32) requires proposing architecture, DB schema, auth/RBAC, appointment/slot/queue design, notifications, and a phased roadmap *before* writing code, and flagging decisions I shouldn't silently invent. This plan is that proposal, plus a concrete, file-level plan for Phase 1 (§22): project setup, design system, navigation, auth, basic UI.

Confirmed with the user before writing this plan:
- **Tooling**: pnpm workspaces + Turborepo.
- **Auth (V1)**: Email + password only (phone OTP deferred — no SMS vendor cost/setup now).
- **Backend accounts**: User already has Supabase and Render accounts; Razorpay not set up yet (fine — payments are Phase 6). Supabase URL/anon key will be pasted in chat when we reach the auth-wiring step.
- **Git**: Initialize now, to checkpoint progress phase by phase.

---

## 1. Monorepo & Folder Structure

```
doctor-connect/
  apps/
    patient-app/        Expo (RN) + TS + Expo Router
    clinic-app/          Expo (RN) + TS + Expo Router
    admin-panel/          Next.js + TS
  packages/
    theme/               framework-agnostic design tokens (colors, spacing, radii, shadows, type scale)
    ui-native/            shared RN components for patient-app + clinic-app (Button, Card, Badge, Input, BottomSheet, EmptyState...)
    types/               shared TS types/enums (Role, AppointmentStatus, PaymentStatus, DB row types)
    validation/           shared zod schemas (auth forms, patient details, etc.)
    config/               shared tsconfig base + eslint config
  supabase/
    migrations/           SQL migrations (schema, RLS, functions)
    functions/             Edge Functions (booking RPC, slot generation, notification dispatch)
    seed/                  dev seed data (specialties, demo clinic/doctor)
  docs/
    ARCHITECTURE.md        living copy of this proposal for later phases
  pnpm-workspace.yaml, turbo.json, package.json, tsconfig.base.json, .gitignore, README.md
```

**Deviation from §21's literal `packages/ui`**: split into `packages/theme` (tokens, usable everywhere including Next.js) + `packages/ui-native` (RN components, used only by the two Expo apps). Plain React Native components aren't directly renderable in Next.js without a `react-native-web` setup, which the spec doesn't ask for — admin-panel gets its own local component folder that consumes `packages/theme` so all three apps stay visually consistent (shared colors/spacing/type) without forcing cross-framework component sharing.

Admin panel components live at `apps/admin-panel/components/` (only one consumer — a package would be premature).

---

## 2. Database Schema (Postgres via Supabase)

All tables use UUID PKs, `created_at`/`updated_at` timestamps, FKs with indexes on `doctor_id`, `clinic_id`, `patient_id`, `appointment_date`, `status`, `slot_id` per §12.

| Table | Purpose / key columns |
|---|---|
| `profiles` | id = auth.users.id, role enum(PATIENT, RECEPTIONIST, CLINIC_ADMIN, SUPER_ADMIN), full_name, phone, email, avatar_url |
| `patients` | profile_id FK, date_of_birth, gender, address |
| `family_members` | patient_id FK, name, relation, dob, gender — for booking on behalf of family |
| `doctors` | full_name, qualification, registration_number, bio, photo_url, experience_years, verification_status enum(PENDING, VERIFIED, REJECTED, SUSPENDED). No `profile_id` requirement — doctors don't log in in V1; managed by clinic_admin/admin |
| `specialties` | name, slug, icon |
| `doctor_specialties` | doctor_id, specialty_id (composite PK) |
| `clinics` | name, address, city, lat/lng, phone, photos, timings jsonb, verification_status enum(PENDING, VERIFIED, REJECTED, SUSPENDED) |
| `doctor_clinics` | doctor_id, clinic_id, consultation_fee, is_active — doctor can practice at multiple clinics with different fees |
| `clinic_staff` | profile_id, clinic_id, role enum(RECEPTIONIST, CLINIC_ADMIN), is_active — scopes RBAC to one clinic |
| `doctor_schedules` | doctor_clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients_per_slot — recurring weekly template |
| `doctor_leaves` | doctor_id, clinic_id (nullable), start_date, end_date, reason, created_by |
| `blocked_slots` | doctor_clinic_id, date, start_time, end_time, reason, created_by |
| `appointment_slots` | doctor_clinic_id, date, start_time, end_time, max_capacity, booked_count, status enum(OPEN, FULL, BLOCKED) — materialized from doctor_schedules; the atomic unit for double-booking prevention |
| `appointments` | slot_id FK, patient_id, family_member_id (nullable), doctor_id, clinic_id, appointment_date/time, token_number, status enum (11 values from §9), booking_source enum(ONLINE, WALK_IN), reason_for_visit |
| `payments` | appointment_id, razorpay_order_id/payment_id, amount, platform_fee, clinic_amount, status enum(CREATED, PENDING, SUCCESS, FAILED, REFUND_PENDING, REFUNDED) |
| `refunds` | payment_id, amount, reason, status, razorpay_refund_id |
| `reviews` | appointment_id (unique), patient_id, doctor_id, rating, comment, is_hidden |
| `notifications` | user_id, type, title, body, data jsonb (for deep-linking), read_at |
| `push_tokens` | user_id, expo_push_token, platform, is_active — a user may have multiple devices |
| `scheduled_notifications` | appointment_id, type (7d/24h/same-day reminder), send_at, sent_at — idempotent reminder dispatch |
| `notification_preferences` | user_id, type, channel enum(PUSH, SMS, EMAIL), enabled |
| `queue_entries` | appointment_id, doctor_clinic_id, date, token_number, status enum(WAITING, CALLED, IN_CONSULTATION, COMPLETED, NO_SHOW), checked_in_at, called_at, completed_at |
| `audit_logs` | actor_id, action, entity_type, entity_id, before/after jsonb |

**Deviation from §12's `appointment_patients`**: merged into `appointments` as `patient_id` + optional `family_member_id`, since each appointment has exactly one patient — a separate join table would add a join for no normalization benefit.

**Why `queue_entries` is separate from `appointments.status`**: `appointments.status` carries the booking lifecycle (payment, cancellation, reschedule). `queue_entries` carries same-day operational state (waiting/consulting/completed) that the clinic app subscribes to via Supabase Realtime — keeping high-frequency queue updates off the appointments table.

---

## 3. Auth & RBAC

- Supabase Auth, email + password (V1).
- Patients self-register from the Patient app.
- Receptionist/Clinic Admin accounts are **not self-signup** — created by Super Admin (or Clinic Admin, for receptionists under their own clinic) via the Admin panel, consistent with §7 "Create receptionist" being an admin action and §6 "Unverified clinics must not access operational features."
- First Super Admin is created via a documented manual step (Supabase dashboard), not public signup.
- `profiles.role` + `clinic_staff.clinic_id` drive RLS: patients see rows where `patient_id` matches their own `patients` row; clinic staff see rows where `clinic_id` is in their assigned clinics; super_admin bypasses via role check.
- Mutations with business rules (booking, status transitions, check-in) go through Postgres RPC functions / Edge Functions — never raw client-side table UPDATEs — so rules are enforced server-side regardless of what the frontend sends (§13, §14).
- RLS is enabled from the first migration (not left open "for now") — baseline policies ship in Phase 1's schema migration; they get hardened/audited in Phase 7 per the roadmap.

### Phase 7 audit findings

- **Fixed, critical**: `cancel_appointment`'s ownership check used a direct
  `<>` comparison against a value that's `NULL` for any non-patient caller
  (any clinic-staff/super-admin session, or an anonymous request) — SQL's
  `NULL` comparisons are themselves `NULL`, and PL/pgSQL's `IF NULL THEN`
  is treated as false, so the exception never fired and the function
  cancelled the appointment anyway. Every other RPC avoided this because
  `is_clinic_staff()`/`is_super_admin()` are `exists(...)`-based and always
  return a real `true`/`false`. Fixed in `0005_phase7.sql` with an explicit
  `is null` guard, matching the pattern `book_appointment` already used
  correctly.
- **Fixed, hardening**: Postgres grants `EXECUTE` on new functions to
  `PUBLIC` by default (unlike tables) — every RPC had only ever been
  explicitly granted to `authenticated`, with the `PUBLIC` default never
  revoked. `0005_phase7.sql` revokes it from every mutation RPC, and
  revokes-then-re-grants it explicitly (`authenticated, anon`) on
  `is_clinic_staff`/`is_super_admin`, since those two are referenced inside
  RLS policy bodies and still need to resolve for an anonymous read of a
  protected table (to correctly return zero rows rather than error).
- **Fixed, least-privilege**: `patients_modify_own` and `notifications_owner`
  were both `for all`, letting a client delete their own patient record or
  insert/delete arbitrary rows in their own notification history — neither
  is used anywhere in the apps. Split into narrower insert/update-only
  policies.
- **Fixed, previously inert**: `audit_logs` has existed since Phase 1 with
  an enabled RLS policy but nothing ever wrote to it. `log_admin_action`
  (Phase 7) is now called from the Admin Panel's access/status-changing
  Server Actions (verification, staff role/active, cancel/reschedule,
  review hide/restore, notification sends) — viewable at
  `/settings/audit-log`.
- **Documented, not built — rate limiting** (§14): Supabase Auth already
  rate-limits its own endpoints (login/signup/OTP) by default; that's the
  current real posture. Per-RPC rate limiting needs a request path a custom
  server controls, which is what Render is for (§6) — nothing like that
  exists yet, so there's no honest place to add it before then.
- **Documented, not built — storage bucket policies**: no Supabase Storage
  bucket exists yet; no photo-upload UI was built in any phase (Phase 2 and
  4 both explicitly deferred it, per their own plans). Nothing to secure
  until upload is actually built.
- **Documented, not built — `specialties` admin write**: there's no RLS
  write policy (and so no way to add a specialty beyond raw SQL) — a
  missing feature, not a vulnerability. Adding the policy without a UI to
  use it would repeat the "inert screen" mistake Phase 3 avoided for the
  slot generator, so it's left as a known, explicit gap rather than half-built.

---

## 4. Appointment / Slot / Queue Architecture

1. `doctor_schedules` (recurring weekly template) → a nightly scheduled job materializes `appointment_slots` for a rolling window (assumption: **14 days**, adjustable) minus `doctor_leaves` and `blocked_slots`.
2. **Booking (double-booking prevention)**: a single Postgres RPC `book_appointment(slot_id, ...)` does, in one transaction: `SELECT ... FOR UPDATE` the slot row, verify `booked_count < max_capacity`, insert the appointment (`PENDING_PAYMENT` or `CONFIRMED` if free), increment `booked_count`, assign the next `token_number` for that doctor+clinic+date. Concurrent requests serialize on the row lock — only one can succeed once capacity is hit.
3. **Payment hold**: a `PENDING_PAYMENT` appointment holds slot capacity for a TTL (assumption: **10 minutes**); an expiry job releases unpaid holds back to capacity. *(Flagging this TTL as an assumption — no value given in spec.)*
4. Razorpay webhook (received by the Render service, see §6) verifies payment server-side → `payments.status = SUCCESS` → `appointments.status = CONFIRMED`. Client-reported payment success is never trusted (§17).
5. **Doctor leave**: inserting into `doctor_leaves` triggers a function that finds overlapping non-terminal appointments and flags them for the receptionist's "Affected Appointments" screen — it does **not** auto-cancel or auto-reschedule (§9, §31).
6. **Queue**: check-in creates/updates a `queue_entries` row; "Call Next" / "Complete" / "No-show" transition it; Supabase Realtime pushes updates to both the clinic's Today's Queue screen and the patient's Live Queue screen. Walk-ins and online bookings share the same `appointment_slots`/`queue_entries` flow (§16).

---

## 5. Notifications

- `notifications` row created by triggers/Edge Functions on: booking confirmed, payment confirmed, reminder fired, doctor-unavailable, reschedule request, cancellation, queue update.
- Delivery via Expo Push using `push_tokens`; `notifications.data` carries `{ screen, params }` for deep-linking through Expo Router / Next.js routes.
- Reminders (7 days / 24h / same-day, §8) are rows in `scheduled_notifications`, created when an appointment is confirmed and fired by a scheduled job that checks `send_at <= now() AND sent_at IS NULL` — idempotent by design.

---

## 6. Supabase vs Render

- **Supabase**: Postgres, Auth, Storage (doctor/clinic photos), Realtime (queue), RLS, and Edge Functions for logic that's tightly coupled to the DB and low-latency (booking RPC, slot materialization, notification triggers).
- **Render**: hosts the Razorpay webhook receiver + server-side payment verification (needs a stable public HTTPS endpoint for Razorpay's dashboard, and the mature Node Razorpay SDK), plus any longer-running background workers if Edge Function scheduling proves limiting later.
- Rule to avoid duplication: Edge Functions = DB-adjacent logic invoked by the client or Supabase triggers. Render = payment webhooks and heavier background workers only. No business rule gets implemented twice.
- No service-role key or Razorpay secret ever ships in `patient-app`, `clinic-app`, or `admin-panel` client code — only in Render env vars / Edge Function secrets.

---

## 7. Phased Roadmap (confirms §22, unchanged)

Phase 1 (this session): setup, design system, navigation, auth, basic UI → Phase 2: Patient app UI+backend → Phase 3: Clinic app UI+backend → Phase 4: Admin panel → Phase 5: appointment/slot/queue engine + notifications → Phase 6: Razorpay → Phase 7: RLS hardening/security pass → Phase 8: testing → Phase 9: deployment.

Each phase gets checked (typecheck/lint/run) before moving on, and — per the roadmap's own scale — each later phase will get its own short planning pass rather than being fully detailed here now.

---

## 8. Phase 1 — What Gets Built This Session

1. **Root scaffold**: `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `tsconfig.base.json`, `.gitignore`, `README.md` (how to run each app, env var setup).
2. **`git init`** + an initial commit once Phase 1 is stable (checkpointing, per user's answer) — no further commits without being asked.
3. **`packages/config`**: shared tsconfig base + ESLint config.
4. **`packages/theme`**: colors (white/light background, purple/indigo primary accent), spacing scale, radii, shadows, typography scale, button-size tokens — plain TS objects, no framework dependency.
5. **`packages/types`**: `Role`, `AppointmentStatus`, `PaymentStatus`, `VerificationStatus` enums + core row types (hand-written now; can be regenerated from the live schema via `supabase gen types typescript` once migrated).
6. **`packages/validation`**: zod schemas for login/signup/forgot-password forms.
7. **`supabase/migrations/0001_init.sql`**: full schema from §2 above, enums, indexes, baseline RLS policies. **Written to disk only — not applied to the user's live Supabase project in this session** (applying migrations mutates their real backend; that happens as an explicit, separate step once we're ready to wire real auth).
8. **`supabase/seed/`**: seed script for specialties + a demo clinic/doctor (dev use only, per §20).
9. **`apps/patient-app`**: Expo + TS + Expo Router. Screens: Splash, Onboarding (3 slides), Login/Signup/Forgot Password (wired to Supabase Auth — becomes live once URL/anon key are provided), Home (static layout: greeting, location, search bar, popular specialties, top doctors placeholder — no live data yet), bottom tab shell (Home/Appointments/Search/Notifications/Profile).
10. **`apps/clinic-app`**: Expo + TS + Expo Router. Screens: Clinic Login (Supabase Auth), Dashboard shell (static layout: today's stats, quick actions) — minimal Phase 1 shell; full clinic screens are Phase 3.
11. **`apps/admin-panel`**: Next.js + TS. Sidebar layout, Login page, Dashboard shell with placeholder stat cards — Phase 1 shell only; full admin is Phase 4.
12. **Design-system components built now** (scoped to what Phase 1 screens need — remaining components in §4 of PROMPT.md get added alongside the screens that need them in Phase 2+, not built speculatively): `PrimaryButton`, `SecondaryButton`, `TextField`, `EmptyState`, `LoadingState`, `ErrorState` in `packages/ui-native`; equivalents in `apps/admin-panel/components/`.
13. **`docs/ARCHITECTURE.md`**: this proposal, kept as living documentation for later phases.

---

## 9. Verification

- `pnpm install` at root succeeds.
- `pnpm turbo run typecheck` (or per-app `tsc --noEmit`) passes for all 3 apps + packages.
- ESLint passes for all 3 apps + packages.
- `apps/admin-panel`: `next build` succeeds; I'll run `next dev` and check the login/dashboard shells render via the Chrome tool.
- `apps/patient-app` / `apps/clinic-app`: no Android/iOS emulator is available in this environment, so RN UI can't be visually confirmed here. I'll verify via `expo-doctor`, `tsc --noEmit`, and a headless `expo export`/bundle check, and say explicitly that visual confirmation on-device is still needed from the user.
- Supabase migration SQL is validated by construction (reviewed manually) but **not** run against the live project this session.

---

## 10. Open Assumptions Flagged (not blocking, safest-default choices per §31)

- Slot materialization window: 14 days rolling.
- Payment hold TTL before releasing an unpaid slot: 10 minutes.
- First Super Admin account: created manually via Supabase dashboard, documented in README, not built as a public signup flow.
