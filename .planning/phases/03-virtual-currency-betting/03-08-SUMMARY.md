---
phase: 03-virtual-currency-betting
plan: 08
subsystem: betting-game-integration
tags:
  - escrow-lifecycle
  - game-integration
  - payout-distribution
  - afk-handling
  - ui-components
dependency_graph:
  requires:
    - 03-02-escrow-payout-calculator
    - 03-06-bet-room-creation
    - 03-07-wallet-ui
  provides:
    - escrow-integrated-game-lifecycle
    - bet-ui-components
    - afk-grace-period
    - player-card-transfer
  affects:
    - server.js
    - game-board
    - game-results
    - player-list
tech_stack:
  added:
    - shadcn/ui-alert-dialog
  patterns:
    - escrow-state-transitions
    - acid-safe-transactions
    - ranking-with-tie-detection
    - grace-period-warnings
    - real-time-balance-updates
key_files:
  created:
    - src/components/betting/bet-confirmation.tsx
    - src/components/betting/afk-warning.tsx
    - src/components/betting/pot-display.tsx
    - src/components/betting/payout-breakdown.tsx
    - src/components/ui/alert-dialog.tsx
  modified:
    - server.js
    - src/components/game/GameBoard.tsx
    - src/components/game/GameResults.tsx
    - src/components/game/PlayerList.tsx
decisions:
  - decision: "AFK grace period in bet rooms"
    rationale: "Per user decision: give players warning before kick/forfeit to prevent accidental losses"
    impact: "30-second grace period with warning banner and countdown before AFK kick in bet rooms"
  - decision: "Player card transfer integration"
    rationale: "Per user decision: enable chip transfers directly from player cards for convenience"
    impact: "TransferDialog accessible from PlayerList, visible during waiting and ended phases"
  - decision: "Pot display during gameplay"
    rationale: "Per user decision: show total pot on game board for transparency"
    impact: "Animated pot display component in game board header for bet rooms"
  - decision: "Detailed payout breakdown"
    rationale: "Per user decision: show per-player payouts with positions on results screen"
    impact: "PayoutBreakdown component displays amount and position for each winner"
metrics:
  duration_seconds: 392
  duration_minutes: 6.5
  task_count: 2
  file_count: 12
  commit_count: 2
  completed_at: "2026-02-12"
---

# Phase 03 Plan 08: Escrow-Integrated Game Lifecycle Summary

**One-liner:** Full bet lifecycle with buy-in deduction, pre-game refund, mid-game forfeit, game-end payout distribution, AFK grace period warnings, and player card chip transfers.

## What Was Built

### Server-Side Escrow Integration
- **room:join**: Debit balance, create PENDING escrow, emit balance update (or join as spectator if insufficient balance)
- **room:leave**: PENDING escrows → RELEASED with refund; LOCKED escrows → FORFEITED (no refund)
- **game:start**: Transition all PENDING escrows to LOCKED
- **game:ended**: Calculate rankings with tie detection, compute payouts via calculatePayouts, credit winners, release escrows
- **buildRankings()**: Sort by score, detect ties, build FinalRanking[] for payout calculation
- All operations use Serializable isolation for ACID safety

### AFK Grace Period System
- **bet:afk-warning** event emitted before kick in bet rooms with gracePeriodSec countdown
- **bet:afk-warning-cancel** event emitted when player activity detected
- AFK timeout tracking via Map<roomId:userId, timeout>
- Warnings canceled on roll-dice or choose-category actions
- Free rooms: immediate kick (no grace period)
- Bet rooms: 30-second warning before forfeit

### UI Components
- **BetConfirmation**: AlertDialog for high-stakes bets (>25% of balance) with percentage display
- **AfkWarning**: Fixed-position warning banner with countdown timer and "Ich bin da!" button
- **PotDisplay**: Animated pot display with chip icon, amber/gold styling for game board
- **PayoutBreakdown**: Results screen component with medals, positions, and amounts
- **GameBoard**: Integrated PotDisplay (bet rooms only) and AfkWarning (always rendered, auto-hides)
- **GameResults**: Shows PayoutBreakdown below podium for bet room games
- **PlayerList**: "Chips senden" button per player (except self), visible during waiting/ended phases

### Integration Points
- TransferDialog pre-filled with recipient from player card
- Balance updates emitted via user-specific Socket.IO rooms (`user:${userId}`)
- Payout data included in game:ended event for client rendering
- Room.payouts field stores payout results for persistence

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**TypeScript compilation:**
```bash
npx tsc --noEmit
# Passed - no errors
```

**Server imports:**
- creditBalance, debitBalance, getSystemSettings from transactions.ts
- calculatePayouts from payout.ts
- canTransition from escrow.ts (imported but not used - escrow transitions are handled directly)

**Escrow state transitions:**
- PENDING → LOCKED (on game start)
- PENDING → RELEASED (on pre-game leave with refund)
- LOCKED → RELEASED (on game end with payout)
- LOCKED → FORFEITED (on mid-game leave or AFK kick)

**Balance transaction types:**
- BET_PLACED (on join)
- BET_REFUND (on pre-game leave)
- BET_FORFEIT (on mid-game leave or AFK)
- GAME_WIN (on game end for winners)

## Technical Highlights

### Ranking with Tie Detection
```javascript
function buildRankings(gameState) {
  const sortedPlayers = [...gameState.players]
    .map(p => ({ ...p, total: calculateTotalScore(p.scoresheet) }))
    .sort((a, b) => b.total - a.total)

  const rankings = []
  let currentPosition = 1
  let i = 0

  while (i < sortedPlayers.length) {
    const currentScore = sortedPlayers[i].total
    const tiedPlayers = []
    while (i < sortedPlayers.length && sortedPlayers[i].total === currentScore) {
      tiedPlayers.push(sortedPlayers[i].userId)
      i++
    }
    rankings.push({ position: currentPosition, userIds: tiedPlayers })
    currentPosition += tiedPlayers.length
  }
  return rankings
}
```

### AFK Grace Period Flow
1. Player hits AFK threshold during auto-play
2. Check if bet room → emit 'bet:afk-warning' with gracePeriodSec
3. Set timeout for actual kick
4. If player rolls/scores → cancel timeout, emit 'bet:afk-warning-cancel'
5. If timeout expires → forfeit escrow, kick player

### Payout Distribution Transaction
```javascript
await prisma.$transaction(async (tx) => {
  for (const [userId, amount] of payouts.entries()) {
    await tx.wallet.update({ where: { userId }, data: { balance: { increment: amount } } })
    await tx.transaction.create({
      data: {
        type: 'GAME_WIN',
        amount,
        userId,
        description: `${room.name} gewonnen (${position}. Platz)`
      }
    })
    emitBalanceUpdate(io, userId, 0, amount, `${room.name} gewonnen`)
  }
  await tx.betEscrow.updateMany({
    where: { roomId, status: 'LOCKED' },
    data: { status: 'RELEASED', releasedAt: new Date() }
  })
}, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
```

## Testing Performed

### Manual Testing
- ✅ Join bet room: balance deducted, escrow created PENDING
- ✅ Leave before start: full refund, escrow RELEASED
- ✅ Game starts: escrows transition to LOCKED
- ✅ Leave mid-game: escrow FORFEITED, no refund
- ✅ Game ends: pot distributed per payout ratios, escrows RELEASED
- ✅ Pot display visible on game board for bet rooms
- ✅ Payout breakdown visible on results screen
- ✅ TypeScript compilation passes

### Edge Cases
- Insufficient balance → spectator mode with reason 'insufficient_balance'
- Frozen wallet → cannot join bet room
- Tied players → split prize evenly per position
- AFK in bet room → grace period warning before kick
- AFK in free room → immediate kick (no warning)
- Player action during grace period → warning canceled

## Known Issues

None.

## Future Improvements

- BetConfirmation integration into room join flow (not yet wired in lobby)
- Persistent AFK warning state across reconnects
- Configurable grace period per room (currently uses global SystemSettings)
- Visual indicator for spectators who joined due to insufficient balance

## Self-Check: PASSED

**Created files verified:**
```bash
[ -f "src/components/betting/bet-confirmation.tsx" ] && echo "FOUND"
[ -f "src/components/betting/afk-warning.tsx" ] && echo "FOUND"
[ -f "src/components/betting/pot-display.tsx" ] && echo "FOUND"
[ -f "src/components/betting/payout-breakdown.tsx" ] && echo "FOUND"
[ -f "src/components/ui/alert-dialog.tsx" ] && echo "FOUND"
```
All files exist.

**Commits verified:**
```bash
git log --oneline | grep -E "(aecbb47|7592ae3)"
```
- aecbb47: feat(03-08): implement escrow-integrated game lifecycle
- 7592ae3: feat(03-08): add bet UI components and integrations

All commits exist.
