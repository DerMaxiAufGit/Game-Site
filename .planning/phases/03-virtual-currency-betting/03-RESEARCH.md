# Phase 3: Virtual Currency & Betting - Research

**Researched:** 2026-02-12
**Domain:** Virtual currency system, financial transactions, betting mechanics
**Confidence:** HIGH

## Summary

This phase implements a virtual wallet and betting system for game rooms. The technical domain centers on ACID-compliant financial transactions, real-time balance updates via Socket.IO, interactive data visualization for wallet/admin dashboards, and escrow mechanisms for bet handling.

The existing stack already provides the foundation: PostgreSQL with Prisma ORM for database operations, Socket.IO for real-time communication, Next.js server actions for mutations, and Radix UI components for dialogs and UI primitives. The primary new additions are Recharts for charting and potentially react-countup for animated balance displays.

Key technical challenges include: (1) ensuring transaction atomicity for concurrent balance updates using Prisma interactive transactions with proper isolation levels, (2) implementing efficient audit logging for all financial operations, (3) real-time balance synchronization across multiple user sessions, (4) structuring the transaction ledger for accurate historical tracking and reporting, and (5) building configurable admin controls that don't require code changes.

**Primary recommendation:** Use Prisma interactive transactions with Serializable isolation for all balance-modifying operations, implement a transaction ledger pattern (not double-entry for this use case) for audit trail, emit Socket.IO events to user-specific rooms for real-time updates, use Recharts for all charting needs, and store economic configuration in database with admin UI controls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Betting flow:**
- Room creator sets bet amount upfront — players see it before joining
- Separate toggle for "free" vs "bet" room (not just bet=0) — different room badges/labels in lobby
- Buy-in deducted on join — refunded if leaving before game starts
- Confirmation dialog when bet exceeds 25% of player's current balance (percentage-based threshold)
- Leaving mid-game in bet room = forfeit buy-in — pot distributed among finishers
- AFK in bet rooms gets a grace period warning before kick/forfeit
- Preset bet amounts (e.g. 50, 100, 250, 500) plus custom input option
- No hard global min/max limits — reasonable defaults with full creator freedom
- Room creator can set min/max bet for their room
- Room creator can configure payout ratios with reasonable defaults (e.g. 1st: 60%, 2nd: 30%, 3rd: 10%)
- Tied players split the prize for their position evenly
- Pot always visible on game board during gameplay
- Results screen shows detailed payout breakdown per player ('+240 Chips (1. Platz)')
- Bet rooms visible in lobby with chip icon + bet amount badge AND filter tabs (Free/Bet)
- Players with insufficient balance can still see bet rooms and join as spectators

**Balance display & wallet:**
- Balance always visible in sidebar as persistent widget
- Sidebar balance clickable — hover shows mini popover (last 3 transactions), click navigates to full wallet page
- Animated counter on balance changes — number ticks up/down with green/red flash
- Full dedicated wallet page with:
  - Balance graph over time (line chart) at top
  - Transaction list grouped by day with filter controls (all, wins, losses, transfers, admin adjustments)
  - Each transaction descriptive: 'Kniffel gewonnen (1. Platz)', 'Einsatz: Raum ABC', 'Admin-Gutschrift'
- Currency name is admin-configurable in system settings (not hardcoded)

**Economic tuning:**
- Starting balance set globally by admin in system settings (no hardcoded default)
- Daily allowance for ALL players (not just zero-balance) — manual claim button on wallet page ('Tägliches Guthaben abholen')
- Daily amount scales with player activity (more active = slightly more)
- Weekly bonus: bigger reward every ~7 days, rest of days are same amount
- Player-to-player transfers supported — like PayPal for the platform
- Transfer limits configurable by admin in system settings
- Send money from wallet page OR directly from any user's profile/player card

**Admin balance tools:**
- Dedicated admin finance page (separate from existing admin dashboard)
- Full economy dashboard: charts showing total circulation, daily transaction volume, top earners/spenders, average balance
- Balance adjustments with optional reason field (logged either way)
- Bulk balance adjustments — select multiple users or 'all users' and apply change at once
- Full transaction log showing everything: game payouts, bets, P2P transfers, daily claims, admin adjustments — filterable
- Configurable alerts for suspicious activity (e.g. transfers > threshold, rapid balance drops) — shown in dashboard
- Balance freeze option: admin can freeze a user's wallet (user can play free rooms but can't bet or transfer)

**System settings (admin):**
- Full economic config page: currency name, starting balance, daily allowance amount, weekly bonus amount, transfer limits, default bet presets, default payout ratios, AFK grace period for bet rooms, alert thresholds

### Claude's Discretion

- Database schema design for transactions (ACID compliance)
- Escrow implementation for active bets
- Activity scoring algorithm for daily allowance scaling
- Chart library choice for balance graph and admin dashboard
- API design for balance operations
- Real-time balance update mechanism (WebSocket events)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | PostgreSQL ORM with transaction support | Already in use, provides interactive transactions with isolation level control for ACID compliance |
| PostgreSQL | Latest | Relational database | Already in use, supports advanced transaction isolation and JSONB for flexible data |
| Socket.IO | 4.8.3 | Real-time bidirectional events | Already in use for game state, perfect for balance updates via user-specific rooms |
| Recharts | 2.x (latest) | React charting library | D3-powered, declarative React API, excellent for line charts and responsive dashboards |
| Radix UI | 1.x (current) | Accessible UI primitives | Already in use, provides AlertDialog for bet confirmations |
| Zod | 4.3.6 | Schema validation | Already in use for form validation, critical for financial input validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-countup | 6.x | Animated number counter | Optional for balance animation - smooth number transitions with configurable easing |
| date-fns | Latest | Date manipulation and formatting | Transaction grouping by day, relative time display ("2 hours ago") |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js (react-chartjs-2) | Simpler API but less React-idiomatic, harder to customize with CSS |
| Recharts | Visx | More control and smaller bundle but steeper learning curve, overkill for standard charts |
| react-countup | Framer Motion AnimateNumber | More powerful animation library but heavier bundle for just number animation |
| Transaction ledger | Double-entry accounting | More robust but excessive complexity for virtual currency (not real money) |

**Installation:**
```bash
npm install recharts date-fns
npm install react-countup  # optional for animated counter
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── actions/
│   │   ├── wallet.ts           # Server actions: balance operations, transfers, claims
│   │   └── betting.ts          # Server actions: room bet operations, payouts
│   ├── wallet/
│   │   ├── transactions.ts     # Transaction creation, validation, logging
│   │   ├── escrow.ts           # Bet escrow logic (lock, release, forfeit)
│   │   ├── activity-score.ts   # Activity scoring for daily scaling
│   │   └── payout.ts           # Prize distribution, tie splitting
│   └── validations/
│       └── wallet.ts           # Zod schemas for all wallet operations
├── components/
│   ├── wallet/
│   │   ├── balance-widget.tsx      # Sidebar persistent balance display
│   │   ├── balance-popover.tsx     # Hover preview with last 3 txns
│   │   ├── balance-chart.tsx       # Recharts line chart
│   │   ├── transaction-list.tsx    # Grouped transaction history
│   │   ├── claim-daily.tsx         # Daily allowance claim button
│   │   └── transfer-form.tsx       # P2P transfer form
│   ├── betting/
│   │   ├── bet-confirmation.tsx    # AlertDialog for high-stakes bets
│   │   ├── bet-toggle.tsx          # Room creation: free vs bet toggle
│   │   ├── pot-display.tsx         # Game board pot visibility
│   │   └── payout-breakdown.tsx    # Results screen payout details
│   └── admin/
│       ├── finance-dashboard.tsx   # Charts: circulation, volume, leaderboards
│       ├── transaction-log.tsx     # Full audit log with filters
│       ├── balance-adjust.tsx      # Single/bulk adjustments
│       ├── economic-settings.tsx   # Currency name, amounts, limits
│       └── alert-monitor.tsx       # Suspicious activity alerts
└── app/
    ├── (app)/
    │   ├── wallet/
    │   │   └── page.tsx            # Full wallet page
    │   └── admin/
    │       └── finance/
    │           └── page.tsx        # Admin finance dashboard
    └── api/
        └── socket/
            └── wallet-events.ts    # Socket.IO event handlers for balance updates
```

### Pattern 1: Interactive Transaction for Balance Operations
**What:** Use Prisma `$transaction(async (tx) => {...})` with Serializable isolation for all operations that read-then-modify balance.
**When to use:** Any operation involving balance checks before modification: transfers, bets, withdrawals, payouts.

**Example:**
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
import { Prisma } from '@prisma/client'

async function transferFunds(fromUserId: string, toUserId: string, amount: number) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Fetch sender wallet
      const sender = await tx.wallet.findUniqueOrThrow({
        where: { userId: fromUserId }
      })

      // 2. Validate balance
      if (sender.balance < amount) {
        throw new Error('Insufficient balance')
      }

      // 3. Atomic updates
      const [updatedSender, updatedRecipient] = await Promise.all([
        tx.wallet.update({
          where: { userId: fromUserId },
          data: { balance: { decrement: amount } }
        }),
        tx.wallet.update({
          where: { userId: toUserId },
          data: { balance: { increment: amount } }
        })
      ])

      // 4. Log transaction
      await tx.transaction.create({
        data: {
          type: 'TRANSFER',
          amount,
          fromUserId,
          toUserId,
          description: `Transfer to ${toUserId}`
        }
      })

      return { sender: updatedSender, recipient: updatedRecipient }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000
    }
  )
}
```

### Pattern 2: Socket.IO User-Specific Rooms for Balance Updates
**What:** Each user joins a room identified by their userId on connection, enabling targeted balance update events.
**When to use:** Real-time balance synchronization across multiple sessions/tabs for the same user.

**Example:**
```typescript
// Source: https://socket.io/get-started/private-messaging-part-2/
// Server-side
io.on("connection", async (socket) => {
  const userId = await getUserIdFromSocket(socket)
  socket.join(userId) // User joins their own room

  // Later, emit balance update to specific user
  io.to(userId).emit("balance:updated", {
    newBalance: 1500,
    change: +100,
    reason: "Game win"
  })
})

// Client-side
socket.on("balance:updated", ({ newBalance, change, reason }) => {
  // Trigger animated counter, flash green/red
  updateBalanceUI(newBalance, change)
})
```

### Pattern 3: Transaction Ledger with Descriptive Metadata
**What:** Store all balance changes as immutable transaction records with type, amount, description, and timestamp.
**When to use:** Every single balance modification for complete audit trail and transaction history.

**Example:**
```typescript
// Schema
model Transaction {
  id          String   @id @default(cuid())
  type        TransactionType
  amount      Int      // in smallest currency unit (e.g., cents/chips)
  userId      String
  relatedUserId String? // for transfers
  roomId      String?  // for bets/wins
  description String   // "Kniffel gewonnen (1. Platz)", "Einsatz: Raum ABC"
  metadata    Json?    // flexible field for extra data
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([type, createdAt])
}

enum TransactionType {
  INITIAL        // Starting balance
  DAILY_CLAIM    // Daily allowance
  WEEKLY_BONUS   // Weekly bonus
  GAME_WIN       // Game payout
  BET_PLACED     // Bet deducted
  BET_REFUND     // Bet returned (left before start)
  BET_FORFEIT    // Bet lost (AFK/quit mid-game)
  TRANSFER_SENT  // P2P transfer out
  TRANSFER_RECEIVED // P2P transfer in
  ADMIN_CREDIT   // Admin added balance
  ADMIN_DEBIT    // Admin removed balance
}
```

### Pattern 4: Escrow State Machine for Bet Management
**What:** Model escrow as explicit database state (PENDING → LOCKED → RELEASED/FORFEITED) rather than long-running transactions.
**When to use:** Bets from room creation → game start → game end with potential forfeits.

**Example:**
```typescript
model BetEscrow {
  id          String   @id @default(cuid())
  roomId      String
  userId      String
  amount      Int
  status      EscrowStatus
  lockedAt    DateTime?
  releasedAt  DateTime?
  createdAt   DateTime @default(now())

  room        GameRoom @relation(fields: [roomId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@index([status, createdAt])
}

enum EscrowStatus {
  PENDING    // Bet placed, can still leave and get refund
  LOCKED     // Game started, bet committed
  RELEASED   // Payout completed
  FORFEITED  // Left mid-game or AFK kicked
}

// Flow
async function joinBetRoom(userId: string, roomId: string) {
  return await prisma.$transaction(async (tx) => {
    const room = await tx.gameRoom.findUniqueOrThrow({ where: { id: roomId } })
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } })

    if (wallet.balance < room.betAmount) {
      throw new Error('Insufficient balance')
    }

    // Deduct balance
    await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: room.betAmount } }
    })

    // Create escrow
    await tx.betEscrow.create({
      data: {
        roomId,
        userId,
        amount: room.betAmount,
        status: 'PENDING'
      }
    })

    // Log transaction
    await tx.transaction.create({
      data: {
        type: 'BET_PLACED',
        userId,
        roomId,
        amount: -room.betAmount,
        description: `Einsatz: ${room.name}`
      }
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
```

### Pattern 5: Prize Distribution with Tie Splitting
**What:** Calculate payout amounts based on configurable ratios, automatically splitting prizes when players tie.
**When to use:** Game end with multiple finishing positions and potential ties.

**Example:**
```typescript
// Source: Based on https://whatisesports.xyz/prize-pool-distribution/
interface PayoutConfig {
  [position: number]: number // position -> percentage (60, 30, 10)
}

interface FinalRanking {
  position: number
  userIds: string[] // multiple if tied
}

function calculatePayouts(
  totalPot: number,
  rankings: FinalRanking[],
  config: PayoutConfig
): Map<string, number> {
  const payouts = new Map<string, number>()

  rankings.forEach(({ position, userIds }) => {
    // Get percentage for this position
    const percentage = config[position] || 0
    const positionPrize = Math.floor((totalPot * percentage) / 100)

    // Split evenly if tied
    const perPlayer = Math.floor(positionPrize / userIds.length)

    userIds.forEach(userId => {
      payouts.set(userId, perPlayer)
    })
  })

  return payouts
}

// Usage
const rankings = [
  { position: 1, userIds: ['user1'] },
  { position: 2, userIds: ['user2', 'user3'] }, // Tied for 2nd
  { position: 3, userIds: ['user4'] }
]
const config = { 1: 60, 2: 30, 3: 10 }
const payouts = calculatePayouts(1000, rankings, config)
// Result: user1: 600, user2: 150, user3: 150, user4: 100
```

### Pattern 6: Activity Score for Daily Scaling
**What:** Calculate user activity based on recent gameplay (games played, time active) to scale daily allowance.
**When to use:** Daily allowance claim to reward more active players.

**Example:**
```typescript
interface ActivityMetrics {
  gamesLast7Days: number
  activeMinutesLast7Days: number
  loginStreakDays: number
}

function calculateActivityMultiplier(metrics: ActivityMetrics): number {
  // Base multiplier: 1.0 (100%)
  let multiplier = 1.0

  // Games played: +0.05 per game, max +0.5 (10 games)
  multiplier += Math.min(metrics.gamesLast7Days * 0.05, 0.5)

  // Active time: +0.01 per 30min, max +0.3 (15 hours)
  multiplier += Math.min((metrics.activeMinutesLast7Days / 30) * 0.01, 0.3)

  // Login streak: +0.02 per day, max +0.2 (10 days)
  multiplier += Math.min(metrics.loginStreakDays * 0.02, 0.2)

  // Cap at 2.0x (200%)
  return Math.min(multiplier, 2.0)
}

async function claimDailyAllowance(userId: string) {
  const baseAmount = 100 // From system settings
  const metrics = await getUserActivityMetrics(userId)
  const multiplier = calculateActivityMultiplier(metrics)
  const finalAmount = Math.floor(baseAmount * multiplier)

  return await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: finalAmount },
        lastDailyClaim: new Date()
      }
    })

    await tx.transaction.create({
      data: {
        type: 'DAILY_CLAIM',
        userId,
        amount: finalAmount,
        description: `Tägliches Guthaben (${Math.round(multiplier * 100)}% Aktivität)`,
        metadata: { baseAmount, multiplier, metrics }
      }
    })
  })
}
```

### Anti-Patterns to Avoid
- **Long-running transactions:** Never hold a transaction open waiting for user input or external events. Use escrow state records instead.
- **Balance column without audit trail:** Always create transaction records, never just update balance silently.
- **Hardcoded economic values:** All amounts, limits, and ratios must come from database settings table.
- **Missing idempotency:** Daily claims, payouts must check for duplicate operations (e.g., already claimed today).
- **Race conditions on balance:** Always use transactions with Serializable isolation for read-modify-write patterns.
- **Unchecked balance decrements:** Always validate sufficient balance before decrement operations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animated number transitions | Custom CSS animations with manual state | react-countup or Framer Motion AnimateNumber | Handles decimal places, duration curves, interruption, formatting |
| Chart rendering & responsiveness | SVG manipulation with D3 directly | Recharts | Declarative React API, built-in responsiveness, tooltips, legends |
| Date formatting & grouping | Manual date arithmetic and formatting | date-fns or Intl API | Handles timezones, locales, edge cases (month boundaries, DST) |
| Currency formatting | String concatenation with separators | Intl.NumberFormat | Locale-aware thousands separators, decimal handling, currency symbols |
| Concurrent transaction safety | Manual locking with flags/semaphores | Prisma transactions with Serializable isolation | Database-level ACID guarantees, automatic rollback on conflicts |
| Real-time updates | Long polling or manual WebSocket state sync | Socket.IO rooms pattern | Built-in reconnection, buffering, user-specific targeting |
| Form validation | Manual error state management | Zod + react-hook-form | Type-safe schemas, error messages, async validation |
| Confirmation dialogs | Custom modal state management | Radix AlertDialog | Accessibility (focus trap, ESC key), proper ARIA semantics |

**Key insight:** Financial systems are deceptively complex due to concurrency, audit requirements, and edge cases (ties, forfeits, refunds). Leverage database transactions and battle-tested libraries rather than building custom logic.

## Common Pitfalls

### Pitfall 1: Race Conditions in Balance Updates
**What goes wrong:** Two concurrent requests read balance=100, both subtract 60, both write balance=40 instead of final balance=-20. User gets free money.
**Why it happens:** Read-modify-write pattern without transaction isolation allows dirty reads.
**How to avoid:** ALWAYS use Prisma interactive transactions with `isolationLevel: Serializable` for balance operations. Use atomic increment/decrement when possible.
**Warning signs:** Balance mismatches between transaction log sum and wallet balance, users reporting unexpected balance increases.

### Pitfall 2: Missing Transaction Records
**What goes wrong:** Balance updated but transaction not logged, or vice versa due to partial failure. Audit trail is incomplete.
**Why it happens:** Balance update and transaction creation not wrapped in same database transaction.
**How to avoid:** Single `prisma.$transaction` for both wallet update AND transaction record creation. Never separate these operations.
**Warning signs:** Wallet balance doesn't match sum of transactions, missing entries in transaction history.

### Pitfall 3: Escrow Leaks
**What goes wrong:** Bet deducted from balance but escrow never released or forfeited, money disappears from circulation.
**Why it happens:** Game ending logic doesn't handle all edge cases (server crash, room deleted, player banned mid-game).
**How to avoid:** Implement escrow cleanup job that auto-releases/forfeits escrows for rooms in 'ended' status. Add database constraints (foreign keys with ON DELETE CASCADE).
**Warning signs:** Total wallet balances + locked escrow < starting balances issued, escrow records stuck in LOCKED status for old rooms.

### Pitfall 4: Socket.IO Event Ordering
**What goes wrong:** Balance update event arrives before transaction record is committed to database, user queries wallet and sees old data.
**Why it happens:** Emitting Socket.IO event before database transaction completes.
**How to avoid:** ALWAYS emit Socket.IO events AFTER successful transaction commit, not inside transaction callback.
**Warning signs:** Users see balance flash to new value then revert, transaction appears in list after balance already updated.

### Pitfall 5: Insufficient Balance Validation
**What goes wrong:** User bets 1000 but has 800 balance, bet goes through with negative balance.
**Why it happens:** Missing or incomplete balance check before deduction.
**How to avoid:** Explicit balance validation INSIDE transaction before any decrement operation. Throw error to trigger rollback. Consider database CHECK constraint `balance >= 0`.
**Warning signs:** Negative wallet balances in database, users able to bet more than they have.

### Pitfall 6: Hardcoded Economic Parameters
**What goes wrong:** Starting balance, daily amount, bet limits hardcoded in code. Admin can't tune economy without deployment.
**Why it happens:** Taking shortcut during development, assuming "we'll make it configurable later."
**How to avoid:** Create `SystemSettings` table from day one with all economic parameters. Seed with defaults. All code reads from this table.
**Warning signs:** Admin requests to "just change the starting balance to 2000," requires code change and deployment.

### Pitfall 7: Percentage Calculation Rounding Errors
**What goes wrong:** Pot is 1000, payouts are 60%/30%/10% = 600+300+100 = 1000. But with 3-way tie for 1st: 600÷3 = 200.00. Repeated rounding can cause pot to distribute 999 or 1001.
**Why it happens:** Floating point arithmetic, inconsistent rounding direction (floor vs round vs ceil).
**How to avoid:** Use integer arithmetic (chips, not fractions). Always use `Math.floor()` consistently. Track remainder and give to highest position or split across all.
**Warning signs:** Pot total doesn't equal sum of payouts, users reporting "missing chip" or "extra chip."

### Pitfall 8: AFK Detection Edge Cases
**What goes wrong:** Player disconnects due to network issue, immediately reconnects, but already marked AFK and forfeited bet.
**Why it happens:** AFK logic doesn't account for brief disconnections vs. intentional abandonment.
**How to avoid:** Grace period timer (e.g., 30 seconds) before marking AFK. Warning message on first missed action. Only forfeit after multiple consecutive missed turns or explicit disconnect event.
**Warning signs:** Players complaining about losing bets due to "lag," high forfeit rate correlates with network issues.

### Pitfall 9: Unclaimed Daily Allowance Accumulation
**What goes wrong:** User doesn't claim daily allowance for a week, expects to claim 7 days worth at once.
**Why it happens:** Unclear specification whether allowance "accumulates" or "expires."
**How to avoid:** DECISION REQUIRED: Either (a) only allow claiming if 24hrs since last claim, or (b) track unclaimed days and allow batch claiming. Document clearly in UI.
**Warning signs:** User confusion, support requests asking "where's my allowance from yesterday?"

### Pitfall 10: Transaction Log Performance Degradation
**What goes wrong:** Transaction queries slow down as table grows to millions of rows.
**Why it happens:** Missing indexes, full table scans for filtering/grouping.
**How to avoid:** Composite indexes on `(userId, createdAt)` and `(type, createdAt)`. Consider partitioning by month for very large datasets. Use offset pagination or cursor-based pagination, not page number pagination.
**Warning signs:** Wallet page load time increases over time, database slow query logs showing full table scans on Transaction table.

## Code Examples

Verified patterns from official sources:

### Recharts Responsive Line Chart
```typescript
// Source: https://recharts.org/en-US/api/ResponsiveContainer
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface BalanceDataPoint {
  timestamp: string // ISO date
  balance: number
}

export function BalanceChart({ data }: { data: BalanceDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleString()}
          formatter={(value: number) => [`${value} Chips`, 'Balance']}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Animated Counter with React-CountUp
```typescript
// Source: https://www.npmjs.com/package/react-countup
import CountUp from 'react-countup'
import { useEffect, useState } from 'react'

interface AnimatedBalanceProps {
  balance: number
  change?: number // for flash color
}

export function AnimatedBalance({ balance, change }: AnimatedBalanceProps) {
  const [prevBalance, setPrevBalance] = useState(balance)

  useEffect(() => {
    if (balance !== prevBalance) {
      setPrevBalance(balance)
    }
  }, [balance])

  return (
    <div className="flex items-center gap-2">
      <CountUp
        start={prevBalance}
        end={balance}
        duration={0.8}
        separator=","
        preserveValue
        className={change && change !== 0 ? (change > 0 ? 'text-green-500' : 'text-red-500') : ''}
      />
      <span className="text-muted-foreground">Chips</span>
    </div>
  )
}
```

### Radix AlertDialog for Bet Confirmation
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/alert-dialog
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface BetConfirmationProps {
  open: boolean
  betAmount: number
  currentBalance: number
  onConfirm: () => void
  onCancel: () => void
}

export function BetConfirmation({ open, betAmount, currentBalance, onConfirm, onCancel }: BetConfirmationProps) {
  const percentage = Math.round((betAmount / currentBalance) * 100)

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hoher Einsatz</AlertDialogTitle>
          <AlertDialogDescription>
            Du setzt {betAmount} Chips ({percentage}% deines Guthabens).
            Bist du sicher, dass du fortfahren möchtest?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Bestätigen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Currency Formatting with Intl.NumberFormat
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export function formatCurrency(amount: number, currencyName: string = 'Chips'): string {
  return `${currencyFormatter.format(amount)} ${currencyName}`
}

// Usage
formatCurrency(1500) // "1.500 Chips" (German locale with thousands separator)
formatCurrency(1500, 'Kronen') // "1.500 Kronen" (admin-configured currency name)
```

### Prisma Index Definitions for Performance
```prisma
// Source: https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes
model Wallet {
  id            String   @id @default(cuid())
  userId        String   @unique
  balance       Int      @default(0)
  frozenAt      DateTime?
  lastDailyClaim DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([balance]) // For leaderboards (top earners)
}

model Transaction {
  id            String          @id @default(cuid())
  type          TransactionType
  amount        Int
  userId        String
  relatedUserId String?
  roomId        String?
  description   String
  metadata      Json?
  createdAt     DateTime        @default(now())

  user          User            @relation(fields: [userId], references: [id])
  relatedUser   User?           @relation("RelatedTransactions", fields: [relatedUserId], references: [id])

  @@index([userId, createdAt(sort: Desc)]) // Primary: user transaction history
  @@index([type, createdAt(sort: Desc)])   // Admin: filter by type
  @@index([roomId])                         // Room-specific audit
}

model BetEscrow {
  id         String       @id @default(cuid())
  roomId     String
  userId     String
  amount     Int
  status     EscrowStatus
  lockedAt   DateTime?
  releasedAt DateTime?
  createdAt  DateTime     @default(now())

  room       GameRoom     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user       User         @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@index([status, createdAt]) // Cleanup job: find stale escrows
}

model SystemSettings {
  id                   String   @id @default(cuid())
  currencyName         String   @default("Chips")
  startingBalance      Int      @default(1000)
  dailyAllowanceBase   Int      @default(100)
  weeklyBonusAmount    Int      @default(500)
  transferMaxAmount    Int      @default(1000)
  transferDailyLimit   Int      @default(5000)
  defaultPayoutRatios  Json     @default("[{\"position\":1,\"percentage\":60},{\"position\":2,\"percentage\":30},{\"position\":3,\"percentage\":10}]")
  afkGracePeriodSec    Int      @default(30)
  alertTransferLimit   Int      @default(2000)
  alertBalanceDropPct  Int      @default(50)
  updatedAt            DateTime @updatedAt
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Double-entry bookkeeping for all ledgers | Transaction log with single-entry per operation | 2020s for virtual currency | Simpler for non-regulated virtual currency while maintaining audit trail |
| Long-polling for balance updates | WebSocket (Socket.IO) with user-specific rooms | Mid-2010s | Real-time updates, lower server load, better UX |
| Optimistic concurrency (version fields) | Database transaction isolation levels (Serializable) | Always preferred for PostgreSQL | Automatic conflict detection, simpler application code |
| Server-side chart rendering | Client-side React charting (Recharts, Visx) | Late 2010s | Better interactivity, reduces server load, responsive without re-render |
| Hardcoded economic parameters | Database-driven configuration with admin UI | Standard practice 2020+ | Live tuning without deployment, A/B testing capability |

**Deprecated/outdated:**
- Manual balance column updates without audit trail: Modern fintech requires immutable transaction logs
- Chart.js for new React projects: Recharts or Visx preferred for better React integration (Chart.js still valid but less idiomatic)
- Local-only currency formatting: Intl.NumberFormat provides locale-aware formatting without external libraries

## Open Questions

1. **Daily allowance accumulation**
   - What we know: User can claim daily allowance manually from wallet page
   - What's unclear: If user doesn't claim for 3 days, can they claim 3x at once or only "today's" allowance?
   - Recommendation: Non-accumulating (only claim current day) for simplicity. Shows "Available to claim: 100 Chips (today)" with disabled state if already claimed. Prevents hoarding behavior.

2. **Escrow cleanup strategy**
   - What we know: Escrows in LOCKED state should eventually resolve to RELEASED or FORFEITED
   - What's unclear: What happens to escrows if room is manually deleted or server crashes mid-game?
   - Recommendation: Add database constraint `onDelete: Cascade` for room foreign key. Background job every hour releases escrows for rooms in 'ended' status older than 1 hour (safety buffer).

3. **Suspicious activity alert thresholds**
   - What we know: Admin can configure thresholds, alerts shown in dashboard
   - What's unclear: What specific patterns trigger alerts? (e.g., "X transfers in Y minutes", "balance drop of Z% in Y time")
   - Recommendation: Implement 3 alert types: (1) Single transfer exceeds absolute threshold, (2) Total transfers in 24hrs exceeds daily limit, (3) Balance drops by percentage in 1 hour. All configurable in SystemSettings.

4. **Balance freeze enforcement**
   - What we know: Admin can freeze wallet, user can play free rooms but not bet or transfer
   - What's unclear: Can frozen user receive transfers from others? Can frozen user claim daily allowance?
   - Recommendation: Frozen = no outbound operations (transfers, bets) but yes inbound (receive transfers, game wins, admin credits, daily claims). Clear status message in wallet UI: "Wallet frozen by admin - contact support."

5. **Weekly bonus timing**
   - What we know: Bigger reward every ~7 days
   - What's unclear: Starts from user registration date, or global weekly reset (e.g., every Sunday), or every 7th consecutive claim?
   - Recommendation: Personal 7-day cycle from registration date. Track `dailyClaimStreak` counter, every 7th claim gets weekly bonus instead of daily amount. Visible in UI: "Next weekly bonus in 3 claims."

6. **Payout distribution with odd numbers**
   - What we know: Tied players split prize evenly
   - What's unclear: Pot 1000, 3-way tie for 1st (60%) = 600÷3 = 200 each = 600 total. But pot 997, 3-way tie for 1st = 598.2÷3 = 199.4 each. How to handle remainder?
   - Recommendation: Use integer division with `Math.floor()`, remainder (if any) goes to position 1 winner(s) split evenly. Example: 997 pot, 60% = 598, 598÷3 = 199 each + 1 remainder → [200, 199, 199]. Always verify sum equals total pot.

## Sources

### Primary (HIGH confidence)
- Prisma Transactions Documentation - https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- Prisma Transaction Blog - https://www.prisma.io/blog/how-prisma-supports-transactions-x45s1d5l0ww1
- Socket.IO Rooms Documentation - https://socket.io/docs/v3/rooms/
- Socket.IO Private Messaging Pattern - https://socket.io/get-started/private-messaging-part-2/
- Radix AlertDialog Documentation - https://www.radix-ui.com/primitives/docs/components/alert-dialog
- Radix AlertDialog shadcn/ui - https://ui.shadcn.com/docs/components/radix/alert-dialog
- Intl.NumberFormat MDN - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- Prisma Indexes Documentation - https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes

### Secondary (MEDIUM confidence)
- LogRocket React Chart Libraries 2025 - https://blog.logrocket.com/best-react-chart-libraries-2025/
- Embeddable React Chart Libraries 2025 - https://embeddable.com/blog/react-chart-libraries
- Recharts GitHub - https://github.com/recharts/recharts
- react-countup npm - https://www.npmjs.com/package/react-countup
- Prisma Index Performance Blog - https://www.prisma.io/blog/improving-query-performance-using-indexes-2-MyoiJNMFTsfq
- PostgreSQL Foreign Key Indexes - https://backstage.payfit.com/of-postgresql-indexes-and-foreign-keys/
- Medium: Double-Entry Bookkeeping in Ledger Systems - https://medium.com/@altuntasfatih42/how-to-build-a-double-entry-ledger-f69edcea825d
- Prize Pool Distribution Guide - https://whatisesports.xyz/prize-pool-distribution/
- Medium: Concurrency Control in Prisma - https://medium.com/@mgoku0707/concurrency-control-in-node-js-and-prisma-managing-simult-aneous-updates-56b9f17859e5
- WebSocket Heartbeat Implementation 2026 - https://oneuptime.com/blog/post/2026-01-27-websocket-heartbeat/view
- PostgreSQL Audit Logging Medium 2025 - https://medium.com/@sehban.alam/lets-build-production-ready-audit-logs-in-postgresql-7125481713d8

### Tertiary (LOW confidence - requires validation)
- Activity Score and Streaks Gamification - https://docs.lynesapp.de/streaks (API docs for streak system reference)
- Gamification Streaks and Milestones - https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps
- Microsoft Alert Policies Reference - https://learn.microsoft.com/en-us/defender-xdr/alert-policies (enterprise pattern inspiration)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, already in use or standard React ecosystem
- Architecture patterns: HIGH - Patterns verified in Prisma and Socket.IO official documentation
- Transaction safety: HIGH - PostgreSQL + Prisma transaction isolation well-documented
- Escrow pattern: MEDIUM - Pattern is sound but requires careful testing for edge cases
- Activity scoring: MEDIUM - Algorithm is custom, needs tuning based on actual gameplay data
- Chart implementation: HIGH - Recharts officially documented, widely used
- Pitfalls: MEDIUM-HIGH - Based on common financial system issues and Prisma limitations

**Research date:** 2026-02-12
**Valid until:** 2026-04-12 (60 days - stable tech stack, PostgreSQL and Prisma patterns unlikely to change)

---

**Next Steps for Planner:**
1. Create database schema tasks (Wallet, Transaction, BetEscrow, SystemSettings models)
2. Implement core transaction safety layer (wallet actions with Prisma transactions)
3. Build escrow state machine for bet lifecycle
4. Add Socket.IO balance update events to existing server
5. Create wallet UI components (balance widget, transaction list, chart)
6. Implement betting flow integration into room creation/joining
7. Build admin finance dashboard and controls
8. Add configuration UI for system settings
9. Implement activity tracking and daily allowance logic
10. Create comprehensive tests for concurrent scenarios
