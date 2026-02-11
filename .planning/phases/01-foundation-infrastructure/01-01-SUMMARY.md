---
phase: 01-foundation-infrastructure
plan: 01
subsystem: foundation
tags: [nextjs, prisma, auth, shadcn-ui, i18n, websocket]

requires: []
provides:
  - Next.js 15 project with App Router and TypeScript
  - Prisma database schema (User, Invite models)
  - JWT-based authentication library
  - shadcn/ui dark theme with green accent
  - German translations infrastructure
  - Custom server for Socket.IO

affects:
  - 01-02: Auth pages will use session.ts functions
  - 01-03: App shell will use DAL for session checks
  - 01-04: Admin dashboard requires requireAdmin() from DAL
  - All future plans: Foundation is now available

tech-stack:
  added:
    - next@16.1.6
    - react@19.2.4
    - prisma@6.19.2
    - socket.io@4.8.3
    - next-intl@4.8.2
    - jose@6.1.3
    - bcrypt@6.0.0
    - zod@4.3.6
    - shadcn/ui components
    - tailwindcss@4.1.18
  patterns:
    - JWT sessions in httpOnly cookies
    - Data Access Layer with React cache
    - Edge-compatible middleware with jose
    - Prisma client singleton pattern

key-files:
  created:
    - src/lib/auth/session.ts: JWT session management
    - src/lib/auth/dal.ts: Cached session verification with banned-user enforcement
    - src/middleware.ts: Route protection and session refresh
    - prisma/schema.prisma: User and Invite models
    - src/lib/db/index.ts: Prisma client singleton
    - src/messages/de.json: German translation strings
    - server.js: Custom Node.js server for Socket.IO
    - src/app/globals.css: Tailwind v4 dark theme with green accent
  modified: []

decisions:
  - id: use-prisma-v6
    choice: Downgraded from Prisma v7 to v6
    rationale: Prisma v7 has breaking config changes that are not yet stable
    impact: Standard datasource URL in schema.prisma
  - id: tailwind-v4-css-config
    choice: Use Tailwind v4 CSS-based configuration
    rationale: Tailwind v4 uses @theme in CSS instead of JS config
    impact: globals.css contains theme variables, tailwind.config.ts minimal
  - id: jose-over-jsonwebtoken
    choice: Use jose library for JWT operations
    rationale: Edge Runtime compatible, Next.js recommended
    impact: Works in middleware, future-proof for edge deployment

metrics:
  duration: 9 minutes
  completed: 2026-02-11
---

# Phase 1 Plan 1: Project Initialization Summary

**One-liner:** Next.js 15 project with Prisma PostgreSQL, JWT auth library (jose), shadcn/ui dark theme with rich green accent, and custom Socket.IO server

## What Was Built

### Infrastructure
- **Next.js 15** with App Router, TypeScript, and Turbopack
- **Prisma 6** with PostgreSQL schema (User and Invite models)
- **Custom server.js** combining Next.js and Socket.IO on single HTTP server
- **Environment configuration** (.env.example, .env.local with generated SESSION_SECRET)

### Authentication Library
- **session.ts**: JWT-based session management using jose
  - `createSession()`: Creates signed JWT with 7-day expiry in httpOnly cookie
  - `verifySession()`: Validates JWT and returns session payload
  - `updateSession()`: Refreshes session expiry for active users
  - `deleteSession()`: Clears session cookie
- **dal.ts**: Data Access Layer with React cache
  - `getSession()`: Cached session check with database lookup and banned-user enforcement
  - `getOptionalSession()`: Returns null instead of redirecting (for setup check)
  - `requireAdmin()`: Enforces admin role, redirects non-admins to home
- **middleware.ts**: Edge Runtime route protection
  - Protects all routes except /login, /register, /setup
  - Redirects unauthenticated users to login
  - Redirects authenticated users away from login/register
  - Refreshes session on every request (rolling 7-day window)

### UI Foundation
- **shadcn/ui components**: button, input, label, card, form, separator, badge, dropdown-menu, sheet, avatar, table, dialog
- **Dark theme**: Default with rich green accent color (hsl(142 70% 45%)) evoking casino felt
- **Tailwind v4**: CSS-based configuration using @theme directive
- **Geist fonts**: Clean sans-serif typography

### Internationalization
- **next-intl** configured for German language
- **de.json**: Comprehensive translations for Phase 1
  - Common UI strings (loading, save, cancel, etc.)
  - Auth flow messages (login, register, invalid credentials, banned, etc.)
  - Admin dashboard labels (users, invites, ban/unban, etc.)
  - Navigation labels (lobby, admin, settings, connection status)

### Database Schema
```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  username     String    @unique
  displayName  String
  passwordHash String
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  bannedAt     DateTime?
  bannedReason String?
}

model Invite {
  id        String    @id @default(cuid())
  email     String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  createdBy String    // Foreign key to User
}

enum Role { ADMIN, USER }
```

## Task Completion

### Task 1: Initialize Next.js Project
**Commit:** `8f54e43`
**Files:**
- Configuration: package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, postcss.config.mjs, components.json, eslint.config.mjs
- Source: src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, src/lib/utils.ts, src/lib/db/index.ts, src/i18n/request.ts, src/messages/de.json, src/types/index.ts
- Database: prisma/schema.prisma
- Server: server.js
- Environment: .env.example, .gitignore
- UI Components: 12 shadcn/ui components in src/components/ui/

**Verification:**
- ✅ `npm run build` completes successfully
- ✅ `npx prisma validate` passes
- ✅ All configuration files valid (Next.js, Tailwind v4, Prisma 6)
- ✅ German translations file contains all Phase 1 strings

### Task 2: Implement Core Auth Library
**Commit:** `63ed4a0`
**Files:**
- src/lib/auth/session.ts: JWT session management (createSession, verifySession, updateSession, deleteSession)
- src/lib/auth/dal.ts: Data Access Layer (getSession, getOptionalSession, requireAdmin)
- src/middleware.ts: Route protection and session refresh

**Verification:**
- ✅ `npm run build` compiles without errors
- ✅ TypeScript compilation passes (all types correct)
- ✅ Middleware compiles for Edge Runtime (uses jose, not Prisma)
- ✅ All exports available and type-safe

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma v7 incompatibility**
- **Found during:** Task 1, Prisma generation
- **Issue:** Prisma v7.4.0 introduced breaking config changes (no `url` in datasource, requires `datasourceUrl` in constructor which has incompatible types)
- **Fix:** Downgraded to Prisma v6.19.2 which uses stable schema configuration
- **Files modified:** package.json, prisma/schema.prisma
- **Commit:** Included in 8f54e43
- **Rationale:** Prisma v7 is too new with unstable config patterns. v6 is mature and well-documented.

**2. [Rule 2 - Missing Critical] Tailwind v4 PostCSS plugin**
- **Found during:** Task 1, build attempt
- **Issue:** Tailwind v4 requires `@tailwindcss/postcss` package, not the base `tailwindcss` in PostCSS config
- **Fix:** Installed `@tailwindcss/postcss` and updated postcss.config.mjs
- **Files modified:** package.json, postcss.config.mjs
- **Commit:** Included in 8f54e43
- **Rationale:** Tailwind v4 architecture splits PostCSS plugin into separate package.

**3. [Rule 1 - Bug] ES module vs CommonJS mismatch**
- **Found during:** Task 1, build attempt
- **Issue:** package.json had `"type": "commonjs"` but source files use ES import/export syntax
- **Fix:** Changed package.json to `"type": "module"` and renamed next.config.js to next.config.mjs with ES syntax
- **Files modified:** package.json, next.config.mjs
- **Commit:** Included in 8f54e43
- **Rationale:** Next.js 16 and modern Node.js prefer ES modules.

**4. [Rule 2 - Missing Critical] Tailwind v4 CSS theme syntax**
- **Found during:** Task 1, build attempt
- **Issue:** Used Tailwind v3 CSS syntax (@layer base with :root and .dark classes) but v4 requires @theme directive
- **Fix:** Rewrote globals.css using @theme {} with --color-* variables
- **Files modified:** src/app/globals.css, tailwind.config.ts
- **Commit:** Included in 8f54e43
- **Rationale:** Tailwind v4 has new CSS-first configuration model.

**5. [Rule 2 - Missing Critical] tw-animate-css plugin removed**
- **Found during:** Task 1, build attempt
- **Issue:** Tailwind config referenced `tw-animate-css` plugin which doesn't exist for v4
- **Fix:** Removed plugin from tailwind.config.ts (animations work natively in v4)
- **Files modified:** tailwind.config.ts
- **Commit:** Included in 8f54e43
- **Rationale:** Tailwind v4 has built-in animation support.

## Next Phase Readiness

### Ready to Build
- ✅ Auth pages (01-02): `createSession`, `verifySession`, `deleteSession` ready to use
- ✅ App shell (01-03): `getSession` and middleware will protect routes
- ✅ Admin dashboard (01-04): `requireAdmin` enforces admin-only access
- ✅ German translations: All strings for Phase 1 exist in de.json

### Blockers
None. All foundation pieces are in place.

### Risks
1. **PostgreSQL not running:** Database push will fail until PostgreSQL is available. Mitigated by Prisma validation passing (schema is correct even without DB).
2. **Middleware deprecation warning:** Next.js 16 shows warning about middleware → proxy rename. This is a future breaking change but doesn't affect functionality now. Will need to rename in future Next.js version.
3. **No email API key:** Resend API key is placeholder. Email sending will fail until real key is added. Not blocking for Phase 1 Plan 2 (setup/login pages), only for Plan 4 (invites).

## Performance

- **Tasks completed:** 2/2
- **Commits:** 2 (one per task)
- **Files created:** 35
- **Build time:** ~1 second (Turbopack)
- **Execution duration:** 9 minutes

## Testing Evidence

```bash
# Prisma schema validates
$ npx prisma validate
✓ The schema at prisma\schema.prisma is valid

# Next.js build passes
$ npm run build
✓ Compiled successfully in 1006.3ms
✓ Generating static pages using 23 workers (3/3)

Route (app)
┌ ○ /
└ ○ /_not-found

ƒ Proxy (Middleware)
```

## Key Learnings

1. **Prisma v7 not production-ready:** Breaking config changes without clear migration path. Stick with v6 for stability.
2. **Tailwind v4 is CSS-first:** Major paradigm shift from JS config to CSS @theme directive. Documentation is sparse but pattern is clean once understood.
3. **Next.js 16 prefers ES modules:** Package type and config files should use .mjs or type: module.
4. **jose is Edge-compatible:** Perfect for middleware JWT operations. Works in Edge Runtime unlike most Node.js libraries.

## Architecture Notes

### Security Model
- **Stateless sessions:** JWTs in httpOnly cookies, 7-day rolling expiry
- **Banned user enforcement:** DAL checks database on every session verification (not just JWT validity)
- **Session refresh:** Middleware re-signs JWT on every request to extend expiry
- **No client-side secrets:** All auth logic server-side, client only has opaque cookie

### Performance Considerations
- **React cache:** getSession() uses React cache() to prevent redundant database queries within same request
- **No DB in middleware:** Middleware only does JWT verification (Edge Runtime), database checks happen in DAL
- **Prisma singleton:** Global variable pattern prevents multiple Prisma instances in development

### Pitfall Mitigations Implemented
- ✅ **Pitfall 1:** Session refresh on every request (middleware.ts)
- ✅ **Pitfall 7:** Banned user check in DAL, not just middleware (dal.ts)
- ✅ **No database in middleware:** JWT-only verification for Edge Runtime
- ✅ **Proper cookie settings:** httpOnly, secure in production, sameSite lax

---

**Phase:** 01-foundation-infrastructure
**Plan:** 01-01
**Status:** ✅ Complete
**Completed:** 2026-02-11
**Next:** 01-02 (Auth pages: setup, login, register)
