---
phase: 04-additional-games
plan: 04
subsystem: game-engine
tags: [roulette, tdd, state-machine, pure-functions, european-roulette, bet-validation]

# Dependency graph
requires:
  - phase: 04-01
    provides: Card types and deck utilities for casino games
  - phase: 02-01
    provides: Pure function state machine patterns and CSPRNG utilities
provides:
  - European roulette state machine with betting → spinning → settlement phases
  - Comprehensive bet validator for all 13 bet types (inside + outside bets)
  - Wheel configuration with correct European layout and color assignments
  - Payout calculation system for all bet types (35:1 to 1:1)
affects: [04-06, 04-07, roulette-ui, casino-lobby]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED-GREEN-REFACTOR with atomic commits per phase
    - Pure function bet validation with no side effects
    - Number parameter flexibility (single number or array)
    - Outside bet type constant for maintainability

key-files:
  created:
    - src/lib/game/roulette/wheel.ts
    - src/lib/game/roulette/bet-validator.ts
    - src/lib/game/roulette/state-machine.ts
    - src/lib/game/roulette/__tests__/bet-validator.test.ts
    - src/lib/game/roulette/__tests__/state-machine.test.ts
  modified: []

key-decisions:
  - "TDD methodology with RED-GREEN-REFACTOR phases (3 atomic commits)"
  - "European wheel layout (37 numbers: 0-36) with correct color mapping"
  - "Flexible number parameter for calculateBetPayout (single or array)"
  - "Extract OUTSIDE_BETS constant for DRY principle"
  - "Pure functions throughout - CSPRNG number passed in action"
  - "Return Error objects not throw for functional paradigm"

patterns-established:
  - "Adjacency validation for split/street/corner/line bets using grid logic"
  - "Result history tracking (last 20 spins) via unshift + slice"
  - "Player bet state separation (bets array + totalBetAmount field)"
  - "Payout calculation: betAmount * (payoutRatio + 1) returns original bet"

# Metrics
duration: 5.9min
completed: 2026-02-13
---

# Phase 04 Plan 04: Roulette State Machine (TDD) Summary

**European roulette state machine with all 13 bet types, adjacency validation, and payout calculation (35:1 to 1:1 ratios)**

## Performance

- **Duration:** 5.9 min (353 seconds)
- **Started:** 2026-02-13T18:25:32Z
- **Completed:** 2026-02-13T18:31:25Z
- **Tasks:** 3 TDD phases (RED → GREEN → REFACTOR)
- **Files modified:** 5 (3 implementation + 2 test files)

## Accomplishments

- 81 comprehensive test cases covering all bet types and state machine phases
- European wheel configuration with 37 numbers and correct color assignments
- Bet validator supporting all 13 bet types (straight, split, street, corner, line, dozen, column, red, black, odd, even, low, high)
- Adjacency validation for inside bets (horizontal/vertical splits, streets, corners, lines)
- Payout calculation matching European roulette rules (35:1 for straight to 1:1 for outside bets)
- Pure function state machine following project patterns (no side effects, Error objects)

## Task Commits

Each TDD phase was committed atomically:

1. **RED Phase: Failing tests** - `ebf485e` (test)
   - 81 test cases for bet validator and state machine
   - European wheel tests for color configuration
   - Payout calculation tests for all bet types

2. **GREEN Phase: Implementation** - `f3f3f2b` (feat)
   - wheel.ts with European layout and color functions
   - bet-validator.ts with all 13 bet type validations
   - state-machine.ts with betting → spinning → settlement flow
   - Bug fixes: flexible number parameter, result history test correction

3. **REFACTOR Phase: Code cleanup** - `dd102fb` (refactor)
   - Extract OUTSIDE_BETS constant for maintainability
   - DRY principle applied to outside bet type checking

**Total commits:** 3 (TDD phases)

## Files Created/Modified

- `src/lib/game/roulette/wheel.ts` - European wheel configuration (37 numbers, color mapping, number properties)
- `src/lib/game/roulette/bet-validator.ts` - Bet validation and payout calculation for 13 bet types
- `src/lib/game/roulette/state-machine.ts` - Pure function state machine (betting/spinning/settlement phases)
- `src/lib/game/roulette/__tests__/bet-validator.test.ts` - 60+ tests for bet validation and payouts
- `src/lib/game/roulette/__tests__/state-machine.test.ts` - 21 tests for state machine flow

## Decisions Made

**TDD methodology:** Followed strict RED-GREEN-REFACTOR cycle with atomic commits per phase. Tests written first (failing), then implementation (passing), then refactor (cleanup).

**European wheel layout:** Used standard European roulette configuration with 37 numbers (0-36). Red numbers: 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36. Black: all others except 0 (green).

**Bet validation approach:** Each bet type has specific validation logic:
- Split: horizontal (same row) or vertical (3 apart) adjacency
- Street: three consecutive numbers forming a row (1-2-3, 4-5-6, etc.)
- Corner: 2x2 square validation with column boundary checks
- Line: two adjacent streets (6 consecutive numbers)
- Dozen/Column: exact range validation

**Flexible number parameter:** `calculateBetPayout` accepts `number | number[]` to simplify API - automatically converts single number to array internally.

**Outside bet extraction:** Created `OUTSIDE_BETS` constant array to avoid duplication in validation logic.

**Pure functions:** State machine returns new state or Error objects (not throw). CSPRNG number passed in SPIN action (not generated inside).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Flexible number parameter for calculateBetPayout**
- **Found during:** GREEN phase - implementing payout calculation
- **Issue:** Tests passed single number for straight bets but array for others - inconsistent API
- **Fix:** Changed signature to accept `number | number[]`, normalize to array internally
- **Files modified:** src/lib/game/roulette/bet-validator.ts
- **Verification:** All 81 tests pass
- **Committed in:** f3f3f2b (GREEN phase commit)

**2. [Rule 1 - Bug] Result history test expectation**
- **Found during:** GREEN phase - running tests
- **Issue:** Test expected oldest value to be 1, but with array [0..19] + 7, oldest should be 18 (19 pushed out)
- **Fix:** Corrected test expectation from `.toBe(1)` to `.toBe(18)`
- **Files modified:** src/lib/game/roulette/__tests__/state-machine.test.ts
- **Verification:** Test passes with correct logic
- **Committed in:** f3f3f2b (GREEN phase commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for test correctness. No scope creep - all work within plan boundaries.

## Issues Encountered

None - TDD process proceeded smoothly. All tests passed after GREEN phase implementation.

## User Setup Required

None - no external service configuration required. Pure game logic with no dependencies on external APIs or services.

## Next Phase Readiness

**Ready for:**
- Roulette UI implementation (wheel rendering, bet placement interface)
- Roulette Socket.IO integration (multiplayer betting, synchronized spins)
- Casino lobby integration (room creation with roulette game type)

**Foundation complete:**
- All 13 bet types validated and tested
- European wheel configuration accurate
- State machine handles full game cycle
- Payout calculations match casino rules

**No blockers or concerns.**

---
*Phase: 04-additional-games*
*Completed: 2026-02-13*
