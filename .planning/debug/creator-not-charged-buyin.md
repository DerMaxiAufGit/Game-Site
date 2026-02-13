---
status: diagnosed
trigger: "Investigate why room creator is NOT charged a buy-in when creating a bet room, while joining players ARE charged. Also investigate duplicate transaction entries for joiners."
created: 2026-02-13T00:00:00Z
updated: 2026-02-13T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two bugs found: (1) room:create never charges escrow, (2) game room page auto-joins causing double escrow
test: Code trace complete
expecting: N/A
next_action: Report diagnosis

## Symptoms

expected: Creator should be charged buy-in on room creation. Joiners should see a single "Einsatz: Table" transaction.
actual: Creator is never charged. Joiners see both "Einsatz: Table" and "Einsatz verfallen: Table" (though total balance correct).
errors: No runtime errors - logic bugs only.
reproduction: Create a bet room as host -> no balance deduction. Join a bet room -> see two transaction entries.
started: Since bet room feature was implemented.

## Eliminated

(none - root causes found on first investigation)

## Evidence

- timestamp: 2026-02-13T00:01:00Z
  checked: server.js room:create handler (lines 675-720)
  found: The handler calls roomManager.createRoom() then returns success. There is NO escrow/debit logic. It does NOT debit the creator's wallet, does NOT create a BetEscrow record, and does NOT create a BET_PLACED transaction.
  implication: BUG 1 CONFIRMED - Creator never pays buy-in.

- timestamp: 2026-02-13T00:02:00Z
  checked: server.js room:join handler (lines 723-830)
  found: For bet rooms, the handler debits wallet, creates BET_PLACED transaction, and creates BetEscrow with status PENDING. This works correctly for joining players.
  implication: Joiners ARE correctly charged. The asymmetry between create and join is the root cause of bug 1.

- timestamp: 2026-02-13T00:03:00Z
  checked: game room page (src/app/game/[roomId]/page.tsx lines 36-41)
  found: useEffect fires `socket.emit('room:join', { roomId })` on mount WITHOUT a callback. This happens for ALL users entering the page, including the creator who was already added to the room during room:create.
  implication: The CREATOR navigates to /game/{roomId} after creation, which triggers room:join. Since creator is already in the room (added by roomManager.createRoom), the server returns early at line 731-734 (rejoined: true) - so no double charge for creator.

- timestamp: 2026-02-13T00:04:00Z
  checked: game room page cleanup (line 88)
  found: On unmount, the page emits `socket.emit('room:leave', { roomId })`. If the user navigates away and comes back, or if React strict mode causes a remount, the sequence would be: join -> leave -> join. The leave handler at line 840-916 finds the PENDING escrow and REFUNDS it. But the leave also removes the user from the room. Then on re-join, the user is charged AGAIN.
  implication: This is the mechanism for potential duplicate transactions, but it alone doesn't explain the specific "Einsatz verfallen" entry.

- timestamp: 2026-02-13T00:05:00Z
  checked: room:leave handler escrow logic (lines 840-916) and disconnect handler (lines 1388-1396)
  found: The disconnect handler calls roomManager.removeUserFromAllRooms() which does NOT handle escrow at all - it just removes from in-memory room. So if a socket disconnects and reconnects, the player is removed from the room WITHOUT escrow refund. Then when they reconnect and the page re-mounts, room:join fires again, creating a SECOND escrow + BET_PLACED transaction. Meanwhile the original escrow is orphaned.
  implication: Socket reconnection can cause duplicate escrow/transactions.

- timestamp: 2026-02-13T00:06:00Z
  checked: game:start handler escrow lock (lines 1298-1314)
  found: When game starts, ALL PENDING escrows for the room are locked via updateMany. If a user has multiple PENDING escrows (from disconnect/reconnect), ALL get locked. At game end, all LOCKED escrows are released/paid out. This explains why "total balance is calculated correctly" - the extra escrow gets included in the pot and distributed.
  implication: Multiple escrows per user inflate the pot but payouts compensate, making the final balance appear correct.

- timestamp: 2026-02-13T00:07:00Z
  checked: Specific user report about "Einsatz verfallen: Table"
  found: The BET_FORFEIT transaction with description "Einsatz verfallen: {room.name}" is created in two places: (1) AFK kick (line 472), (2) room:leave while game is in progress (line 903, escrow status LOCKED). If a joiner's socket disconnects during a game, the disconnect handler removes them from the room, but does NOT forfeit their escrow. However if they explicitly leave (room:leave) during a game, their LOCKED escrow is forfeited. The "Einsatz verfallen" entry the user sees alongside "Einsatz" could also come from a game that ended with their escrow being processed, or from the leave/disconnect cycle.
  implication: The duplicate entries are: (1) BET_PLACED "Einsatz: Table" from join, and (2) BET_FORFEIT "Einsatz verfallen: Table" from leaving/disconnect during or after game.

## Resolution

root_cause: |
  TWO DISTINCT BUGS:

  BUG 1 - Creator not charged buy-in:
  The `room:create` handler (server.js line 675) creates the room and adds the host as a player,
  but NEVER deducts the bet amount from the creator's wallet, NEVER creates a BetEscrow record,
  and NEVER creates a BET_PLACED transaction. The escrow logic only exists in the `room:join`
  handler (line 738). The creator skips room:join's escrow path because when the game page
  auto-fires room:join, the server detects them as already in the room (line 731) and returns
  early with `rejoined: true`.

  BUG 2 - Duplicate transaction entries for joiners:
  The game room page (src/app/game/[roomId]/page.tsx) emits `room:leave` on unmount and
  `room:join` on mount. Socket disconnection via the `disconnect` handler removes the user
  from the room WITHOUT handling escrow (no refund, no forfeit). When the socket reconnects
  and the page re-mounts, `room:join` fires again, creating a second BET_PLACED + BetEscrow.
  Additionally, the `room:leave` handler forfeits LOCKED escrows, creating BET_FORFEIT
  transactions ("Einsatz verfallen"). The combination produces duplicate-looking entries:
  "Einsatz: Table" (from join) and "Einsatz verfallen: Table" (from leave/forfeit).

fix: (not applied - diagnosis only)
verification: (not applied - diagnosis only)
files_changed: []
