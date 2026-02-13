---
phase: 03-virtual-currency-betting
plan: 13
subsystem: game-server
tags: [socket.io, escrow, bug-fix, timer, scoping]
dependencies:
  requires:
    - 03-02-SUMMARY.md  # BetEscrow model and lifecycle states
    - 03-06-SUMMARY.md  # Bet room creation and settings
    - 03-08-SUMMARY.md  # AFK detection and turn timers
  provides:
    - "Room creator charged buy-in with BetEscrow on creation"
    - "Idempotent escrow creation prevents duplicate charges"
    - "Disconnect handler properly refunds/forfeits escrow"
    - "Turn timer scoping fixed - no ReferenceError crashes"
    - "bet:afk-acknowledge handler cancels warnings"
  affects:
    - 03-10-PLAN.md  # UAT verification will validate these fixes
tech:
  tech-stack:
    added: []
    patterns:
      - "Idempotency check pattern for financial operations"
      - "Module scope function hoisting for async callback access"
      - "Try/catch error boundaries in setTimeout callbacks"
  key-files:
    created: []
    modified:
      - server.js  # All three bug fixes
decisions:
  - id: D-03-13-01
    what: Move helper functions to module scope
    why: autoPlay/kickPlayerAFK (module scope) need access to sendSystemMessage/emitBalanceUpdate
    impact: Functions now accessible from both module-level timers and socket handlers
  - id: D-03-13-02
    what: Idempotency via existingEscrow check
    why: Rejoining players were getting charged duplicate buy-ins
    impact: Safe reconnection without financial impact
  - id: D-03-13-03
    what: Escrow cleanup in disconnect handler
    why: Orphaned escrow records when players disconnect
    impact: Proper refund (PENDING) or forfeit (LOCKED) based on game status
metrics:
  duration: 243s (4.05min)
  completed: 2026-02-13
---

# Phase 3 Plan 13: Server Escrow & Timer Bug Fixes Summary

**One-liner:** Fixed three critical server bugs: room creator escrow, duplicate join charges, and turn timer scoping crashes.

## What Was Built

### Task 1: Room Creator Escrow (Commit 9d4082a)
- Added `removeRoom()` method to RoomManager for cleanup on failed escrow
- Room creator now charged buy-in with BetEscrow PENDING record on room creation
- Wallet frozen status and balance validation before room creation
- Clean up room via removeRoom if wallet checks fail
- Uses correct 4-field schema (roomId, userId, amount, status) without oddsId

**Files modified:** server.js

### Task 2: Idempotent Join & Disconnect Cleanup (Commit ff42a52)
- Added idempotency check to room:join escrow using `existingEscrow` lookup
- Check for PENDING/LOCKED escrow before creating new one prevents duplicate charges
- Fixed disconnect handler to cleanup escrow based on status:
  - PENDING escrow refunded on disconnect (pre-game)
  - LOCKED escrow forfeited on disconnect (mid-game)
- Emit system messages and player-left events before removing from rooms

**Files modified:** server.js

### Task 3: Turn Timer Scoping & AFK Acknowledge (Commit aeec7ee)
- Moved `sendSystemMessage` and `emitBalanceUpdate` to module scope (before startTurnTimer)
- Removed duplicate function definitions inside app.prepare().then() closure
- Added try/catch error handling to turn timer auto-play setTimeout
- Added `bet:afk-acknowledge` socket handler:
  - Cancels AFK warning timeout
  - Resets player's consecutiveInactive counter
  - Emits afk-warning-cancel to client
  - Sends system message "[player] ist wieder da"

**Files modified:** server.js

## Deviations from Plan

None - plan executed exactly as written.

## Tests & Verification

### Code Markers Verification
✓ ESCROW_CREATE_ROOM_CREATE marker present (1 match)
✓ ESCROW_IDEMPOTENT_JOIN marker present (1 match)
✓ ESCROW_DISCONNECT_CLEANUP marker present (1 match)
✓ AFK_ACKNOWLEDGE_HANDLER marker present (1 match)

### Schema Compliance
✓ No `oddsId` references in server.js (0 matches)
✓ BetEscrow uses correct fields: roomId, userId, amount, status

### Function Scoping
✓ `function sendSystemMessage` appears exactly once (module scope)
✓ `function emitBalanceUpdate` appears exactly once (module scope)

## Decisions Made

### D-03-13-01: Module Scope Function Hoisting
**Context:** autoPlay() and kickPlayerAFK() are defined at module scope (before app.prepare().then()) but need to call sendSystemMessage() and emitBalanceUpdate() which were inside the app.prepare() closure.

**Decision:** Move both helper functions to module scope (right before startTurnTimer around line 250).

**Rationale:**
- Functions only need roomManager (module scope) and io (passed as parameter)
- randomUUID is already imported at top
- No signature changes needed - all call sites already pass io

**Alternatives considered:**
1. Pass functions as parameters to autoPlay/kickPlayerAFK - too many parameter changes
2. Restructure timer functions inside closure - would require moving RoomManager

**Impact:** Turn timers now work without ReferenceError crashes.

### D-03-13-02: Idempotency Check Pattern
**Context:** Rejoining players were getting charged duplicate buy-ins because room:join handler always created new escrow.

**Decision:** Check for existing PENDING/LOCKED escrow before debit/create transaction.

**Pattern:**
```javascript
const existingEscrow = await prisma.betEscrow.findFirst({
  where: { roomId, userId, status: { in: ['PENDING', 'LOCKED'] } }
})
if (!existingEscrow) {
  // Only then: debit + create escrow
}
```

**Impact:** Safe reconnection - rejoining players skip escrow creation if already charged.

### D-03-13-03: Disconnect Escrow Cleanup
**Context:** Disconnect handler called removeUserFromAllRooms() but didn't handle escrow, leaving orphaned records.

**Decision:** Mirror room:leave escrow logic in disconnect handler:
- Get user's rooms before removing them
- For bet rooms: find escrow, refund if PENDING, forfeit if LOCKED
- Send system messages and player-left events
- Then remove from all rooms and update lobby

**Impact:** Proper cleanup on disconnect - no orphaned escrow, correct refund/forfeit based on game state.

## Edge Cases Handled

1. **Room creation failure after escrow:** removeRoom() cleans up room state before returning error
2. **Rejoin with existing escrow:** Idempotency check skips duplicate charge
3. **Disconnect pre-game vs mid-game:** PENDING refunded, LOCKED forfeited
4. **Turn timer crashes:** try/catch prevents silent failures, logs errors
5. **AFK acknowledge when no warning:** Handler safely checks existingWarning before clearing

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Dependencies for 03-10 (UAT):**
- These fixes resolve UAT round 2 issues #2, #3, #4, #5
- UAT can now verify:
  - Room creator is charged buy-in
  - Rejoining doesn't duplicate charges
  - Turn timer doesn't crash
  - AFK warnings can be acknowledged
  - Disconnect properly handles escrow

## Performance Notes

- Execution time: 243 seconds (4.05 minutes)
- 3 tasks executed, 3 commits created
- Single file modified (server.js)
- All verification checks passed

## Bug Fixes Summary

| Bug # | Issue | Root Cause | Fix |
|-------|-------|------------|-----|
| UAT-2 | Room creator not charged | Missing escrow in room:create | Added ESCROW_CREATE_ROOM_CREATE block |
| UAT-3 | Duplicate charges on rejoin | No idempotency check | Added existingEscrow lookup |
| UAT-4 | Turn timer ReferenceError | Functions in wrong scope | Moved to module scope |
| UAT-5 | AFK kick silent errors | Same scoping issue | Fixed by scope move |
| UAT-5b | bet:afk-acknowledge not handled | Missing socket handler | Added AFK_ACKNOWLEDGE_HANDLER |
| Disconnect orphaned escrow | No escrow cleanup | Added ESCROW_DISCONNECT_CLEANUP |

---

**Status:** ✅ Complete - All server-side escrow and timer bugs fixed
**Next:** Execute 03-14 (client-side gap closure) then 03-10 (UAT round 3)
