---
status: diagnosed
trigger: "Chips senden button NOT showing on player cards in game room player list"
created: 2026-02-13T00:00:00Z
updated: 2026-02-13T00:00:00Z
---

## Current Focus

hypothesis: The "Chips senden" button exists in PlayerList but is invisible due to TWO independent issues: (1) WaitingRoom renders its own inline player list without PlayerList/TransferDialog, and (2) the game-ended screen renders an inline results card without PlayerList/TransferDialog. The PlayerList component with the transfer button is ONLY rendered inside GameBoard (playing phase), where showTransferButton is always false.
test: Confirmed by reading all rendering paths in page.tsx
expecting: Button never visible in any phase
next_action: Return diagnosis

## Symptoms

expected: "Chips senden" button visible on player cards during waiting and ended phases
actual: Button never appears in any game phase
errors: None (no runtime errors, purely a rendering/architecture issue)
reproduction: Join any game room, observe player list in waiting or ended state
started: Likely since initial implementation

## Eliminated

(none needed -- root cause found on first pass)

## Evidence

- timestamp: 2026-02-13
  checked: src/app/game/[roomId]/page.tsx rendering logic (lines 138-226)
  found: Three completely separate rendering paths based on room.status -- "ended" renders inline results card (line 138-203), "waiting" renders WaitingRoom component (line 206-213), "playing" renders GameBoard component (line 216-225). Each path is mutually exclusive.
  implication: PlayerList component is ONLY mounted inside GameBoard, which only renders during "playing" phase.

- timestamp: 2026-02-13
  checked: src/components/game/WaitingRoom.tsx player rendering (lines 156-195)
  found: WaitingRoom renders its OWN inline player list using a simple map over room.players with ready/kick UI. It does NOT use the PlayerList component at all. No TransferDialog or Send button exists here.
  implication: During "waiting" phase, the PlayerList component (which has the transfer button) is never mounted.

- timestamp: 2026-02-13
  checked: src/app/game/[roomId]/page.tsx "ended" rendering path (lines 138-203)
  found: Game-ended state renders a standalone Card with Trophy, scores, and a "Zurueck zur Lobby" button. It does NOT use PlayerList or GameBoard. No TransferDialog exists here.
  implication: During "ended" phase, the PlayerList component is never mounted either.

- timestamp: 2026-02-13
  checked: src/components/game/PlayerList.tsx transfer button logic (lines 26, 71-87)
  found: showTransferButton = gamePhase === 'waiting' || gamePhase === 'ended'. But PlayerList only lives inside GameBoard, which only renders when room.status === 'playing'. During playing, gameState.phase cycles through 'rolling' and 'scoring' -- never 'waiting' or 'ended' (game transitions to room.status='ended' before gameState.phase='ended' can be rendered via GameBoard).
  implication: The condition is logically correct but structurally unreachable. The button code exists but can NEVER be shown.

- timestamp: 2026-02-13
  checked: src/types/game.ts GamePhase type (line 7)
  found: GamePhase = 'waiting' | 'rolling' | 'scoring' | 'ended'. The GameBoard component is only rendered when room.status='playing', during which gameState.phase is 'rolling' or 'scoring'. When the game ends, page.tsx catches it via gameEnd state or room.status='ended' and renders the inline results -- GameBoard (and thus PlayerList) unmounts.
  implication: Confirms the structural impossibility. The PlayerList transfer button code is dead code.

## Resolution

root_cause: |
  The "Chips senden" button is structurally unreachable due to an architectural mismatch between
  where the button lives and when it should be visible:

  1. WAITING PHASE: page.tsx renders WaitingRoom component (not GameBoard). WaitingRoom has its
     own inline player list that does NOT include PlayerList or TransferDialog. The PlayerList
     component with the transfer button is never mounted.

  2. ENDED PHASE: page.tsx renders an inline game-over card (not GameBoard). Again, PlayerList
     is never mounted.

  3. PLAYING PHASE: page.tsx renders GameBoard, which includes PlayerList. But PlayerList's
     showTransferButton condition requires gamePhase === 'waiting' || gamePhase === 'ended',
     which never occurs during the playing phase (gameState.phase is 'rolling' or 'scoring').

  Result: The transfer button code exists in PlayerList but can never be displayed in ANY phase.

fix: (not applied -- diagnosis only)
verification: (not applied)
files_changed: []
