---
phase: 03-virtual-currency-betting
plan: 01
subsystem: core-wallet-infrastructure
tags: [database, transactions, validation, financial]

dependency_graph:
  requires: []
  provides:
    - wallet-database-schema
    - acid-safe-balance-operations
    - transaction-ledger
    - system-settings-configuration
  affects:
    - all-wallet-operations
    - betting-escrow
    - admin-finance-dashboard

tech_stack:
  added:
    - prisma-interactive-transactions
    - serializable-isolation-level
  patterns:
    - transaction-ledger-audit-trail
    - lazy-wallet-initialization
    - frozen-wallet-restrictions

key_files:
  created:
    - src/lib/wallet/types.ts
    - src/lib/wallet/transactions.ts
    - src/lib/validations/wallet.ts
  modified:
    - prisma/schema.prisma
    - prisma/seed.ts

decisions:
  - title: "Serializable isolation for all balance operations"
    rationale: "Prevents race conditions in concurrent balance updates using database-level ACID guarantees"
    alternative: "Application-level locking"
    impact: "Critical for financial correctness"

  - title: "Lazy wallet initialization on first access"
    rationale: "Allows existing users to get wallets without migration, creates INITIAL transaction record"
    alternative: "Require migration script for existing users"
    impact: "Seamless rollout"

  - title: "Frozen wallets can receive but not send"
    rationale: "Admin freeze prevents outbound abuse while allowing inbound payments and wins"
    alternative: "Full wallet freeze blocks all operations"
    impact: "More flexible moderation"

  - title: "Transaction ledger with immutable records"
    rationale: "Complete audit trail for all balance changes with descriptive metadata"
    alternative: "Balance-only tracking without history"
    impact: "Financial accountability and debugging"

metrics:
  duration_minutes: 1.6
  tasks_completed: 2
  files_created: 3
  files_modified: 2
  commits: 2
  lines_added: 540
  completed_at: "2026-02-12T11:19:07Z"
---

# Phase 03 Plan 01: Core Wallet Infrastructure Summary

**One-liner:** ACID-safe wallet operations with Prisma Serializable transactions, lazy initialization, and immutable transaction ledger for complete audit trail.

## What Was Built

### Database Schema
- **Wallet model:** User balance, frozen status, daily claim tracking, indexes for leaderboards
- **Transaction model:** Complete ledger with type enum, amounts, user relations, room references, descriptive metadata
- **BetEscrow model:** Escrow state machine (PENDING/LOCKED/RELEASED/FORFEITED) for bet lifecycle
- **SystemSettings model:** Single-row configuration table with all economic parameters (currency name, starting balance, daily/weekly amounts, transfer limits, bet presets, payout ratios, AFK grace period, alert thresholds)
- **Enums:** TransactionType (11 types: INITIAL, DAILY_CLAIM, GAME_WIN, BET_PLACED, TRANSFER_SENT, etc.) and EscrowStatus (4 states)

### Core Wallet Library
- **getSystemSettings():** Fetch singleton SystemSettings row with cache-friendly pattern
- **getWalletWithUser():** Lazy wallet initialization creates wallet with starting balance on first access, creates INITIAL transaction record
- **creditBalance():** Add to balance with atomic transaction, validates amount > 0, creates transaction record
- **debitBalance():** Subtract from balance with validation (sufficient balance, not frozen), creates transaction record, throws on insufficient funds
- **getTransactionHistory():** Paginated transaction list with cursor-based pagination, includes related user info for transfers
- **getBalanceHistory():** Daily balance snapshots for charts, calculates running balance from transaction log

All operations use Prisma interactive transactions with:
- `isolationLevel: Serializable` (prevents race conditions)
- `maxWait: 5000ms, timeout: 10000ms`
- Transaction record creation INSIDE same transaction as balance changes

### Validation Schemas
- **transferSchema:** User-to-user transfers with positive amount validation
- **adjustBalanceSchema:** Admin credit/debit with optional reason field
- **betSettingsSchema:** Game betting configuration with amount and payout ratio validation
- **systemSettingsSchema:** All configurable economic parameters with range validation

## Deviations from Plan

None - plan executed exactly as written. Schema already existed from prior preparation, library implementation followed specification precisely.

## Verification Results

**TypeScript compilation:** PASSED - `npx tsc --noEmit` completed without errors

**Prisma generation:** PASSED - Client generated successfully with all models and types

**Database sync:** PASSED - `npx prisma db push` confirmed schema in sync

**Database seed:** PASSED - SystemSettings row created with defaults:
- Currency name: "Chips"
- Starting balance: 1000
- Daily allowance: 100
- Weekly bonus: 500
- Transfer limits: max 1000, daily 5000
- Default bet presets: [50, 100, 250, 500]
- Default payout ratios: 1st: 60%, 2nd: 30%, 3rd: 10%
- AFK grace period: 30s
- Alert thresholds: transfer 2000, balance drop 50%

## Key Technical Decisions

### Why Serializable Isolation?
Read-modify-write patterns (check balance → decrement) require highest isolation level to prevent phantom reads and race conditions. Example: two concurrent bets of 600 from balance 1000 could both succeed with lower isolation, creating negative balance. Serializable prevents this at database level.

### Why Lazy Initialization?
Existing users don't have wallets yet. Creating on first access (with INITIAL transaction record) allows seamless rollout without migration script. Starting balance comes from SystemSettings to respect current admin configuration.

### Why Frozen Wallet Asymmetry?
Admin freeze prevents user from sending transfers or placing bets (outbound operations), but allows receiving transfers, game wins, daily claims (inbound operations). Enables moderation without locking user out completely - they can still play free rooms and accumulate balance.

## Integration Points

**Provides to other plans:**
- `getWalletWithUser()` - Used by betting flow, wallet UI, admin tools
- `creditBalance()` / `debitBalance()` - Called by game payouts, transfers, daily claims
- `getSystemSettings()` - Referenced by all wallet operations for limits and defaults
- Type exports (TransactionType, EscrowStatus, WalletWithUser, etc.) - Used throughout phase

**Dependencies (satisfied):**
- Prisma client with PostgreSQL (Phase 1)
- Zod validation library (Phase 1)
- User model with relations (Phase 1)

## Files Reference

**Types:** `/home/maxi/Documents/coding/AI/claude/kniff/src/lib/wallet/types.ts`
- Exports: TransactionType, EscrowStatus, WalletWithUser, CreditResult, DebitResult, SystemSettingsConfig

**Transactions:** `/home/maxi/Documents/coding/AI/claude/kniff/src/lib/wallet/transactions.ts`
- Exports: getSystemSettings, getWalletWithUser, creditBalance, debitBalance, getTransactionHistory, getBalanceHistory

**Validations:** `/home/maxi/Documents/coding/AI/claude/kniff/src/lib/validations/wallet.ts`
- Exports: transferSchema, adjustBalanceSchema, betSettingsSchema, systemSettingsSchema

**Schema:** `/home/maxi/Documents/coding/AI/claude/kniff/prisma/schema.prisma`
- Models: Wallet, Transaction, BetEscrow, SystemSettings
- Enums: TransactionType, EscrowStatus

**Seed:** `/home/maxi/Documents/coding/AI/claude/kniff/prisma/seed.ts`
- Creates SystemSettings singleton with defaults

## Testing Notes

**Manual verification performed:**
- Database schema push succeeded
- Prisma client generation succeeded
- TypeScript compilation passed
- SystemSettings seed created successfully

**Automated testing recommendations for next phase:**
- Concurrent balance operation tests (multiple simultaneous debits/credits)
- Insufficient balance validation
- Frozen wallet restriction enforcement
- Transaction record creation atomicity
- Lazy initialization idempotency

## Known Limitations

1. **No balance history optimization:** `getBalanceHistory()` fetches all transactions since start date and calculates running balance in memory. For users with thousands of transactions, consider materialized daily snapshots.

2. **No transaction pagination infinite scroll:** Cursor-based pagination implemented but no automatic loading of next page in UI yet (Plan 03-05).

3. **No concurrent transaction limit:** Multiple operations on same wallet could cause Serializable transaction conflicts and retries. Consider implementing exponential backoff retry logic if conflicts become frequent under load.

4. **SystemSettings singleton not enforced:** Schema allows multiple SystemSettings rows, but seed and code assume single row. Consider unique constraint or singleton pattern enforcement.

## Self-Check

### Verification: Created Files
```bash
[ -f "src/lib/wallet/types.ts" ] && echo "FOUND: src/lib/wallet/types.ts" || echo "MISSING: src/lib/wallet/types.ts"
[ -f "src/lib/wallet/transactions.ts" ] && echo "FOUND: src/lib/wallet/transactions.ts" || echo "MISSING: src/lib/wallet/transactions.ts"
[ -f "src/lib/validations/wallet.ts" ] && echo "FOUND: src/lib/validations/wallet.ts" || echo "MISSING: src/lib/validations/wallet.ts"
```

**Result:**
FOUND: src/lib/wallet/types.ts
FOUND: src/lib/wallet/transactions.ts
FOUND: src/lib/validations/wallet.ts

### Verification: Commits
```bash
git log --oneline --all | grep "03-01"
```

**Result:**
cceda68 feat(03-01): implement core wallet operations library
72196c8 feat(03-01): add wallet database schema and seed

## Self-Check: PASSED

All files created and committed successfully. Core wallet infrastructure operational and ready for integration.

## Next Steps

**Immediate dependencies (Plan 03-02):**
- Escrow state machine implementation uses BetEscrow model
- Payout calculator uses creditBalance() for game wins

**Future integration (Plan 03-03+):**
- Wallet UI components consume getWalletWithUser(), getTransactionHistory(), getBalanceHistory()
- Betting flow uses debitBalance() for buy-ins, creditBalance() for payouts
- Admin dashboard uses getSystemSettings() for configuration display/editing
- Daily claim feature uses creditBalance() with DAILY_CLAIM transaction type
