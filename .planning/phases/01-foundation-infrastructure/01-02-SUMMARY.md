---
phase: 01-foundation-infrastructure
plan: 02
subsystem: auth
tags: [nextjs, react, zod, bcrypt, server-actions, auth-pages, i18n]

requires:
  - phase: 01-01
    provides: JWT session library, Prisma schema, German translations, shadcn/ui components
provides:
  - Zod validation schemas for auth forms (setup, login, register)
  - Server actions for authentication (setupAdmin, login, registerWithInvite, logout)
  - /setup page for admin creation
  - /login page for user authentication
  - /register page for invite-based registration
  - Auth layout with Kniff branding
affects:
  - 01-03: App shell can now redirect to /login for unauthenticated users
  - 01-04: Admin dashboard will use existing session for admin checks
  - All future plans: Entry point auth flow is complete

tech-stack:
  added: []
  patterns:
    - useActionState for server action form handling
    - Server-side validation with Zod schemas
    - Field-level error display from server actions
    - Toast notifications for general errors (sonner)
    - Force dynamic rendering for database-dependent pages
    - Bcrypt async password hashing (10 rounds)
    - Atomic database operations via Prisma transactions

key-files:
  created:
    - src/lib/validations/auth.ts: Zod schemas for setup, login, register
    - src/lib/actions/auth.ts: Server actions for authentication
    - src/app/(auth)/layout.tsx: Auth layout with centered card and branding
    - src/app/(auth)/setup/page.tsx: Admin setup page with user count check
    - src/app/(auth)/setup/setup-form.tsx: Setup form client component
    - src/app/(auth)/login/page.tsx: Login page client component
    - src/app/(auth)/register/page.tsx: Registration page with invite validation
    - src/app/(auth)/register/register-form.tsx: Register form client component
  modified: []

key-decisions:
  - "useActionState for form handling: React 19 pattern, cleaner than useFormState"
  - "Force dynamic rendering: Prevents build-time database queries on auth pages"
  - "Server-side invite validation: Better UX than client-side error after submit"
  - "Read-only email field on register: Prevents invite email mismatch"

patterns-established:
  - "Auth forms: Card component with German labels, field errors, toast for general errors"
  - "Server actions: Return translation keys (not raw strings) for i18n-compatible errors"
  - "Password validation: Min 8 chars on setup/register, min 1 on login (avoid leaking requirements)"
  - "Prisma unique constraint handling: Catch P2002, return appropriate field errors"

duration: 4min
completed: 2026-02-11
---

# Phase 1 Plan 2: Auth Pages Summary

**Three auth pages (setup, login, register) with Zod validation, server actions, German labels, and dark+green themed UI**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-02-11T18:27:39Z
- **Completed:** 2026-02-11T18:31:12Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments

- Admin setup flow: first visitor creates admin account at /setup
- Login flow: returning users authenticate via email/password at /login
- Invite-based registration: invited users register via /register?token=xxx
- All forms use German labels, show validation errors, and handle server errors via toast
- Server actions with Zod validation and bcrypt password hashing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth validation schemas and server actions** - `7b868b3` (feat)
2. **Task 2: Build auth page components (setup, login, register)** - `b9cd5e8` (feat)

**Plan metadata:** (will be committed after STATE.md update)

## Files Created

- `src/lib/validations/auth.ts` - Zod schemas for setupSchema, loginSchema, registerSchema with German error messages
- `src/lib/actions/auth.ts` - Server actions: setupAdmin (race condition protection), login (banned user check), registerWithInvite (atomic transaction), logout
- `src/app/(auth)/layout.tsx` - Centered auth layout with dark gradient background and Kniff branding
- `src/app/(auth)/setup/page.tsx` - Server component checking user count, redirects to /login if admin exists
- `src/app/(auth)/setup/setup-form.tsx` - Client component with username, email, password, displayName fields
- `src/app/(auth)/login/page.tsx` - Client component with email/password form and error handling
- `src/app/(auth)/register/page.tsx` - Server component validating invite token, showing appropriate errors
- `src/app/(auth)/register/register-form.tsx` - Client component with pre-filled email (read-only) and user fields

## Decisions Made

- **useActionState over useFormState:** React 19 recommended pattern, cleaner API
- **Force dynamic rendering on setup/register:** Pages query database at render time, cannot be static
- **Server-side invite validation:** Better UX to show errors before form submission attempt
- **Read-only email on register form:** Email comes from invite, prevents user mismatch

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Force dynamic rendering on auth pages**

- **Found during:** Task 2, initial build attempt
- **Issue:** /setup and /register pages query database at render time, causing build failure when Next.js tries to pre-render them
- **Fix:** Added `export const dynamic = 'force-dynamic'` to both pages
- **Files modified:** src/app/(auth)/setup/page.tsx, src/app/(auth)/register/page.tsx
- **Verification:** `npm run build` passes, routes marked as dynamic (ƒ) in build output
- **Committed in:** b9cd5e8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for build to succeed. No scope creep.

## Issues Encountered

None - plan executed smoothly after dynamic rendering fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Ready to Build

- ✅ App shell (01-03): Can use /login as unauthenticated redirect target
- ✅ Admin dashboard (01-04): Auth flow complete, admin can log in and access dashboard
- ✅ Future features: Entry point authentication is fully functional

### Blockers

None. All auth entry points complete.

### Risks

1. **PostgreSQL not running:** Database must be running to use auth pages. Mitigated by clear error message if connection fails.
2. **Invite token expiry:** Register page validates expiry server-side and shows German error message.
3. **Race condition on setup:** Handled via Prisma P2002 error catching - multiple simultaneous setup attempts won't create duplicate admins.

---

*Phase: 01-foundation-infrastructure*
*Plan: 01-02*
*Status: ✅ Complete*
*Completed: 2026-02-11*
*Next: 01-03 (App shell with navigation and lobby placeholder)*
