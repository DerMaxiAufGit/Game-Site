---
phase: 04-additional-games
plan: 01
subsystem: ui
tags: [react, svg, web-audio-api, css-animations, card-games, casino]

# Dependency graph
requires:
  - phase: 02-game-engine
    provides: Cryptographic RNG pattern (node:crypto randomInt)
provides:
  - Card type system (Rank, Suit, Card) shared across all casino games
  - CSPRNG deck utilities (createDeck, shuffleDeck, dealCards)
  - Reusable casino UI components (Card, FeltTable, ChipStack, SoundManager)
  - Casino animation keyframes (card-deal, card-flip, chip-slide, wheel-spin)
affects: [04-02-poker, 04-03-blackjack, 04-04-roulette]

# Tech tracking
tech-stack:
  added: [poker-evaluator-ts, engine-blackjack, @dnd-kit/core, @dnd-kit/sortable]
  patterns: [CSPRNG Fisher-Yates shuffle, Procedural Web Audio synthesis, SVG card rendering, 3D CSS transforms]

key-files:
  created:
    - src/lib/game/cards/types.ts
    - src/lib/game/cards/deck.ts
    - src/components/casino/Card.tsx
    - src/components/casino/CardBack.tsx
    - src/components/casino/FeltTable.tsx
    - src/components/casino/ChipStack.tsx
    - src/components/casino/SoundManager.tsx
    - src/components/casino/casino-animations.css
  modified:
    - src/app/globals.css
    - package.json

key-decisions:
  - "Custom SVG cards instead of external library for full styling control"
  - "Procedural Web Audio API sounds instead of audio files for zero asset dependencies"
  - "3D CSS transforms for card flip animations using preserve-3d"
  - "Chip denomination breakdown algorithm for visual chip stacks"

patterns-established:
  - "Fisher-Yates shuffle with crypto.randomInt for unbiased card distribution"
  - "Pure function deck utilities (return new arrays, no mutations)"
  - "Size variants (sm/md/lg) for responsive casino components"
  - "LocalStorage mute state for persistent sound preferences"

# Metrics
duration: 3.4min
completed: 2026-02-13
---

# Phase 04 Plan 01: Casino Foundation Summary

**Card type system with CSPRNG shuffle, SVG card components with 3D flip animations, casino felt tables, chip stacks, and procedural Web Audio sound effects**

## Performance

- **Duration:** 3.4 min (203 seconds)
- **Started:** 2026-02-13T17:27:17Z
- **Completed:** 2026-02-13T17:30:40Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Standard 52-card deck type system with multi-deck support (6-deck blackjack shoe)
- Cryptographic Fisher-Yates shuffle using node:crypto randomInt for provably fair shuffling
- Custom SVG Card component with face-up/face-down states and 3D flip animation
- Casino aesthetic components: FeltTable (green/blue/red variants), ChipStack (denomination breakdown)
- Procedural Web Audio API sound manager (no audio file dependencies)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create card type system with deck utilities** - `3b9a70a` (feat)
2. **Task 2: Build reusable casino UI components** - `1a57a6f` (feat)

## Files Created/Modified

**Created:**
- `src/lib/game/cards/types.ts` - Card, Rank, Suit type definitions with RANKS, SUITS arrays, SUIT_SYMBOLS, SUIT_COLORS mappings
- `src/lib/game/cards/deck.ts` - createDeck (52 cards), createMultiDeck (n-deck shoe), shuffleDeck (CSPRNG Fisher-Yates), dealCards utility
- `src/components/casino/Card.tsx` - SVG playing card with face-up/face-down, 3D flip animation, size variants (sm/md/lg)
- `src/components/casino/CardBack.tsx` - Classic diamond pattern card back with gold border
- `src/components/casino/FeltTable.tsx` - Casino felt table wrapper with wood border, gold accents, variant colors
- `src/components/casino/ChipStack.tsx` - Visual chip stack with denomination breakdown (1, 5, 25, 100, 500, 1000)
- `src/components/casino/SoundManager.tsx` - Web Audio API context provider with procedural sound synthesis
- `src/components/casino/casino-animations.css` - Keyframe animations (card-deal, card-flip, chip-slide, chip-stack, wheel-spin)

**Modified:**
- `src/app/globals.css` - Import casino-animations.css for global animation availability
- `package.json` - Add poker-evaluator-ts, engine-blackjack, @dnd-kit/core, @dnd-kit/sortable

## Decisions Made

**1. Custom SVG cards instead of @mudont/react-ts-svg-playing-cards**
- **Rationale:** Full control over styling, no external dependency risk, easier to customize for theme variants
- **Implementation:** Inline SVG with rank/suit in corners and center suit symbol
- **Trade-off:** Manual SVG design vs. ready-made library, but cleaner long-term maintenance

**2. Procedural Web Audio API sounds instead of audio files**
- **Rationale:** Zero asset dependencies, fully customizable, smaller bundle size
- **Implementation:** Oscillator-based tones with envelopes (sine, triangle, square, sawtooth)
- **Sounds:** Card flip/deal, chip clink/stack, wheel spin, win/lose melodies
- **Trade-off:** Less realistic than recorded audio, but sufficient for casino ambiance

**3. 3D CSS transforms for card flip animation**
- **Rationale:** Hardware-accelerated, smooth animation, no JavaScript animation required
- **Implementation:** `preserve-3d`, `backface-hidden`, `rotateY(180deg)` for natural card flip
- **Benefit:** Performant across devices, declarative CSS animation

**4. Chip denomination breakdown algorithm**
- **Rationale:** Realistic casino chip representation, visually communicates bet amounts
- **Implementation:** Greedy algorithm breaks amount into standard denominations (1000, 500, 100, 25, 5, 1)
- **UX:** Stacked chips with max 5 per stack, count badge for overflow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components built and compiled successfully on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for parallel game development:**
- Card type system provides shared foundation for Poker, Blackjack, Roulette
- Deck utilities handle all shuffling and dealing needs with cryptographic fairness
- Casino UI components create consistent visual language across all games
- Sound manager ready for integration (mute toggle in user settings recommended)

**Blockers/Concerns:**
- None

**Recommendations for next plans:**
- Import card types from `@/lib/game/cards/types` consistently
- Use `shuffleDeck(createDeck())` for provably fair dealing
- Wrap game boards in `<FeltTable>` for casino aesthetic
- Integrate `useCasinoSound()` hook for audio feedback
- Test card flip animation performance on mobile devices

---
*Phase: 04-additional-games*
*Completed: 2026-02-13*
