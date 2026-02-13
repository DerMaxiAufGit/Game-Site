---
status: diagnosed
trigger: "turn timer expiry does nothing - no auto-play, no AFK warning, no kick"
created: 2026-02-13T00:00:00Z
updated: 2026-02-13T00:00:00Z
---

## Current Focus

hypothesis: autoPlay crashes on ReferenceError because sendSystemMessage is out of scope
test: confirmed via static analysis of server.js scoping
expecting: sendSystemMessage defined in .then() closure (L573) is invisible to module-scope autoPlay (L280)
next_action: return diagnosis

## Symptoms

expected: When a player's turn timer expires, server should auto-play (roll + pick best category), broadcast state update, and after afkThreshold consecutive timeouts, warn/kick the player
actual: Timer expires silently. No auto-play, no AFK warning, no kick. Game freezes on current player's turn.
errors: ReferenceError: sendSystemMessage is not defined (thrown at server.js:314, uncaught in setTimeout callback)
reproduction: Start game, let turn timer expire without making any move
started: Since initial implementation

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-13
  checked: server.js line 280 - autoPlay defined at module scope
  found: autoPlay() is declared OUTSIDE the app.prepare().then() closure (which starts at L521)
  implication: autoPlay cannot access anything defined inside that closure

- timestamp: 2026-02-13
  checked: server.js line 573 - sendSystemMessage defined inside .then() closure
  found: sendSystemMessage is a function declaration inside the app.prepare().then() callback, scoped to that callback
  implication: autoPlay at module scope cannot reference sendSystemMessage - different scope chain

- timestamp: 2026-02-13
  checked: server.js line 314 - autoPlay calls sendSystemMessage
  found: autoPlay calls sendSystemMessage(roomId, io, ...) which does not exist in its scope
  implication: ReferenceError thrown synchronously, crashing the entire autoPlay function

- timestamp: 2026-02-13
  checked: server.js line 447 - kickPlayerAFK calls sendSystemMessage
  found: kickPlayerAFK is also at module scope (L446) and calls sendSystemMessage(L447)
  implication: Even if autoPlay somehow worked, kickPlayerAFK would also crash

- timestamp: 2026-02-13
  checked: server.js line 593 - emitBalanceUpdate also inside .then() closure
  found: emitBalanceUpdate defined at L593, also only inside the closure
  implication: Any module-scope code referencing emitBalanceUpdate would also fail

- timestamp: 2026-02-13
  checked: server.js socket handler for bet:afk-acknowledge
  found: NO handler exists for this event anywhere in server.js
  implication: The "Ich bin da!" button (afk-warning.tsx L73) emits bet:afk-acknowledge but server ignores it

- timestamp: 2026-02-13
  checked: autoPlay mutation before crash (L310-311)
  found: room.gameState = result and consecutiveInactive += 1 execute BEFORE the crash at L314
  implication: Game state is silently mutated but never broadcast - stale state on all clients

## Resolution

root_cause: |
  SCOPING BUG: `autoPlay()` (line 280) and `kickPlayerAFK()` (line 446) are defined at
  MODULE SCOPE in server.js, but they call `sendSystemMessage()` which is defined INSIDE the
  `app.prepare().then(() => {...})` closure (line 573). JavaScript scope rules mean inner-closure
  functions are invisible to outer-scope functions. When the turn timer fires and `autoPlay` runs,
  it crashes with `ReferenceError: sendSystemMessage is not defined` at line 314.

  Secondary issue: The `bet:afk-acknowledge` socket event (emitted by the "Ich bin da!" button)
  has no server-side handler, so the AFK grace period acknowledgment button would do nothing
  even if the AFK warning system could be reached.

fix: (not applied - diagnosis only)
verification: (not applied)
files_changed: []
