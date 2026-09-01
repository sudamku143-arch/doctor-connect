MASTER BUILD PROMPT — DOCTOR APPOINTMENT PLATFORM

You are the lead product architect, senior UI/UX designer, senior React Native/Expo developer, Next.js developer, Supabase architect, backend engineer, and QA engineer for this project.

I want you to build a production-ready Doctor Appointment Platform from scratch.

IMPORTANT:

- This is a completely NEW project.
- Do NOT modify, import, copy, or depend on any existing Travolo project.
- Build this project with clean architecture so it can scale later.
- Do not create a Doctor mobile app in V1.
- The Doctor will communicate availability to the clinic/receptionist.
- The clinic/receptionist will manage the doctor's schedule and appointments.

The platform has THREE applications:

1. PATIENT MOBILE APP
2. CLINIC / RECEPTIONIST MOBILE APP
3. ADMIN WEB PANEL

The Doctor is NOT a separate application in V1.

==================================================

1. PRODUCT CONCEPT
   ==================================================

The core idea is:

Patient searches for a doctor/clinic
↓
Patient checks available date/time
↓
Patient books appointment
↓
Patient pays online if required
↓
Appointment is confirmed
↓
Clinic/receptionist manages the appointment
↓
Patient receives reminders
↓
Patient visits clinic
↓
Receptionist checks patient in
↓
Token/queue is managed
↓
Appointment completed

The system must prioritize simplicity.

Doctors are busy and should NOT be forced to use an application.

The receptionist/clinic staff will manage:

- Doctor availability
- Working days
- Time slots
- Doctor leave
- Blocked slots
- Appointment capacity
- Walk-in patients
- Online appointments
- Patient check-in
- Queue/token
- Rescheduling
- Cancellation

The system should make the clinic receptionist the operational center.

==================================================
2. TECHNOLOGY STACK

PATIENT MOBILE APP:

- React Native
- Expo
- TypeScript
- Expo Router
- Modern component architecture
- Responsive layouts
- Android-first but iOS compatible

CLINIC / RECEPTIONIST MOBILE APP:

- React Native
- Expo
- TypeScript
- Expo Router

ADMIN PANEL:

- Next.js
- TypeScript
- Responsive web dashboard

BACKEND:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime where useful
- Supabase Edge Functions where appropriate

HOSTING:

- Backend/API related services can use Render where necessary.
- Do not unnecessarily duplicate backend functionality between Render and Supabase.
- Keep business logic organized and secure.

PAYMENTS:

- Razorpay integration architecture.
- Never store sensitive card/payment credentials.
- Payment status must be verified server-side.

NOTIFICATIONS:

- Expo Push Notifications for mobile initially.
- Architecture should allow SMS/WhatsApp integration later.

==================================================
3. DESIGN DIRECTION

The application must look like a premium modern healthcare product.

Design personality:

- Clean
- Premium
- Trustworthy
- Calm
- Professional
- Modern
- Easy for elderly users
- Not overly colorful
- Not cluttered
- Not childish
- Not a generic template

Use:

- White/light backgrounds
- Purple/indigo as the primary accent
- Very subtle secondary colors
- Rounded cards
- Soft shadows
- Clear hierarchy
- Large readable text
- High-quality icons
- Consistent spacing
- Premium buttons
- Professional doctor cards
- Proper empty states
- Proper loading states
- Proper error states

DO NOT:

- Overcrowd screens
- Use too many gradients
- Use excessive animations
- Use random colors
- Use tiny text
- Use excessive borders
- Put too many buttons on one screen
- Make every card look identical if hierarchy requires variation

The UI should feel closer to a premium fintech/healthcare application than a basic CRUD app.

==================================================
4. GLOBAL DESIGN SYSTEM

Create a centralized design system.

Define:

- Typography
- Font sizes
- Font weights
- Spacing scale
- Border radius
- Shadows
- Button sizes
- Input styles
- Card styles
- Badge styles
- Modal styles
- Bottom sheet styles
- Navigation styles
- Colors
- Icon sizes

Do not hard-code random values repeatedly.

Create reusable components.

Examples:

PrimaryButton
SecondaryButton
SearchBar
DoctorCard
ClinicCard
SpecialtyCard
AppointmentCard
StatusBadge
TimeSlot
DateSelector
EmptyState
LoadingState
ErrorState
ConfirmationModal
BottomSheet
NotificationCard
QueueCard
StatsCard

==================================================
5. PATIENT APP

The Patient App is the main customer-facing application.

---

SCREEN 1 — SPLASH SCREEN

Show:

- App logo
- App name
- Short healthcare tagline

Example:

"Your Health. Your Doctor. Your Time."

Keep it elegant.

Automatically navigate to onboarding/login/home depending on authentication state.

---

SCREEN 2 — ONBOARDING

3 simple onboarding slides:

Slide 1:
Find trusted doctors

Slide 2:
Book appointments easily

Slide 3:
Know your appointment and queue status

Buttons:

- Skip
- Next
- Get Started

Do not force users to see onboarding every time.

---

SCREEN 3 — LOGIN / SIGN UP

Allow:

- Mobile number
- Email
- Password or appropriate authentication flow

Design should be extremely simple.

Include:

- Login
- Create account
- Forgot password
- Terms & Privacy

Authentication must be implemented securely using Supabase Auth.

---

SCREEN 4 — HOME

This is one of the most important screens.

Top:

- Greeting
- Notification icon

Location:
"Berhampur, Odisha" or selected location

Large search bar:

"Search doctor, specialty or clinic"

Then:

Popular Specialties

Cards:

- General Physician
- Pediatrician
- Dermatologist
- Dentist
- Cardiologist
- Orthopedic
- Gynecologist
- Ophthalmologist

Then:

"Top Doctors Near You"

Doctor cards showing:

- Doctor photo
- Doctor name
- Verification badge
- Qualification
- Specialty
- Experience
- Rating
- Clinic
- Consultation fee
- Availability
- Book Appointment button

Then:
"Upcoming Appointment" if the patient already has one.

---

SCREEN 5 — SEARCH

Search:

- Doctor
- Specialty
- Clinic

Filters:

- Specialty
- Distance
- Consultation fee
- Rating
- Available today
- Available this week

Sort:

- Recommended
- Nearest
- Highest rated
- Lowest consultation fee

Search results must be clean and fast.

---

SCREEN 6 — SPECIALTY LIST

Show all specialties in a grid/list.

Each specialty:

- Icon
- Name
- Number of doctors

Clicking opens doctor list.

---

SCREEN 7 — DOCTOR LIST

Doctor cards must show:

Doctor photo
Doctor name
Verified badge
Qualification
Specialty
Experience
Rating
Clinic
Fee
Next available slot

CTA:
"View Profile"

Secondary CTA:
"Book"

---

SCREEN 8 — DOCTOR PROFILE

This is a major conversion screen.

Top:
Doctor photo
Doctor name
Verified badge
Qualification
Specialty
Rating
Experience

Show:

- About
- Education
- Experience
- Clinic
- Consultation fee
- Languages if available
- Reviews

Clinic section:

- Clinic name
- Address
- Location/map button
- Clinic timings

Availability section:
"Available Appointments"

Show dates horizontally.

Then time slots.

Example:

Today
10:00 AM
10:30 AM
11:00 AM
11:30 AM

Tomorrow
...

Unavailable slots must be visually disabled.

Primary CTA:
"Book Appointment"

---

SCREEN 9 — SELECT DATE & TIME

Show:

- Doctor
- Clinic
- Date selector
- Available slots

Do not show slots that are already booked.

Do not allow double booking.

If doctor is unavailable:
"Doctor is not available on this date."

If clinic has blocked the date:
"Appointments unavailable."

---

SCREEN 10 — PATIENT DETAILS

Fields:

- Patient name
- Age/date of birth
- Gender
- Mobile number
- Reason for visit

Allow selecting:

- Myself
- Family member

Keep the form short.

---

SCREEN 11 — APPOINTMENT SUMMARY

Show:

Doctor
Clinic
Date
Time
Patient
Consultation fee
Platform/service fee if applicable
Total

Buttons:
"Proceed to Payment"
or
"Confirm Appointment" if payment is not required.

---

SCREEN 12 — PAYMENT

Razorpay integration.

Show:

- Appointment details
- Amount
- Payment method

After successful payment:
Verify payment server-side.

Never confirm an appointment only based on client-side payment success.

---

SCREEN 13 — BOOKING CONFIRMED

Premium success screen.

Show:
✓ Appointment Confirmed

Doctor
Clinic
Date
Time

Appointment ID

Token number if available.

Buttons:

- View Appointment
- Get Directions
- Add to Calendar
- Back to Home

---

SCREEN 14 — MY APPOINTMENTS

Tabs:

Upcoming
Completed
Cancelled

Cards show:

- Doctor
- Clinic
- Date
- Time
- Token
- Status

---

SCREEN 15 — APPOINTMENT DETAILS

Show complete information.

Status:

- Confirmed
- Checked In
- Waiting
- In Consultation
- Completed
- Cancelled
- Reschedule Required

Show:

Doctor
Clinic
Date
Time
Token
Payment
Address

If applicable:

"Patients before you: 3"

"Estimated waiting time: 25 min"

Actions:

- Reschedule
- Cancel
- Get Directions
- Contact Clinic

---

SCREEN 16 — LIVE QUEUE

This is an important differentiating feature.

Show:

Your Token:
#18

Currently Consulting:
#15

Patients Before You:
2

Estimated Waiting:
20 min

Update the queue using realtime data where appropriate.

Do not guarantee exact waiting time. Clearly label it as an estimate.

---

SCREEN 17 — NOTIFICATION CENTER

Notifications:

- Booking confirmation
- Appointment reminder
- Doctor unavailable
- Reschedule request
- Cancellation
- Queue update
- Payment confirmation

Unread notifications should be clearly marked.

---

SCREEN 18 — PROFILE

Show:

- Name
- Mobile
- Email
- Profile photo
- Family members
- Appointment history

Settings:

- Notifications
- Privacy
- Terms
- Help
- Logout

==================================================
6. CLINIC / RECEPTIONIST APP

There is NO Doctor App in V1.

The receptionist/clinic app controls the doctor's operational schedule.

---

SCREEN 1 — CLINIC LOGIN

Login using approved clinic/receptionist credentials.

Unverified clinics must not access operational features.

---

SCREEN 2 — CLINIC DASHBOARD

Header:

"Good Morning, Receptionist"

Show clinic name.

Main cards:

Today's Appointments
Checked In
Waiting
Completed

Quick actions:

Today's Queue
Add Walk-in
Appointments
Doctor Schedule

Then appointment list.

Each appointment:

- Token
- Patient name
- Time
- Reason
- Status

---

SCREEN 3 — TODAY'S QUEUE

Show:

Currently Consulting
Next Patient
Waiting Patients
Completed

Example:

NOW CONSULTING
#14 — Ramesh

NEXT
#15 — Sita

WAITING
#16
#17
#18

Buttons:

- Check In
- Call Next
- Mark Completed
- No Show

Queue logic must be transaction-safe.

---

SCREEN 4 — ADD WALK-IN PATIENT

Receptionist can create a walk-in appointment.

Fields:

- Patient name
- Mobile
- Age
- Gender
- Reason
- Doctor
- Date
- Slot/token

Walk-in patients must share the same appointment/queue system as online patients.

This prevents duplicate token management.

---

SCREEN 5 — APPOINTMENTS

Tabs:

- Today
- Upcoming
- Completed
- Cancelled

Filters:

- Doctor
- Date
- Status
- Online/Walk-in

---

SCREEN 6 — APPOINTMENT DETAILS

Show:
Patient
Doctor
Clinic
Date
Time
Token
Payment
Booking source

Actions:

- Check in
- Reschedule
- Cancel
- Mark no-show
- Complete

---

SCREEN 7 — DOCTOR SCHEDULE

This is one of the most important screens.

Receptionist selects doctor.

Show weekly calendar.

Example:

Monday
10 AM – 1 PM
3 PM – 7 PM

Tuesday
Not Available

Wednesday
10 AM – 2 PM

Allow receptionist to manage:

- Working days
- Working hours
- Slot duration
- Maximum patients
- Breaks
- Leave
- Blocked slots

---

SCREEN 8 — ADD AVAILABILITY

Fields:

Doctor
Date/day
Start time
End time
Slot duration

Example:

Start:
10:00 AM

End:
1:00 PM

Slot:
30 minutes

Maximum patients:
6 per hour

Generate available slots.

---

SCREEN 9 — DOCTOR LEAVE

Receptionist can mark:

"Doctor Not Available"

Options:

- Single day
- Multiple days
- Date range

Reason:
Optional internal note.

Once leave is saved:

- New bookings must be blocked.
- Existing affected appointments must be identified.

---

SCREEN 10 — BLOCK SLOT

Receptionist can block a particular time.

Example:

Tuesday
5:00 PM – 6:00 PM

Reason:
Meeting / Emergency / Personal

Blocked slots cannot be booked by patients.

---

SCREEN 11 — AFFECTED APPOINTMENTS

If receptionist marks doctor leave and existing appointments are affected, show:

"12 appointments are affected."

List:

- Patient
- Date
- Time
- Appointment status

Actions:

- Notify patient
- Reschedule
- Cancel

DO NOT silently cancel appointments.

---

SCREEN 12 — PATIENT MANAGEMENT

Search patients by:

- Name
- Mobile
- Appointment ID

Show basic appointment history.

Do not expose unnecessary sensitive medical information.

---

SCREEN 13 — CLINIC PROFILE

Clinic:

- Name
- Address
- Phone
- Photos
- Timings
- Services
- Doctors
- Consultation fees

Only authorized staff can edit.

---

SCREEN 14 — RECEPTIONIST PROFILE

Show:

- Name
- Role
- Clinic
- Mobile
- Email

Settings:

- Notifications
- Logout

==================================================
7. ADMIN WEB PANEL

Build a professional desktop-first responsive dashboard.

Sidebar:

Dashboard
Doctors
Clinics
Receptionists
Patients
Appointments
Payments
Reviews
Notifications
Reports
Settings

---

ADMIN DASHBOARD

Top statistics:

Total Doctors
Total Clinics
Total Patients
Today's Appointments
Total Bookings
Total Revenue

Charts:

Appointments Overview
Bookings by Day
Revenue
New Patients
Doctor Growth
Clinic Growth

Recent appointments table.

---

DOCTOR MANAGEMENT

Admin can:

- View doctors
- Approve doctor
- Reject doctor
- Suspend doctor
- Edit doctor
- Verify credentials
- Assign specialties
- Assign clinic

Doctor verification status:

Pending
Verified
Rejected
Suspended

---

CLINIC MANAGEMENT

Admin can:

- Approve clinic
- Reject clinic
- Suspend clinic
- Edit clinic
- View clinic doctors
- View appointments

---

RECEPTIONIST MANAGEMENT

Admin can:

- Create receptionist
- Assign receptionist to clinic
- Change role
- Disable account

A receptionist must only access assigned clinic data.

---

PATIENT MANAGEMENT

Admin can:

- Search patient
- View appointment history
- Suspend account if necessary

Do not expose unnecessary medical information.

---

APPOINTMENT MANAGEMENT

Admin can:

- Search
- Filter
- View
- Cancel
- Reschedule if authorized
- View payment status

Filters:
Doctor
Clinic
Patient
Date
Status
Payment

---

PAYMENT MANAGEMENT

Show:

Payment ID
Appointment
Patient
Clinic
Amount
Platform fee
Clinic amount
Payment status
Refund status
Date

---

REVIEWS

Admin can:

- View review
- Hide inappropriate review
- Restore review

Only verified/completed appointments should normally be allowed to submit a review.

---

NOTIFICATION MANAGEMENT

Admin can create:

- System notification
- Clinic notification
- Patient notification

---

REPORTS

Reports:

- Daily appointments
- Monthly appointments
- Revenue
- Cancellation rate
- No-show rate
- Clinic performance
- Doctor performance

Allow CSV export later.

==================================================
8. SPECIAL 7-DAY APPOINTMENT RULE

This is a core business feature.

If a patient books an appointment more than 7 days in advance:

Example:

Today:
1 September

Appointment:
10 September

The system should flag it as a future appointment.

The patient should receive a confirmation/reminder notification.

Example:

"Your appointment with Dr. X is scheduled for 10 September at 5:00 PM."

The system should also create a future appointment reminder.

Suggested reminder:

- 7 days before
- 24 hours before
- Same-day reminder

However, the 7-day rule must NOT automatically cancel the appointment.

If clinic/receptionist later marks the doctor unavailable:

System identifies affected appointments.

Patient receives:

"Your appointment may need to be rescheduled because the doctor is unavailable."

Buttons:

KEEP / RESCHEDULE / CANCEL

If clinic has specifically requested rescheduling, do not silently modify the patient's appointment.

==================================================
9. APPOINTMENT STATE MACHINE

Use controlled appointment statuses.

Possible statuses:

PENDING_PAYMENT
CONFIRMED
RESCHEDULE_REQUESTED
CHECKED_IN
WAITING
IN_CONSULTATION
COMPLETED
CANCELLED_BY_PATIENT
CANCELLED_BY_CLINIC
NO_SHOW
REFUND_PENDING
REFUNDED

Do not allow arbitrary status changes from the frontend.

Business rules must be enforced server-side.

==================================================
10. DOUBLE BOOKING PREVENTION

This is CRITICAL.

Two users must NEVER successfully book the same doctor/time slot.

Do not rely only on frontend validation.

Use database-level protection/transactions where possible.

Booking process:

1. Patient selects slot.
2. Server verifies slot availability.
3. Server creates/reserves appointment.
4. Payment process starts.
5. Payment verified server-side.
6. Appointment confirmed.
7. Slot inventory updated atomically.

Handle race conditions.

If two users attempt the same slot simultaneously, only one must succeed.

==================================================
11. SLOT SYSTEM

A doctor's availability should generate slots.

Example:

10:00 AM – 1:00 PM
30-minute duration

Slots:
10:00
10:30
11:00
11:30
12:00
12:30

But capacity must also be configurable.

The system should support:

- Slot duration
- Maximum appointments
- Break time
- Multiple sessions
- Leave
- Blocked slots

==================================================
12. DATABASE ARCHITECTURE

Use PostgreSQL through Supabase.

Design normalized tables.

Suggested tables:

profiles
patients
doctors
clinics
clinic_staff
specialties
doctor_specialties
doctor_clinics
doctor_schedules
doctor_leaves
blocked_slots
appointment_slots
appointments
appointment_patients
payments
refunds
reviews
notifications
notification_preferences
queue_entries
family_members
audit_logs

Use UUID primary keys.

Use timestamps.

Use proper foreign keys.

Add indexes for:

- doctor_id
- clinic_id
- patient_id
- appointment_date
- status
- slot_id

Do not create unnecessary duplicate data.

==================================================
13. ROLE-BASED ACCESS CONTROL

Roles:

PATIENT
RECEPTIONIST
CLINIC_ADMIN
SUPER_ADMIN

Patients:

- Can access their own appointments/profile.

Receptionist:

- Can access only assigned clinic data.

Clinic Admin:

- Can manage their clinic.

Super Admin:

- Full access.

Implement security using Supabase Row Level Security.

Never depend only on frontend hiding buttons.

==================================================
14. SECURITY

Security is extremely important.

Implement:

- RLS policies
- Server-side authorization
- Input validation
- Secure authentication
- Rate limiting architecture
- Audit logging for important admin actions
- Secure payment verification
- No service-role key in client apps
- No secrets committed to Git
- Environment variables

Never expose:

- Supabase service-role key
- Razorpay secret
- Render secrets
- Other private credentials

==================================================
15. NOTIFICATION SYSTEM

Build notification architecture for:

Booking confirmation
Payment confirmation
Appointment reminder
24-hour reminder
Same-day reminder
Doctor unavailable
Reschedule request
Cancellation
Queue update
Clinic message

Notification object should contain:

id
user_id
type
title
body
data
read_at
created_at

Deep-link notification to the appropriate screen.

==================================================
16. QUEUE SYSTEM

Queue should be clinic-specific and doctor-specific.

Example:

Doctor:
Dr. Rahul Sharma

Date:
10 September

Token sequence:
1
2
3
4
5...

Online and walk-in patients should use the same queue.

Receptionist can:

- Check in
- Call next
- Mark consulting
- Complete
- No-show

Patient can see approximate position.

==================================================
17. PAYMENT ARCHITECTURE

Do not trust payment status sent from the mobile app.

Use server-side verification/webhooks.

Payment statuses:

CREATED
PENDING
SUCCESS
FAILED
REFUND_PENDING
REFUNDED

Appointment should only become CONFIRMED after successful payment verification when payment is required.

==================================================
18. ERROR HANDLING

Every important screen needs:

Loading state
Empty state
Error state
Retry state

Examples:

"No doctors found."

"No appointments today."

"Doctor is not available on this date."

"Something went wrong. Please try again."

Do not show raw database errors to users.

==================================================
19. RESPONSIVE DESIGN

Patient and receptionist apps:

- Mobile-first
- Support small Android screens
- Support larger phones

Admin:

- Desktop-first
- Tablet responsive
- Mobile usable but desktop optimized

==================================================
20. CODE QUALITY

Use:

- TypeScript strict mode
- Reusable components
- Feature-based folder structure
- Clear naming
- No unnecessary duplication
- Proper API/service layer
- Proper validation
- Error boundaries where applicable
- Environment configuration

Do NOT put everything inside one giant file.

Do NOT generate fake static data once backend integration starts.

Do NOT use hardcoded doctor/clinic data in production screens.

Use seed data only for development.

==================================================
21. PROJECT STRUCTURE

Prefer a clean monorepo or clearly separated applications.

Example:

doctor-platform/
apps/
patient-app/
clinic-app/
admin-panel/

packages/
ui/
types/
validation/
config/

supabase/
migrations/
seed/

docs/

Keep shared types and validation reusable.

If you determine a different architecture is substantially better, explain why before changing it.

==================================================
22. DEVELOPMENT APPROACH

DO NOT attempt to build the entire production system blindly in one step.

Build in phases.

PHASE 1:
Project setup
Design system
Navigation
Authentication
Basic UI

PHASE 2:
Patient App UI + backend

PHASE 3:
Clinic/Receptionist App UI + backend

PHASE 4:
Admin Panel

PHASE 5:
Appointment engine
Slot engine
Queue engine
Notifications

PHASE 6:
Razorpay integration

PHASE 7:
Security/RLS

PHASE 8:
Testing

PHASE 9:
Production deployment

After each phase:

- Run the project
- Check for TypeScript errors
- Check lint errors
- Test navigation
- Test database queries
- Fix errors before continuing

==================================================
23. IMPORTANT UI RULE

The application should NOT look like a generic AI-generated dashboard.

Every screen should have deliberate UX hierarchy.

Use the following visual hierarchy:

Primary action:
Filled primary button

Secondary action:
Outlined/text button

Danger:
Clearly differentiated but not visually aggressive

Information:
Subtle badge/card

Important status:
Status badge

Cards:
Use whitespace generously.

Do not fill every empty space.

==================================================
24. PATIENT HOME VISUAL STRUCTURE

The home screen should visually follow approximately:

Header
↓
Location
↓
Greeting
↓
Large Search
↓
Popular Specialties
↓
Upcoming Appointment
↓
Top Doctors
↓
Nearby Clinics
↓
Bottom Navigation

Bottom navigation:

Home
Appointments
Search
Notifications
Profile

==================================================
25. CLINIC DASHBOARD VISUAL STRUCTURE

Header
↓
Clinic name
↓
Today's statistics
↓
Quick actions
↓
Today's appointments
↓
Live queue
↓
Daily summary

Quick actions:

Today's Queue
Add Walk-in
Appointments
Doctor Schedule

==================================================
26. ADMIN DASHBOARD VISUAL STRUCTURE

Sidebar
↓
Dashboard header
↓
Statistics cards
↓
Appointment chart
↓
Revenue chart
↓
Recent appointments
↓
Clinic/doctor performance

Keep admin UI professional and data-focused.

==================================================
27. DOCTOR VERIFICATION

Because this is healthcare, doctors and clinics must not automatically become publicly verified.

Admin verification workflow:

Doctor submits:

- Name
- Qualification
- Registration information
- Specialty
- Experience
- Clinic

Admin reviews.

Status:
Pending
Verified
Rejected

Only verified doctors should appear publicly as verified.

Do not make claims that the platform itself is medically certifying a doctor unless the actual verification process supports that claim.

==================================================
28. PRIVACY

Collect only information necessary for appointment management.

Avoid collecting detailed medical records in V1.

The first version is an appointment/clinic management platform, not a full electronic medical record system.

==================================================
29. FUTURE FEATURES — DO NOT BUILD NOW

Keep architecture extensible for:

Video consultation
Digital prescription
Lab booking
Medicine delivery
Health records
Insurance
Family health dashboard
WhatsApp booking
Voice booking
AI symptom assistant

Do not implement these in V1 unless explicitly requested.

==================================================
30. MVP PRIORITY

The most important V1 features are:

PATIENT:
Search doctor
View doctor
View clinic
See availability
Book
Pay
Appointment confirmation
Cancel/reschedule
Notifications
Queue

CLINIC:
Dashboard
Appointments
Walk-in
Doctor schedule
Leave
Blocked slots
Queue
Reschedule/cancel
Patient check-in

ADMIN:
Doctor verification
Clinic verification
Patient management
Appointment management
Payment monitoring
Reports

Everything else is secondary.

==================================================
31. WHAT I EXPECT FROM YOU

You are not just generating UI.

You are building a real application.

Before implementing major architecture:

1. Inspect the project.
2. Create an implementation plan.
3. Explain the proposed architecture briefly.
4. Create the folder structure.
5. Build phase-by-phase.
6. Run tests/checks.
7. Fix errors.
8. Continue only after the previous phase is stable.

If any requirement is technically ambiguous:

- Do not silently invent critical business logic.
- State the assumption.
- Choose the safest scalable implementation.
- Continue with non-blocking work.

When implementing UI:

- Prioritize the described design.
- Do not replace it with your own generic template.
- Keep all three applications visually consistent.

When implementing backend:

- Do not bypass RLS.
- Do not put secrets in client code.
- Do not rely on frontend validation for security.

When implementing appointments:

- Treat double-booking prevention as a critical requirement.

When implementing doctor leave:

- Never silently cancel existing appointments.
- Identify affected appointments.
- Notify the patient.
- Give cancel/reschedule options.

==================================================
32. FIRST TASK

DO NOT immediately generate all application code.

First:

1. Analyze this complete specification.
2. Propose the final technical architecture.
3. Propose the folder structure.
4. List all database tables and relationships.
5. Explain authentication and role structure.
6. Explain appointment/slot/queue architecture.
7. Explain notification architecture.
8. Explain how Supabase and Render will be used.
9. Create a phased development roadmap.
10. Identify any critical decisions that need confirmation.

After that, begin PHASE 1.

Remember:

This project is separate from Travolo.

Do not touch Travolo.

Build this as a clean, scalable, premium Doctor Appointment Platform.
