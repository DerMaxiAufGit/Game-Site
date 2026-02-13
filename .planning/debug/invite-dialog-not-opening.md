---
status: diagnosed
trigger: "Invite dialog doesn't open when clicking invite button on admin dashboard"
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:00:00Z
---

## Current Focus

hypothesis: onOpenChange handler always sets open to false, preventing dialog from opening
test: read invite-dialog.tsx line 83 - onOpenChange={handleClose} always calls setOpen(false)
expecting: confirmed via code read
next_action: report diagnosis

## Symptoms

expected: Clicking invite button opens the invite dialog
actual: Clicking invite button does nothing - no dialog appears
errors: none reported
reproduction: click the invite button on admin dashboard
started: unknown - possibly since initial implementation

## Eliminated

- hypothesis: Missing 'use client' directive on InviteDialog
  evidence: invite-dialog.tsx has 'use client' on line 1
  timestamp: 2026-02-11

- hypothesis: Server/client component boundary issue (InviteDialog rendered in server component)
  evidence: InviteDialog is a 'use client' component; rendering a client component from a server component is valid in Next.js - the server component just imports and renders it, and it hydrates on the client
  timestamp: 2026-02-11

- hypothesis: DialogTrigger not wired correctly
  evidence: DialogTrigger with asChild wrapping a Button is standard shadcn/radix pattern, used correctly on lines 84-88
  timestamp: 2026-02-11

- hypothesis: StatsCards missing 'use client' causing hydration issues
  evidence: StatsCards uses useTranslations from next-intl but lacks 'use client' - however this would cause its own error, not break InviteDialog. Also it is a separate component tree branch.
  timestamp: 2026-02-11

## Evidence

- timestamp: 2026-02-11
  checked: invite-dialog.tsx line 83
  found: `<Dialog open={open} onOpenChange={handleClose}>` - the onOpenChange prop is set to handleClose
  implication: Every time the dialog state changes (including when the trigger tries to OPEN it), handleClose is called

- timestamp: 2026-02-11
  checked: invite-dialog.tsx lines 75-80, handleClose function
  found: handleClose unconditionally calls `setOpen(false)` along with resetting other state
  implication: When DialogTrigger is clicked, Radix fires onOpenChange(true), but handleClose ignores the boolean argument and always sets open=false. The dialog can never open.

- timestamp: 2026-02-11
  checked: ban-dialog.tsx line 45 for comparison
  found: `<Dialog open={open} onOpenChange={onOpenChange}>` - BanDialog correctly passes through the boolean value
  implication: BanDialog works because it respects the true/false value from onOpenChange. InviteDialog does not.

## Resolution

root_cause: The Dialog's onOpenChange is set to handleClose which unconditionally calls setOpen(false), ignoring the boolean argument. When the DialogTrigger fires onOpenChange(true) to open the dialog, handleClose runs and sets open back to false immediately.
fix: Change onOpenChange to a function that respects the boolean value - use setOpen for opening, and run cleanup logic only when closing.
verification: pending
files_changed: []
