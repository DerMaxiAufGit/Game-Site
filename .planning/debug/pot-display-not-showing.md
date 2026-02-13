---
status: diagnosed
trigger: "Investigate why the pot display is NOT showing during bet room gameplay in Kniffel"
created: 2026-02-13T00:00:00Z
updated: 2026-02-13T00:00:00Z
---

## Current Focus

hypothesis: isBetRoom and betAmount props are never passed to GameBoard from the game room page
test: Read the GameBoard render call in page.tsx
expecting: Missing props confirmed
next_action: Return diagnosis

## Symptoms

expected: PotDisplay component shows animated pot amount during bet room games
actual: PotDisplay never renders during gameplay
errors: None (silent failure - conditional rendering evaluates to false)
reproduction: Join or create a bet room, start a game, observe top bar - no pot display
started: Since GameBoard was wired into the game room page

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-13T00:01:00Z
  checked: src/components/betting/pot-display.tsx
  found: PotDisplay component exists, accepts totalPot and currencyName props, renders correctly
  implication: Component itself is fine

- timestamp: 2026-02-13T00:02:00Z
  checked: src/components/game/GameBoard.tsx lines 27-28, 44, 155-159
  found: GameBoard accepts isBetRoom (default false) and betAmount (default 0) as optional props. Calculates totalPot = isBetRoom ? betAmount * activePlayerCount : 0. Renders PotDisplay only when isBetRoom && totalPot > 0.
  implication: GameBoard is correctly wired internally, but depends on receiving props from parent

- timestamp: 2026-02-13T00:03:00Z
  checked: src/app/game/[roomId]/page.tsx lines 216-225
  found: |
    GameBoard is rendered as:
      <GameBoard
        gameState={room.gameState}
        roomId={roomId}
        currentUserId={userId || ''}
        hostId={room.hostId}
        socket={socket}
      />
    MISSING: isBetRoom and betAmount are NOT passed.
  implication: ROOT CAUSE. isBetRoom defaults to false, betAmount defaults to 0, so totalPot is always 0, and the PotDisplay conditional {isBetRoom && totalPot > 0} is always false.

- timestamp: 2026-02-13T00:04:00Z
  checked: src/app/game/[roomId]/page.tsx lines 14-18, 32
  found: RoomData extends RoomInfo which includes isBetRoom and betAmount fields. The room state variable has these fields available from the server.
  implication: The data IS available in the parent component - it just is not passed down.

- timestamp: 2026-02-13T00:05:00Z
  checked: server.js lines 1317, 828, 65-86
  found: Server emits room:update with the full room object which includes isBetRoom and betAmount. The room object stores these from creation time.
  implication: Server-side data flow is correct. The data arrives at the client page component.

## Resolution

root_cause: In src/app/game/[roomId]/page.tsx lines 218-224, the GameBoard component is rendered without passing the isBetRoom and betAmount props. These props have defaults of false and 0 respectively in GameBoard, so the pot calculation always yields 0 and the PotDisplay conditional never renders. The room object (RoomData extending RoomInfo) already contains both isBetRoom and betAmount from the server, but they are simply not forwarded to GameBoard.
fix: Pass room.isBetRoom and room.betAmount to GameBoard
verification: (pending)
files_changed: []
