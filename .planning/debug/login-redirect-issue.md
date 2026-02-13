---
status: diagnosed
trigger: "/login auto-forwards to the main page even when cookies are cleared"
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:00:00Z
---

## Current Focus

hypothesis: The middleware intentionally redirects authenticated users away from /login (line 28-31). The redirect only fires when a valid session cookie exists. Server returns HTTP 200 with full login form when no cookie is present. The issue is likely stale session cookie or browser cache, NOT a code bug in the current working tree.
test: curl -b "" http://localhost:3000/login -> HTTP 200 with login form
expecting: 200 = no redirect for unauthenticated users
next_action: Report findings

## Symptoms

expected: Unauthenticated user navigating to /login should see the login form
actual: User reports being redirected to main app page even after clearing cookies
errors: None reported
reproduction: Navigate to /login after admin setup with cookies cleared
started: After admin setup flow was implemented

## Eliminated

- hypothesis: Middleware incorrectly redirects unauthenticated users away from /login
  evidence: Middleware lines 26-39 explicitly allow unauthenticated access to /login. Verified with curl -b "" -> HTTP 200
  timestamp: 2026-02-11

- hypothesis: Login page server component has redirect to /
  evidence: LoginPage only redirects to /setup when userCount === 0. No redirect to / exists.
  timestamp: 2026-02-11

- hypothesis: Client-side JavaScript redirect on login page
  evidence: grep for useRouter/router.push/router.replace/window.location across entire src/ returned zero matches
  timestamp: 2026-02-11

- hypothesis: (auth) layout contains redirect logic
  evidence: AuthLayout only renders UI (branding + children). No auth checks or redirects.
  timestamp: 2026-02-11

- hypothesis: Root layout or providers trigger redirect
  evidence: RootLayout only wraps with NextIntlClientProvider, ThemeProvider, Toaster. No auth logic.
  timestamp: 2026-02-11

- hypothesis: Next.js static cache serving stale redirect
  evidence: export const dynamic = 'force-dynamic' is set on login page. Server confirmed returning fresh response.
  timestamp: 2026-02-11

## Evidence

- timestamp: 2026-02-11
  checked: middleware.ts lines 26-39
  found: Public routes logic correctly allows /login for unauthenticated users. Only redirects to / when sessionCookie exists AND is valid (lines 28-31).
  implication: Middleware is correct for unauthenticated case.

- timestamp: 2026-02-11
  checked: (auth)/login/page.tsx
  found: Only redirect is to /setup when userCount === 0. Otherwise renders LoginForm.
  implication: Login page has no redirect to /.

- timestamp: 2026-02-11
  checked: Entire src/ directory for client-side redirects
  found: Zero instances of useRouter, router.push, router.replace, or window.location in any file.
  implication: No client-side redirect mechanism exists.

- timestamp: 2026-02-11
  checked: curl -b "" http://localhost:3000/login (no cookies)
  found: HTTP 200, full HTML response with login form (email field, password field, submit button)
  implication: Server correctly serves login page to unauthenticated users.

- timestamp: 2026-02-11
  checked: curl -b "session=invalid_token" http://localhost:3000/login
  found: HTTP 200, login page served (invalid JWT falls through to NextResponse.next())
  implication: Even invalid cookies don't cause redirect.

- timestamp: 2026-02-11
  checked: curl -b "" http://localhost:3000/
  found: HTTP 307 redirect to /login
  implication: Root path correctly redirects unauthenticated users to /login.

- timestamp: 2026-02-11
  checked: git diff for login page
  found: page.tsx was refactored from client component to server component + separate login-form.tsx. Working tree has correct code.
  implication: If dev server uses stale compiled code, behavior could differ.

- timestamp: 2026-02-11
  checked: Route conflict between src/app/page.tsx and src/app/(app)/page.tsx
  found: Both resolve to /. Build output has both index.html (root) and (app)/page.js.
  implication: Potential route conflict, but does not affect /login behavior.

## Resolution

root_cause: The middleware correctly redirects authenticated users from /login to / (lines 28-31). The redirect ONLY fires when a valid session cookie exists. Server verified returning HTTP 200 with login form when no cookie is present. Most likely cause is that the session cookie was not actually cleared (e.g., httpOnly cookies are not visible in browser devtools cookie panels in some views, or the cookie was set with path=/ and needs to be cleared from that specific path).
fix: See recommendations below
verification: curl confirms correct behavior for all scenarios
files_changed: []
