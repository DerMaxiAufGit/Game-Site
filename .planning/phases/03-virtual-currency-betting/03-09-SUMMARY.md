---
phase: 03-virtual-currency-betting
plan: 09
subsystem: admin-finance
tags: [balance-management, suspicious-activity, admin-tools, real-time]
dependency_graph:
  requires: [03-01, 03-05, 03-08]
  provides: [balance-adjustment-ui, wallet-freeze, suspicious-activity-alerts, custom-starting-balance]
  affects: [admin-dashboard, wallet-system, invite-flow, socket-events]
tech_stack:
  added: []
  patterns: [server-actions, socket-events, debounced-search, auto-refresh]
key_files:
  created:
    - src/components/admin/balance-adjust.tsx
    - src/components/admin/alert-monitor.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/actions/admin-finance.ts
    - src/lib/actions/admin.ts
    - src/lib/wallet/transactions.ts
    - src/components/admin/invite-dialog.tsx
    - src/app/(app)/admin/finance/page.tsx
    - server.js
decisions:
  - title: Real-time balance notification via Socket.IO
    rationale: Admin adjustments trigger 'admin:balance-adjusted' event, server verifies admin role and emits 'balance:updated' to affected user's room
    alternatives: [polling, server-sent events]
    outcome: Instant balance updates for affected users without page reload
  - title: Separate single and bulk adjustment flows
    rationale: Different UX patterns - single needs user selection card and freeze controls, bulk needs multi-select or all-users mode
    alternatives: [unified form with mode toggle]
    outcome: Clearer UI with appropriate controls per use case
  - title: Custom starting balance per invite
    rationale: GUTH-01 requirement - admin can override default starting balance for specific invites
    implementation: Optional customStartingBalance field on Invite model, checked during wallet initialization
    outcome: Flexible invite creation without changing global settings
  - title: Alert thresholds configurable via SystemSettings
    rationale: Suspicious activity detection needs adjustable limits without code changes
    fields: [alertTransferLimit, alertBalanceDropPct]
    outcome: Live economy tuning for alert sensitivity
metrics:
  duration: 391s
  tasks_completed: 2
  files_created: 2
  files_modified: 7
  completed_date: 2026-02-12
---

# Phase 03 Plan 09: Admin Balance Management Summary

**One-liner:** Admin balance adjustment tools (single/bulk), wallet freeze/unfreeze, suspicious activity detection with configurable alerts, and custom starting balance per invite.

## What Was Built

### Balance Adjustment System
- **BalanceAdjust component** - Comprehensive admin UI for balance management
  - Single adjustment: debounced user search, selection card with current balance and frozen status
  - Amount input with +/- toggle buttons (positive = credit, negative = debit)
  - Optional reason field for audit trail
  - Real-time balance update: emits socket event after successful adjustment
- **Bulk adjustment**: selected users or all users with confirmation dialog
  - Multi-select from search results with checkboxes
  - Warning display when "all users" mode selected
  - Returns affected user IDs for batch socket notifications
- **Wallet freeze/unfreeze** functionality
  - Freeze status display with timestamp (formatDistanceToNow)
  - Tooltip explaining freeze behavior: can play but cannot bet or transfer
  - Toggle between freeze/unfreeze buttons based on current status

### Suspicious Activity Monitoring
- **AlertMonitor component** - Auto-refreshing alert dashboard
  - Fetches on mount and refreshes every 60 seconds
  - Three alert types:
    1. **Large transfers**: TRANSFER_SENT transactions over alertTransferLimit (24h window)
    2. **Daily limit exceeded**: Sum of transfers per user over transferDailyLimit (24h window)
    3. **Rapid balance drops**: Balance decrease > alertBalanceDropPct% in 1 hour
  - Severity levels: warning (amber) and critical (red)
  - Color-coded cards with icons (AlertTriangle, Shield)
  - Shows "Keine verdächtigen Aktivitäten" green card when clean
  - Legend explaining each alert type

### Custom Starting Balance
- **Invite model enhancement**: Added optional `customStartingBalance Int?` field
- **InviteDialog update**: Optional number input "Individuelles Startguthaben"
  - Placeholder shows current default (e.g., "Standard: 1000")
  - Help text: "Leer lassen für Standard-Startguthaben"
  - Passed to createInvite server action
- **createInvite update**: Accepts and stores customStartingBalance
- **getWalletWithUser enhancement**: Looks up user's invite during lazy initialization
  - Uses invite's customStartingBalance if set, otherwise SystemSettings.startingBalance
  - Creates INITIAL transaction with correct amount
  - Metadata includes `fromInvite` flag for audit

### Real-Time Balance Notification
- **Server action updates**:
  - adjustUserBalance returns userId for socket notification
  - bulkAdjustBalance returns affectedUserIds array
- **Socket handler**: `admin:balance-adjusted` in server.js
  - Verifies emitting user is admin (role check)
  - Fetches affected user's current wallet balance
  - Emits `balance:updated` to `user:${userId}` room
  - Logs notification for debugging
- **Client integration**: BalanceAdjust component emits event after successful adjustment

### Admin Finance Page Integration
- Updated tabs from 3 to 5: Dashboard | Transaktionen | Guthaben | Alarme | Einstellungen
- Alarme tab shows alert count badge (red) when alerts.length > 0
- Pre-fetches alerts on page load for instant display

## Server Actions Added
1. **getSuspiciousActivity()**: Parallel alert queries with configurable thresholds
2. **getUsersWithWallets(search?)**: Returns users with wallet info, supports search filter (displayName/username/email contains)
3. **adjustUserBalance**: Enhanced to return userId
4. **bulkAdjustBalance**: Enhanced to return affectedUserIds
5. **freezeWallet(userId)**: Sets frozenAt timestamp
6. **unfreezeWallet(userId)**: Clears frozenAt
7. **createInvite**: Accepts customStartingBalance

## Technical Implementation

### Alert Detection Queries
- **Large transfers**: WHERE type='TRANSFER_SENT' AND createdAt >= 24h ago AND amount >= alertTransferLimit
- **Daily limits**: GROUP BY userId, SUM(amount) HAVING sum > transferDailyLimit
- **Balance drops**: Calculate previous balance from transaction history (work backwards), compare drop percentage

### Socket Event Flow
1. Admin adjusts balance via BalanceAdjust component
2. Server action returns success + userId
3. Client emits 'admin:balance-adjusted' with { userId }
4. Server handler verifies admin role
5. Server fetches current wallet balance
6. Server emits 'balance:updated' to user:${userId} room
7. Affected user's SocketProvider updates reactive balance state

### Wallet Freeze Enforcement
- Frozen wallets: frozenAt !== null
- debitBalance() checks frozen status, throws error if frozen
- creditBalance() works normally (can receive transfers, wins, claims)
- Asymmetric blocking: outbound operations blocked, inbound allowed

## Deviations from Plan

### Auto-fixed Issues

**[Rule 3 - Import path fix] Fixed socket provider import**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** balance-adjust.tsx used wrong import path '@/components/providers/socket-provider'
- **Fix:** Changed to '@/lib/socket/provider' (correct path from existing code)
- **Files modified:** src/components/admin/balance-adjust.tsx, src/components/betting/afk-warning.tsx
- **Reason:** Critical - TypeScript compilation would fail, blocking plan completion

None beyond the import path fix above.

## Verification Results

All verification criteria met:
- ✅ Admin can search users and adjust balance (positive and negative)
- ✅ Balance adjustment shows in transaction history (ADMIN_CREDIT/ADMIN_DEBIT types)
- ✅ Affected user's balance updates via socket event (admin:balance-adjusted → balance:updated)
- ✅ Bulk adjustment applies to multiple users (selected or all)
- ✅ Wallet freeze prevents outbound operations (debitBalance throws error)
- ✅ Alert monitor shows suspicious activity (three alert types with severity)
- ✅ Alert monitor shows "no alerts" when clean (green card with CheckCircle2)
- ✅ Invite dialog has optional "Startguthaben" field
- ✅ New user invited with custom starting balance receives that amount
- ✅ New user invited without custom amount receives global default
- ✅ All admin finance tabs load (5 tabs total)
- ✅ TypeScript compilation passes (npx tsc --noEmit)

## Integration Points

### With Phase 03-01 (Wallet Foundation)
- Uses getWalletWithUser for lazy wallet initialization
- Extends wallet creation logic to check invite's customStartingBalance
- Creates ADMIN_CREDIT/ADMIN_DEBIT transactions via prisma transaction

### With Phase 03-05 (Admin Finance Dashboard)
- Adds two new tabs to existing finance page
- Reuses SystemSettings for alert thresholds (alertTransferLimit, alertBalanceDropPct)
- Integrates with existing transaction log and settings components

### With Phase 03-08 (Socket Integration)
- Emits admin:balance-adjusted event after adjustments
- Server verifies admin role before emitting balance:updated
- Affected users receive instant balance updates via existing socket infrastructure

### With Invite System
- Extends Invite model with optional customStartingBalance
- Updates createInvite action to accept new field
- InviteDialog component provides UI for override

## Self-Check: PASSED

**Created files exist:**
- ✅ FOUND: src/components/admin/balance-adjust.tsx
- ✅ FOUND: src/components/admin/alert-monitor.tsx

**Commits exist:**
- ✅ FOUND: be4f838 (Task 1: suspicious activity detection, custom starting balance)
- ✅ FOUND: fcd4172 (Task 2: balance adjustment UI, wallet freeze, alert monitor)

**Modified files verified:**
- ✅ prisma/schema.prisma - customStartingBalance field added to Invite model
- ✅ src/lib/actions/admin-finance.ts - getSuspiciousActivity, getUsersWithWallets added
- ✅ src/lib/actions/admin.ts - customStartingBalance handling in createInvite
- ✅ src/lib/wallet/transactions.ts - getWalletWithUser checks invite for custom balance
- ✅ src/components/admin/invite-dialog.tsx - custom starting balance input field
- ✅ src/app/(app)/admin/finance/page.tsx - Guthaben and Alarme tabs added
- ✅ server.js - admin:balance-adjusted socket handler added

## Success Criteria Met

✅ Admin has full balance management: single adjustments with reason (real-time notification to affected user), bulk adjustments, wallet freeze/unfreeze

✅ Suspicious activity alerts detect large transfers, daily limit violations, and rapid balance drops

✅ Custom starting balance at invitation works (optional override per invite)

✅ All configurable via SystemSettings thresholds (alertTransferLimit, alertBalanceDropPct, transferDailyLimit)

✅ Real-time balance updates for affected users via Socket.IO event chain

✅ All admin finance operations logged in transaction history with audit metadata
