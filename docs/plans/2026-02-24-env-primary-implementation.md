# Env Primary With .env.local Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `.env` the primary config file with `.env.local` as a documented fallback, updating docs and messages accordingly.

**Architecture:** Keep Next.js env loading via `@next/env` and make the `.env` → `.env.local` order explicit in docs and runtime messaging. No behavioral change beyond clarity.

**Tech Stack:** Next.js, Node.js, TypeScript.

---

### Task 1: Update Documentation To Prefer `.env`

**Files:**
- Modify: `README.md`
- Modify: `docs/continue-on-another-pc.md`
- Modify: `docs/plans/2026-02-23-readme-release-setup.md`
- Modify: `docs/plans/2026-02-23-readme-release-setup-design.md`
- Modify: `docs/plans/2026-02-23-agents-md.md`
- Modify: `AGENTS.md`

**Step 1: Update README env setup**

Edit `README.md` so step 3 reads (exact text):

```markdown
### 3) Configure environment
Copy the example env file and edit it:
```bash
cp .env.example .env
```

Set these values in `.env` (or `.env.local` to override locally):
- `DATABASE_URL` (PostgreSQL connection string)
- `SESSION_SECRET` (generate with `openssl rand -base64 32`)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`
```

And update Troubleshooting bullet to:

```markdown
- Missing env values: verify `.env` is present and filled out (use `.env.local` for overrides).
```

**Step 2: Update docs/continue-on-another-pc.md**

Change step 3 to:

```markdown
3. Create local env file:
- Copy `.env.example` to `.env`
- (Optional) Create `.env.local` for machine-specific overrides
- Set at least:
  - `DATABASE_URL`
  - `SESSION_SECRET`
```

**Step 3: Update historical plan docs**

Adjust env references in:
- `docs/plans/2026-02-23-readme-release-setup.md`
- `docs/plans/2026-02-23-readme-release-setup-design.md`
- `docs/plans/2026-02-23-agents-md.md`

Replace `.env.local`-only mentions with `.env` primary and `.env.local` fallback. Use exact phrasing similar to:
- "Create env: copy `.env.example` to `.env` (use `.env.local` for overrides)"
- "Missing env vars → check `.env` (or `.env.local` overrides)"
- In the AGENTS.md plan snippet, update the configuration note to: "Local environment files live in `.env` with optional `.env.local` overrides and are ignored by git."

**Step 4: Update AGENTS.md configuration note**

Replace the last bullet to:

```markdown
- Local environment files live in `.env` with optional `.env.local` overrides and are ignored by git.
```

**Step 5: Commit docs changes**

```bash
git add README.md docs/continue-on-another-pc.md docs/plans/2026-02-23-readme-release-setup.md docs/plans/2026-02-23-readme-release-setup-design.md docs/plans/2026-02-23-agents-md.md AGENTS.md
git commit -m "docs: prefer .env with .env.local fallback"
```

### Task 2: Update Runtime Messaging And Server Comment

**Files:**
- Modify: `src/lib/email/invite.ts`
- Modify: `server.js`

**Step 1: Update invite warning**

In `src/lib/email/invite.ts`, replace the warning string with:

```ts
'⚠️ RESEND_API_KEY not configured. Email sending skipped. Set RESEND_API_KEY in .env (or .env.local for overrides) to enable email sending.'
```

**Step 2: Update server env comment**

In `server.js`, update the comment to:

```js
// Load .env (primary) and .env.local (fallback) before accessing env vars
```

**Step 3: Run tests**

Run: `npm test`

Expected: All tests pass.

**Step 4: Commit code changes**

```bash
git add src/lib/email/invite.ts server.js
git commit -m "docs: clarify env load order and messages"
```
