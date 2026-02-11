---
phase: 02-core-game-engine
plan: 10
subsystem: game-logic
tags: [socket.io, kniffel, turn-timer, afk-detection, rematch, react, game-rules]

# Dependency graph
requires:
  - phase: 02-02
    provides: autoPickCategory, calculateScore, calculateTotalScore from kniffel-rules.ts
  - phase: 02-03
    provides: applyAction, createInitialState from state-machine.ts
  - phase: 02-01
    provides: rollDice from crypto-rng.ts
  - phase: 02-04
    provides: Room manager and Socket.IO infrastructure

provides:
  - Turn timer management with auto-play on timeout
  - AFK detection and kick after consecutive inactive threshold
  - Rematch voting system with majority acceptance
  - GameResults component with winner display and rankings
  - RematchVote component with progress tracking
  - Complete game handlers (player-ready, roll-dice, choose-category, game-start)

affects: [02-11-verification, future-game-flow, future-ui-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Turn timer with automatic timeout → auto-play"
    - "Auto-play uses imported autoPickCategory (no inline scoring logic)"
    - "AFK detection tracks consecutiveInactive counter"
    - "Rematch voting with majority threshold calculation"
    - "Server-side game handlers integrate state machine + scoring modules"

key-files:
  created:
    - src/components/game/GameResults.tsx
    - src/components/game/RematchVote.tsx
  modified:
    - server.js

key-decisions:
  - "Auto-play uses imported autoPickCategory from kniffel-rules.ts (no duplication)"
  - "Turn timer auto-rolls dice if player hasn't rolled (rollsRemaining === 3)"
  - "AFK kick removes player and adjusts game state (winner if <2 players remain)"
  - "Rematch voting creates fresh waiting room on acceptance"
  - "GameResults shows podium styling (gold/silver/bronze) for top 3"
  - "RematchVote auto-navigates to lobby on decline"

patterns-established:
  - "Timer management: startTurnTimer, resetTurnTimer, clearTurnTimer"
  - "Auto-play flow: timeout → check rolled → auto-roll if needed → autoPickCategory → apply via state machine → check AFK → check game end"
  - "Game handlers validate state, apply action via applyAction, broadcast update"
  - "Rematch flow: game:ended → rematchVotes initialized → voting → majority → rematch-accepted/declined"
  - "Socket event consistency: emit with callback for error handling"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 02 Plan 10: Timers and Rematch Summary

**Turn timer with auto-play using imported autoPickCategory, AFK kick system, and rematch voting with GameResults/RematchVote components**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T20:54:59Z
- **Completed:** 2026-02-11T20:58:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Turn timer management with automatic timeout triggering auto-play
- Auto-play logic uses imported autoPickCategory (zero inline scoring duplication)
- AFK detection tracks consecutiveInactive, kicks after threshold, handles game end if <2 players
- Rematch voting system with majority threshold and acceptance/decline flow
- GameResults component with winner trophy, podium rankings, detailed scoresheet breakdown
- RematchVote component with voting buttons, progress indicator, voter list
- Complete game handlers: player-ready, roll-dice, choose-category, game-start, rematch-vote

## Task Commits

Each task was committed atomically:

1. **Task 1: Add turn timer, auto-play, AFK detection, and rematch to server.js** - `7cf1992` (feat)
   - Turn timer functions (start/reset/clear)
   - Auto-play on timeout using autoPickCategory from kniffel-rules.js
   - AFK kick logic with consecutive inactive tracking
   - Rematch voting handler with majority logic
   - Game handlers for player-ready, roll-dice, choose-category, game-start

2. **Task 2: Build GameResults and RematchVote components** - `5b1818a` (feat)
   - GameResults with winner announcement, rankings table, detailed scoresheet
   - RematchVote with voting buttons, progress bar, voter list
   - Socket event listeners for rematch-update, rematch-accepted, rematch-declined
   - Auto-navigation to lobby on rematch decline

## Files Created/Modified

**Created:**
- `src/components/game/GameResults.tsx` - End-of-game results with winner trophy, podium rankings (gold/silver/bronze), total scores, detailed scoresheet breakdown with expand/collapse
- `src/components/game/RematchVote.tsx` - Post-game rematch voting with yes/no buttons, progress indicator showing votes/{required}, voter list with check/X icons, auto-navigate to lobby on decline

**Modified:**
- `server.js` - Added imports (applyAction, createInitialState, autoPickCategory, calculateScore, calculateTotalScore, rollDice), turn timer management (turnTimers Map, startTurnTimer, resetTurnTimer, clearTurnTimer), autoPlay function using imported autoPickCategory, kickPlayerAFK for AFK removal, game handlers (player-ready, roll-dice, choose-category, game-start), rematch voting handler with majority threshold

## Decisions Made

**Auto-play uses imported autoPickCategory:**
- Zero inline scoring logic in server.js
- All scoring via imported calculateScore from kniffel-rules.ts
- Ensures auto-play strategy matches tested scoring logic
- No duplication, single source of truth

**Turn timer auto-rolls if player hasn't rolled:**
- Check rollsRemaining === 3 before auto-play
- If true, auto-roll via applyAction(ROLL_DICE) with all dice released
- Then pick best category and apply score
- Ensures fair auto-play (player gets at least 1 roll)

**AFK kick adjusts game state:**
- Remove player from gameState.players and room.players
- If <2 players remain, end game and declare winner
- Adjust currentPlayerIndex if needed
- Broadcast player-kicked event with AFK reason

**Rematch voting resets to waiting room:**
- Majority acceptance (votedYes >= required) resets room.status to 'waiting'
- Clear gameState and rematchVotes
- Reset all player isReady to false
- Emit rematch-accepted for UI to transition
- Decline (votedNo > total - required) emits rematch-declined for lobby navigation

**GameResults podium styling:**
- 1st place: Gold (yellow-400 text, yellow-600 border/bg)
- 2nd place: Silver (gray-400 text, gray-600 border/bg)
- 3rd place: Bronze (orange-600 text, orange-600 border/bg)
- Trophy icon for 1st, Medal icon for 2nd/3rd, rank number for rest

**RematchVote progress indicator:**
- Visual progress bar showing votedYes / required
- Text showing votes remaining
- Voter list shows each player with check (yes), X (no), or "Wartet..." (pending)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all implementations worked correctly, server syntax valid, build passed on first try.

## User Setup Required

None - no external service configuration required. Turn timers and rematch voting use existing Socket.IO infrastructure and game state types.

## Next Phase Readiness

**Ready for:**
- End-to-end verification (02-11) - all game features complete
- Turn timer triggers auto-play correctly
- AFK system kicks inactive players
- Rematch voting enables replay without leaving room
- GameResults displays final standings
- RematchVote manages post-game flow

**Notes:**
- Server game handlers now complete: game:start, game:player-ready, game:roll-dice, game:choose-category, game:rematch-vote
- Turn timer automatically clears on game end
- Auto-play increments consecutiveInactive, manual play resets to 0
- Rematch votes initialized on game:ended event with total player count and required threshold (Math.ceil(total / 2))
- All German system messages for auto-play, AFK kick, game end, rematch

---
*Phase: 02-core-game-engine*
*Completed: 2026-02-11*
