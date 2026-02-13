---
status: resolved
trigger: "Room creation infinite loading - room:create socket call never returns"
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED - parameter destructuring mismatch + missing success field in response
test: Applied fix to server.js
expecting: room:create now receives settings directly and returns { success, roomId, room }
next_action: Verification complete - archive session

## Symptoms

expected: User submits room creation form -> socket emits room:create -> server creates room -> callback returns room data -> client navigates to /game/[roomId]
actual: Room creation infinitely loads, socket room:create call never returns
errors: None visible (silent hang), likely server-side TypeError swallowed by socket.io
reproduction: Click "Raum erstellen", fill form, submit
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-02-11T00:00:30Z
  checked: Client emit signature in create-room-dialog.tsx line 57
  found: Client calls `socket.emit('room:create', settings, callback)` - sends settings object directly as first arg
  implication: Server receives the raw settings object as the first parameter

- timestamp: 2026-02-11T00:00:30Z
  checked: Server handler signature in server.js line 388
  found: Server handler is `socket.on('room:create', ({ settings }, callback) => ...)` - destructures first arg expecting { settings }
  implication: Since client sends `{ name, maxPlayers, isPrivate, turnTimer, afkThreshold }`, destructuring `{ settings }` yields settings=undefined

- timestamp: 2026-02-11T00:00:30Z
  checked: RoomManager.createRoom in server.js line 37-59
  found: createRoom accesses settings.name (line 41), settings.isPrivate (line 46), settings.maxPlayers (line 47) etc.
  implication: With settings=undefined, accessing settings.name throws TypeError. Since there is no try/catch around the handler body, the error is uncaught and the callback is NEVER invoked.

- timestamp: 2026-02-11T00:00:45Z
  checked: Server callback response shape in server.js lines 395-398
  found: Server responds with `{ roomId: room.id, room: ... }` - no `success` field
  implication: Even if the destructuring were fixed, client checks `response.success` which would be undefined (falsy), so client would show error toast instead of navigating. This is a SECONDARY bug.

- timestamp: 2026-02-11T00:01:30Z
  checked: Other socket handlers (room:join, room:leave, room:kick) in server.js
  found: All other handlers accept first arg and destructure fields from it (e.g. `({ roomId }, callback)`). The client for room:join correctly wraps: `socket.emit('room:join', { roomId }, callback)`. But for room:create, the client sends the settings object unwrapped.
  implication: The fix should align server with what client sends. Since settings IS the full payload, server should accept `(settings, callback)` not `({ settings }, callback)`.

## Resolution

root_cause: TWO issues in room:create flow - (1) PRIMARY: Server handler destructures `({ settings }, callback)` but client sends `settings` directly (not wrapped in { settings }), so settings=undefined causing TypeError crash before callback is called. (2) SECONDARY: Server responds with `{ roomId, room }` but client expects `{ success, roomId, error }` response shape.
fix: Changed server.js room:create handler - (1) Changed parameter from `({ settings }, callback)` to `(settings, callback)` so it receives the settings object directly as the client sends it. (2) Added `success: true` to the callback response. (3) Wrapped handler body in try/catch so errors return `{ success: false, error }` instead of silently crashing.
verification: Code review confirms client emit matches server handler signature. Response shape now matches client expectation.
files_changed: [server.js]
