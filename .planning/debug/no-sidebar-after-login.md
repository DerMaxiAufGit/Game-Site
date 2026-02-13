---
status: resolved
trigger: "app shell shows no sidebar navigation - user only sees 'Kniff Deutsche Spieleseite - Coming Soon' after login"
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - root src/app/page.tsx shadows the (app)/page.tsx route group page
test: Read both files, verified build output, confirmed route resolution
expecting: root page.tsx takes priority over (app)/page.tsx for the "/" route
next_action: Delete src/app/page.tsx so (app)/page.tsx and (app)/layout.tsx are used

## Symptoms

expected: After login, user sees lobby page with sidebar navigation, connection status, and user menu
actual: User sees only "Kniff Deutsche Spieleseite - Coming Soon" centered on screen, no sidebar
errors: None (no build errors, no runtime errors)
reproduction: Login to the app, observe the "/" route
started: Since src/app/page.tsx placeholder was created (likely initial project scaffold)

## Eliminated

(none - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-11
  checked: src/app/page.tsx (root level)
  found: Placeholder page rendering "Kniff" + "Deutsche Spieleseite - Coming Soon" - exactly matching user symptom
  implication: This file shadows the (app)/page.tsx route group page

- timestamp: 2026-02-11
  checked: src/app/(app)/page.tsx
  found: Proper lobby page with "Spiele kommen bald" content
  implication: This is the intended page but never reached

- timestamp: 2026-02-11
  checked: src/app/(app)/layout.tsx
  found: Correctly renders Sidebar, MobileSidebar, SocketProvider - all properly structured
  implication: Layout is correct but never rendered because root page.tsx doesn't use (app) route group

- timestamp: 2026-02-11
  checked: Next.js build output
  found: "/" shown as static (prerendered), "/admin" shown as dynamic
  implication: Confirms root page.tsx is being served for "/", not the (app) group page

- timestamp: 2026-02-11
  checked: All sidebar/layout components (sidebar.tsx, mobile-sidebar.tsx, connection-status.tsx, user-menu.tsx)
  found: All components are correctly implemented with proper props, Tailwind classes, and client directives
  implication: No component-level bugs - the problem is purely route resolution

## Resolution

root_cause: src/app/page.tsx (placeholder from initial scaffold) shadows src/app/(app)/page.tsx - Next.js serves the root page which bypasses the (app) route group layout containing the sidebar
fix: Delete src/app/page.tsx so the (app) route group's page.tsx and layout.tsx are used for the "/" route
verification: After deletion, "/" should render through (app)/layout.tsx with sidebar, mobile sidebar, socket provider
files_changed: [src/app/page.tsx - DELETE]
