---
phase: 02-core-game-engine
plan: 07
subsystem: ui
tags: [react, r3f, socket.io, kniffel, game-ui, next.js, tailwind]

# Dependency graph
requires:
  - phase: 02-03
    provides: Game state machine with turn logic and scoring
  - phase: 02-04
    provides: Room lifecycle Socket.IO handlers
  - phase: 02-05
    provides: 3D DiceScene with physics animation

provides:
  - Game room page at /game/[roomId] with Socket.IO integration
  - WaitingRoom pre-game lobby with ready-up and host controls
  - GameBoard combining DiceScene + Scoresheet + TurnTimer
  - Scoresheet with potential score preview and category selection
  - TurnTimer with server-synced countdown
  - PlayerList showing current turn and scores

affects: [02-08-game-chat, 02-09-room-creation, future-gameplay]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dynamic import for R3F components (ssr: false)"
    - "isAnimating state gates UI during dice physics"
    - "Server timestamp sync for turn timer"
    - "Optimistic local state for kept dice toggles"
    - "Socket event flow: emit -> server update -> state change -> UI update"

key-files:
  created:
    - src/app/game/[roomId]/page.tsx
    - src/components/game/WaitingRoom.tsx
    - src/components/game/PlayerList.tsx
    - src/components/game/GameBoard.tsx
    - src/components/game/Scoresheet.tsx
    - src/components/game/TurnTimer.tsx
  modified: []

key-decisions:
  - "GameBoard uses isAnimating state to prevent scoresheet clicks during dice roll animation"
  - "Dynamic import GameBoard to prevent SSR issues with React Three Fiber"
  - "Scoresheet has compact/full table view toggle for different screen sizes"
  - "TurnTimer calculates from server startedAt timestamp to stay in sync"
  - "Roll button immediately emits to server, dice values come from server response"

patterns-established:
  - "Roll flow: Button click -> socket emit -> server generates dice -> state update -> DiceScene animates -> onRollComplete -> enable scoring"
  - "Socket event listeners in useEffect with cleanup on unmount"
  - "Conditional rendering based on room.status (waiting/playing/ended)"
  - "German translations via useTranslations('game') and useTranslations('scoresheet')"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 02 Plan 07: Game Room Page Summary

**Complete Kniffel game interface with waiting room, 3D dice, scoresheet, and turn timer, all synchronized via Socket.IO**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T20:47:21Z
- **Completed:** 2026-02-11T20:51:00Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- Built complete game room page at /game/[roomId] with Socket.IO room management
- WaitingRoom with player ready-up system, host controls (start/force/kick), and room settings display
- GameBoard orchestrates DiceScene + Scoresheet + TurnTimer with responsive layout
- Dice roll flow fully wired: Roll button -> socket emit -> server dice -> DiceScene animation -> onRollComplete -> enable category selection
- Scoresheet shows potential scores via calculateScore, supports compact and full table views
- TurnTimer syncs with server timestamp for accurate countdown across clients

## Task Commits

Each task was committed atomically:

1. **Task 1: Create game room page with waiting room and player list** - `1d35ffe` (feat)
   - Game room page with Socket.IO join/leave/update handlers
   - WaitingRoom component with ready-up buttons and host controls
   - PlayerList compact component showing turn indicator and scores

2. **Task 2: Build GameBoard, Scoresheet, and TurnTimer** - `7d77ee3` (feat)
   - GameBoard layout combining all game elements
   - Scoresheet with category selection and potential score preview
   - TurnTimer with color-coded progress bar

## Files Created/Modified

**Created:**
- `src/app/game/[roomId]/page.tsx` - Game room route with status-based rendering (waiting/playing/ended)
- `src/components/game/WaitingRoom.tsx` - Pre-game lobby with ready-up, host controls, room info
- `src/components/game/PlayerList.tsx` - Compact player display with turn indicator and scores
- `src/components/game/GameBoard.tsx` - Main game interface orchestrating DiceScene + Scoresheet + TurnTimer
- `src/components/game/Scoresheet.tsx` - Kniffel scoresheet with potential scores and category selection
- `src/components/game/TurnTimer.tsx` - Server-synced countdown timer with color transitions

## Decisions Made

**isAnimating gates scoresheet during dice physics:**
- Roll flow requires dice animation to complete before allowing category selection
- Set `isAnimating=true` when dice values change from server, `false` on `onRollComplete`
- Prevents race condition where player clicks category while dice still tumbling

**Dynamic import for GameBoard:**
- React Three Fiber (used by DiceScene) requires browser environment
- Dynamic import with `ssr: false` prevents Next.js SSR errors
- Loading fallback shows spinner during import

**Server timestamp sync for turn timer:**
- Calculate remaining time from server's `turnStartedAt` timestamp, not local timer start
- Prevents drift if client tab suspended or network delayed
- Uses `setInterval` to update display, but always calculates from server time

**Scoresheet view modes:**
- Compact view: Own scores only (good for mobile)
- Full table view: All players side-by-side (good for desktop)
- Toggle button switches between views

**Socket event flow for dice rolling:**
- Client emits `game:roll-dice` with current `keptDice` state
- Server generates new dice via crypto RNG, broadcasts `game:state-update`
- Client receives new dice values, triggers DiceScene animation
- DiceScene calls `onRollComplete` when physics settle
- GameBoard enables scoresheet category selection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components built successfully and build passed on first try.

## User Setup Required

None - no external service configuration required. Game room page uses existing Socket.IO connection and game state types.

## Next Phase Readiness

**Ready for:**
- Game chat integration (02-08) - can add GameChat component to GameBoard
- Room creation flow (02-09) - can redirect to /game/[roomId] after creation
- End-to-end gameplay testing - all core game UI components complete

**Notes:**
- Server-side Socket.IO handlers for game logic (roll-dice, choose-category, player-ready, game-start) assumed to exist based on 02-04 plan
- If handlers missing, will need server implementation before gameplay works
- All German translations used from de.json (game.*, scoresheet.*, room.*)

---
*Phase: 02-core-game-engine*
*Completed: 2026-02-11*
