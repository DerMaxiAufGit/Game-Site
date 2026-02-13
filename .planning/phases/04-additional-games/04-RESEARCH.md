# Phase 4: Additional Games - Research

**Researched:** 2026-02-13
**Domain:** Multiplayer casino game implementation (Poker, Blackjack, Roulette)
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 adds three classic casino games (Texas Hold'em Poker, Blackjack, Roulette) to the existing game platform. Research reveals established patterns for game state machines, hand evaluation algorithms, and casino UI/UX. The existing codebase already demonstrates solid patterns with pure state machine functions, cryptographic RNG, and JSON game state storage that can be extended to these new games.

**Key findings:**
- Poker requires complex pot management with side pots for all-in scenarios
- Blackjack needs careful rule configuration (split, double, insurance, surrender)
- Roulette is simpler mechanically but requires extensive betting grid UI
- Card rendering and animations are critical for "Stammtisch" immersion
- All three games can follow existing patterns from Kniffel implementation

**Primary recommendation:** Build each game as a separate state machine module following the existing `state-machine.ts` pattern, use established poker/blackjack libraries for complex logic (hand evaluation, pot calculation), implement custom UI with SVG cards and CSS-based casino theming, and leverage existing escrow/payout system from Phase 3.

## Standard Stack

### Core Game Logic Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| poker-evaluator-ts | ^1.x | Texas Hold'em hand evaluation | TypeScript port, Two Plus Two algorithm, evaluates 22MM hands/sec, handles 3-7 card hands |
| engine-blackjack | ^1.6.x | Blackjack game engine | Action-dispatch pattern, configurable rules, handles splits/insurance/surrender |
| node:crypto | Built-in | CSPRNG for shuffling/dealing | Already used in codebase, cryptographically secure (SPIEL-07) |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mudont/react-ts-svg-playing-cards | Latest | SVG playing cards React components | For card rendering with TypeScript support |
| dnd-kit | ^6.x | Drag-and-drop for betting chips | TypeScript-first, 10kb core, accessible, performant |
| react-countup | ^6.5.3 | Animated number counters | Already in package.json, used for balance animations |
| recharts | ^3.7.0 | Data visualization | Already in package.json, could be used for hot/cold number displays |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| poker-evaluator-ts | pokersolver | pokersolver is more popular but JavaScript-only; poker-evaluator-ts is TypeScript-native |
| engine-blackjack | Custom implementation | Engine-blackjack is battle-tested with all edge cases handled; custom risks bugs in split/insurance logic |
| @mudont/react-ts-svg-playing-cards | SVG-cards (raw) | Raw SVG requires manual React wrapping; package provides ready components |
| dnd-kit | react-beautiful-dnd | dnd-kit is lighter (10kb vs 32kb), better TypeScript, more modern API, actively maintained |

**Installation:**
```bash
npm install poker-evaluator-ts engine-blackjack @mudont/react-ts-svg-playing-cards @dnd-kit/core @dnd-kit/sortable
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── game/
│   │   ├── poker/
│   │   │   ├── state-machine.ts       # Poker game state transitions
│   │   │   ├── pot-calculator.ts      # Side pot logic for all-ins
│   │   │   ├── hand-evaluator.ts      # Wrapper around poker-evaluator-ts
│   │   │   └── __tests__/
│   │   ├── blackjack/
│   │   │   ├── state-machine.ts       # Blackjack game state transitions
│   │   │   ├── engine-wrapper.ts      # Wrapper around engine-blackjack
│   │   │   └── __tests__/
│   │   ├── roulette/
│   │   │   ├── state-machine.ts       # Roulette game state transitions
│   │   │   ├── bet-validator.ts       # Validate bet types and payouts
│   │   │   ├── wheel.ts               # European wheel configuration
│   │   │   └── __tests__/
│   │   ├── cards/
│   │   │   ├── deck.ts                # Card deck creation and shuffling
│   │   │   └── types.ts               # Card type definitions
│   │   └── crypto-rng.ts              # Already exists, extend for cards
├── components/
│   ├── poker/
│   │   ├── PokerTable.tsx             # Main poker game board
│   │   ├── PlayerSeat.tsx             # Individual seat with cards/chips
│   │   ├── CommunityCards.tsx         # Flop/turn/river display
│   │   ├── PotDisplay.tsx             # Main pot + side pots
│   │   └── BettingControls.tsx        # Fold/check/call/raise UI
│   ├── blackjack/
│   │   ├── BlackjackTable.tsx         # Main blackjack board
│   │   ├── DealerHand.tsx             # Dealer cards with hidden card
│   │   ├── PlayerHand.tsx             # Player hand (supports splits)
│   │   └── ActionButtons.tsx          # Hit/stand/double/split/surrender
│   ├── roulette/
│   │   ├── RouletteTable.tsx          # Main roulette board
│   │   ├── RouletteWheel.tsx          # Animated spinning wheel
│   │   ├── BettingGrid.tsx            # Number grid with bet zones
│   │   └── ResultHistory.tsx          # Last 10-20 results
│   ├── casino/
│   │   ├── Card.tsx                   # Single playing card component
│   │   ├── ChipStack.tsx              # Visual chip stack display
│   │   ├── FeltTable.tsx              # Reusable felt table wrapper
│   │   └── SoundEffects.tsx           # Audio management
```

### Pattern 1: Pure State Machine Functions

**What:** Game logic as pure functions that take state + action, return new state or Error. No side effects, no I/O.

**When to use:** All game logic modules (poker, blackjack, roulette)

**Example:**
```typescript
// Source: Existing codebase src/lib/game/state-machine.ts
export type GameAction =
  | { type: 'BET'; amount: number }
  | { type: 'RAISE'; amount: number }
  | { type: 'FOLD' }

export function applyAction(
  state: PokerGameState,
  action: GameAction,
  userId: string
): PokerGameState | Error {
  if (state.phase === 'ended') {
    return new Error('Game is over')
  }

  switch (action.type) {
    case 'BET':
      return handleBet(state, userId, action.amount)
    // ...
  }
}
```

### Pattern 2: Cryptographic Deck Shuffling

**What:** Fisher-Yates shuffle with node:crypto.randomInt for unbiased, secure card shuffling

**When to use:** All card deck creation (poker, blackjack)

**Example:**
```typescript
// Source: https://github.com/richardschneider/crypto-shuffle pattern
import { randomInt } from 'node:crypto'

export function createShuffledDeck(): Card[] {
  const deck = createDeck() // 52 cards

  // Fisher-Yates shuffle with CSPRNG
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  return deck
}
```

### Pattern 3: Action-Dispatch Game Engine

**What:** Redux-inspired pattern where state changes only via dispatched actions

**When to use:** Blackjack (wrapping engine-blackjack), can also apply to other games

**Example:**
```typescript
// Source: engine-blackjack documentation
import { Game, actions } from 'engine-blackjack'

const game = new Game({
  decks: 6,
  standOnSoft17: true,
  double: 'any',
  split: true,
  doubleAfterSplit: true,
  surrender: true,
  insurance: true
})

game.dispatch(actions.deal({ bet: 100 }))
const state = game.getState()

if (state.availableActions.includes('split')) {
  game.dispatch(actions.split())
}
```

### Pattern 4: Side Pot Calculation

**What:** Algorithm for creating main pot + side pots when players go all-in with different stack sizes

**When to use:** Poker all-in scenarios with 2+ players

**Example:**
```typescript
// Source: https://replayhelp.casino.org/hc/en-us/articles/360001878554-How-side-pots-work
// Players with stacks: [300, 500, 800]
// Main pot: 3 × 300 = 900 (all three eligible)
// Side pot 1: 2 × 200 = 400 (only 500 and 800 stacks eligible)
// Side pot 2: 1 × 300 = 300 (only 800 stack eligible)

export function calculateSidePots(
  players: Array<{ userId: string; bet: number }>,
  currentPot: number
): Pot[] {
  const sorted = [...players].sort((a, b) => a.bet - b.bet)
  const pots: Pot[] = []
  let previousBet = 0

  for (let i = 0; i < sorted.length; i++) {
    const bet = sorted[i].bet
    const contribution = bet - previousBet
    const eligiblePlayers = sorted.slice(i).map(p => p.userId)
    const amount = contribution * eligiblePlayers.length

    if (amount > 0) {
      pots.push({ amount, eligiblePlayers })
    }
    previousBet = bet
  }

  return pots
}
```

### Pattern 5: SVG Card Rendering with Flip Animation

**What:** Use SVG-based card components with CSS flip animations for dealing/revealing

**When to use:** All card games (poker, blackjack)

**Example:**
```typescript
// Source: @mudont/react-ts-svg-playing-cards + CSS pattern
import { Card as SVGCard } from '@mudont/react-ts-svg-playing-cards'

export function Card({ rank, suit, faceDown, isDealing }: CardProps) {
  return (
    <div className={cn(
      "card-container transition-transform duration-500",
      isDealing && "animate-deal-arc",
      faceDown && "rotate-y-180"
    )}>
      <div className="card-face-front">
        <SVGCard rank={rank} suit={suit} />
      </div>
      <div className="card-face-back">
        {/* Classic crosshatch pattern */}
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Client-side RNG for gameplay:** Never use Math.random() for dealing cards or spinning roulette - always server-side crypto.randomInt (SPIEL-07 requirement)
- **Inline function re-renders:** Don't define callbacks inline in render - causes performance issues with animations (use useCallback)
- **Mutating game state:** Never mutate state objects - always return new state from reducers (breaks time-travel debugging)
- **Forgetting side pots:** Don't assume single pot in poker - all-in with 3+ players requires side pot logic
- **Hand-rolling card evaluation:** Poker hand ranking has subtle edge cases (wheel straights, kickers) - use battle-tested library
- **Synchronous state updates:** Don't assume instant state sync - WebSocket updates are async, show optimistic UI

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Poker hand evaluation | Custom ranking algorithm | poker-evaluator-ts | Handles kickers, wheel straights, 5-7 card combos, 22MM evals/sec |
| Blackjack split/double rules | Manual if/else logic | engine-blackjack | Handles split aces, doubleAfterSplit, insurance timing, all edge cases |
| Deck shuffling | Array.sort(() => Math.random() - 0.5) | Fisher-Yates + crypto.randomInt | sort() is biased and not cryptographically secure |
| Side pot calculation | Ad-hoc pot splitting | Established algorithm (Pattern 4) | Easy to get wrong with 3+ all-ins, eligibility tracking complex |
| Drag-and-drop chips | Custom mouse event handlers | dnd-kit | Touch support, accessibility, collision detection, keyboard nav all hard |
| Card flip animations | Custom WebGL/Canvas | CSS 3D transforms + SVG | Overengineering - 2D requirement, CSS performs great, easier to maintain |

**Key insight:** Casino game logic has decades of edge cases discovered and codified. Using battle-tested libraries prevents subtle bugs (e.g., blackjack insurance offered at wrong time, poker side pot incorrectly split, biased shuffle). Focus custom code on UX/multiplayer aspects, not core game rules.

## Common Pitfalls

### Pitfall 1: State Synchronization in Multiplayer

**What goes wrong:** Client UI shows one game state while server has progressed to different state, causing illegal actions or visual glitches

**Why it happens:** WebSocket latency, optimistic updates gone wrong, reconnection without state recovery

**How to avoid:**
- Always treat server as source of truth (never compute game state client-side)
- Send minimal diffs, not full state objects (reduces bandwidth)
- Implement state recovery on reconnect (existing ECHT-02 pattern)
- Disable action buttons during pending actions (show loading state)

**Warning signs:** Players report "button didn't work" or "saw wrong cards", actions rejected by server

### Pitfall 2: Insufficient State Machine Coverage

**What goes wrong:** Game reaches unexpected state combination and breaks (e.g., player disconnects during blackjack split decision)

**Why it happens:** Testing only happy paths, not edge cases like disconnect/timeout during critical decisions

**How to avoid:**
- Write state machine tests with property-based testing (all transitions valid)
- Handle PLAYER_DISCONNECT action in every game phase
- Implement auto-actions for AFK/disconnected players (fold, stand, etc.)
- Use TypeScript discriminated unions for exhaustive phase checking

**Warning signs:** Games get "stuck", players can't complete round, need manual intervention

### Pitfall 3: Animation Performance with Many Elements

**What goes wrong:** Casino games have many animated elements (cards, chips, wheel) that can cause frame drops on low-end devices

**Why it happens:** Too many simultaneous animations, repainting entire table, not using CSS transforms, animating expensive properties (width/height vs transform)

**How to avoid:**
- Animate only transform and opacity (GPU-accelerated)
- Stagger animations (don't start 9 card deals simultaneously)
- Use requestAnimationFrame for complex sequences
- Debounce rapid state updates (don't re-render on every chip drag pixel)
- Profile with React DevTools Profiler before and after optimizations

**Warning signs:** Janky animations, dropped frames, slow interaction response

### Pitfall 4: Poker Side Pot Edge Cases

**What goes wrong:** Side pots calculated incorrectly when multiple players all-in with overlapping amounts, or player wins pot they're not eligible for

**Why it happens:** Algorithm doesn't account for all scenarios (partial eligibility, folded players, ties)

**How to avoid:**
- Use proven side pot algorithm (Pattern 4)
- Track eligible players per pot (not just amount)
- Handle ties within side pots (split evenly among winners)
- Test with 3-4 player all-in scenarios with varying stacks
- Verify total distributed equals total pot (no chips lost/created)

**Warning signs:** Player complaints about winnings, pot totals don't match sum of bets

### Pitfall 5: Blackjack Insurance/Surrender Timing

**What goes wrong:** Insurance offered at wrong time, surrender available after hit, double allowed after split aces

**Why it happens:** Complex interaction between rules and game state phases

**How to avoid:**
- Use engine-blackjack which handles timing correctly
- If custom implementation, follow strict phase progression: deal → insurance check → player actions → dealer actions
- Configuration object should control rule interactions (e.g., doubleAfterSplit flag)
- Reference authoritative sources (Wizard of Odds) for correct rule interactions

**Warning signs:** Players exploit rule bugs for advantage, game behavior doesn't match casino standards

### Pitfall 6: Cryptographic Shuffle Insufficient Entropy

**What goes wrong:** Deck shuffle doesn't produce all possible permutations, creating predictable patterns

**Why it happens:** Using Math.random() or RNG with insufficient bits of state (52! requires 226 bits)

**How to avoid:**
- Always use node:crypto.randomInt (existing pattern in crypto-rng.ts)
- Implement Fisher-Yates shuffle correctly (swap with random index from remaining)
- Never use array.sort(() => Math.random() - 0.5) - biased and insufficient entropy
- Test: shuffle 1000 decks, verify uniform distribution of first card ranks

**Warning signs:** Players notice patterns, certain card combinations seem more common

## Code Examples

Verified patterns from official sources:

### Poker Hand Evaluation
```typescript
// Source: poker-evaluator-ts (Two Plus Two algorithm)
import { evaluateHand } from 'poker-evaluator-ts'

export function determineWinner(
  hands: Array<{ userId: string; cards: Card[] }>,
  communityCards: Card[]
): string[] {
  const evaluated = hands.map(({ userId, cards }) => {
    const allCards = [...cards, ...communityCards]
    const hand = allCards.map(c => `${c.rank}${c.suit}`).join(' ')
    const { value, name } = evaluateHand(hand)
    return { userId, value, name }
  })

  const maxValue = Math.max(...evaluated.map(e => e.value))
  const winners = evaluated.filter(e => e.value === maxValue)

  return winners.map(w => w.userId)
}
```

### Blackjack Game Initialization
```typescript
// Source: engine-blackjack documentation
import { Game, actions } from 'engine-blackjack'

export function createBlackjackGame(config: BlackjackConfig) {
  return new Game({
    decks: 6,                    // 6-deck shoe
    standOnSoft17: true,         // Dealer stands on soft 17
    double: 'any',               // Double on any two cards
    split: true,                 // Splitting allowed
    doubleAfterSplit: true,      // Can double after split
    surrender: true,             // Late surrender allowed
    insurance: true,             // Insurance when dealer shows ace
    showdownAfterAceSplit: true  // Immediate showdown after split aces
  })
}
```

### Roulette Bet Validation
```typescript
// Source: European roulette specifications
export const ROULETTE_BETS = {
  straight: { numbers: 1, payout: 35 },      // Single number
  split: { numbers: 2, payout: 17 },         // Two adjacent numbers
  street: { numbers: 3, payout: 11 },        // Row of three
  corner: { numbers: 4, payout: 8 },         // Four-number square
  line: { numbers: 6, payout: 5 },           // Two rows
  dozen: { numbers: 12, payout: 2 },         // 1st/2nd/3rd dozen
  column: { numbers: 12, payout: 2 },        // Column
  red: { numbers: 18, payout: 1 },           // Red numbers
  black: { numbers: 18, payout: 1 },         // Black numbers
  odd: { numbers: 18, payout: 1 },           // Odd numbers
  even: { numbers: 18, payout: 1 },          // Even numbers
  low: { numbers: 18, payout: 1 },           // 1-18
  high: { numbers: 18, payout: 1 }           // 19-36
} as const

export function validateBet(
  betType: keyof typeof ROULETTE_BETS,
  numbers: number[]
): boolean {
  const expectedCount = ROULETTE_BETS[betType].numbers
  return numbers.length === expectedCount &&
         numbers.every(n => n >= 0 && n <= 36)
}
```

### Cryptographic Card Shuffle
```typescript
// Source: Fisher-Yates + node:crypto pattern
import { randomInt } from 'node:crypto'

export type Card = { rank: string; suit: string }

export function createDeck(): Card[] {
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
  const suits = ['♠','♥','♦','♣']

  return ranks.flatMap(rank =>
    suits.map(suit => ({ rank, suit }))
  )
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]

  // Fisher-Yates shuffle with CSPRNG
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}
```

### Casino Table Felt Styling
```typescript
// CSS pattern for classic casino table
export function FeltTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[2rem] overflow-hidden">
      {/* Wood border */}
      <div className="absolute inset-0 rounded-[2rem] border-[16px] border-amber-900 shadow-2xl"
           style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }} />

      {/* Green felt surface */}
      <div className="relative bg-gradient-to-br from-green-800 to-green-900 p-12"
           style={{
             backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0z\' fill=\'%23064e3b\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")'
           }}>
        {children}
      </div>

      {/* Gold accent line */}
      <div className="absolute inset-0 rounded-[2rem] border-2 border-yellow-600/30 pointer-events-none" />
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Math.random() for shuffling | crypto.randomInt (CSPRNG) | 2015+ | Cryptographically secure, prevents predictable patterns |
| react-beautiful-dnd | dnd-kit | 2021+ | 3x smaller, better TypeScript, better performance, maintained |
| Custom hand ranking | poker-evaluator-ts | Established | 22MM hands/sec, handles all edge cases |
| Inline animations | Framer Motion / CSS transforms | 2020+ | GPU-accelerated, smoother, less jank |
| Full state broadcasts | State diffs/patches | 2018+ | Reduced bandwidth, faster updates in multiplayer |

**Deprecated/outdated:**
- **Array.sort() shuffle:** Produces biased results, mathematically incorrect
- **Client-side game logic:** Creates cheating vectors, use server authoritative
- **Nested ternaries for game rules:** Unmaintainable, use state machines or established engines

## Open Questions

Things that couldn't be fully resolved:

1. **Animation Library Choice**
   - What we know: Project already uses CSS animations (balance-widget.tsx), has tw-animate-css dependency, react-countup for numbers
   - What's unclear: Whether to add Framer Motion for complex card dealing arcs or stick with pure CSS
   - Recommendation: Start with CSS transforms + keyframes (fits existing stack), add Framer Motion only if complex gesture interactions needed

2. **Sound Effects Integration**
   - What we know: Multiple royalty-free casino sound libraries available (OpenGameArt has 54 sounds), Web Audio API is standard
   - What's unclear: Where sounds are triggered (client vs server event), how to handle muting, caching strategy
   - Recommendation: Client-side playback on state change events, lazy-load sound files, implement global mute toggle in user settings

3. **Poker Rebuy Flow**
   - What we know: Room creator sets rebuy limits, chips convert back proportionally at game end
   - What's unclear: How rebuys interact with escrow system (immediate deduction? separate transaction?), timing (anytime vs only between hands)
   - Recommendation: Rebuys only between hands (not mid-hand), separate escrow transaction, track total buy-ins per player for proper payout at end

4. **Roulette Bet Overlap Display**
   - What we know: Multiplayer means multiple players bet on same numbers simultaneously
   - What's unclear: How to visually stack/display overlapping chips on betting grid
   - Recommendation: Small offset chips vertically with player color/avatar, hover to see breakdown, or aggregate with count badge

## Sources

### Primary (HIGH confidence)
- poker-evaluator-ts - npm package, TypeScript poker hand evaluation
- engine-blackjack - GitHub/npm, comprehensive blackjack engine with configurable rules
- node:crypto documentation - Official Node.js docs for randomInt CSPRNG
- Existing codebase patterns - src/lib/game/state-machine.ts, crypto-rng.ts, payout.ts

### Secondary (MEDIUM confidence)
- [poker-ts](https://github.com/claudijo/poker-ts) - Poker table model architecture patterns
- [Poker side pot calculation](https://replayhelp.casino.org/hc/en-us/articles/360001878554-How-side-pots-work) - Algorithm and examples
- [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) - Unbiased shuffle algorithm
- [crypto-shuffle](https://github.com/richardschneider/crypto-shuffle) - Cryptographically secure shuffle implementation
- [dnd-kit documentation](https://dndkit.com/) - Modern drag-and-drop library
- [Blackjack rules](https://wizardofodds.com/games/blackjack/basics/) - Authoritative casino game rules
- [European roulette specs](https://en.wikipedia.org/wiki/Roulette) - Wheel layout and house edge

### Tertiary (LOW confidence - needs validation)
- WebSearch results for React casino animations - General patterns, no specific code
- WebSearch results for SVG card libraries - Multiple options exist, need package comparison
- WebSearch results for sound effects - Libraries available but licensing needs verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - poker-evaluator-ts and engine-blackjack are established, node:crypto is official
- Architecture: HIGH - Existing codebase demonstrates proven patterns (state machines, pure functions)
- Pitfalls: MEDIUM-HIGH - Based on authoritative sources + common game dev issues, but not game-specific experience
- UI/Animation: MEDIUM - Multiple approaches exist, decision depends on performance vs developer experience tradeoffs

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days for stable domain, game logic patterns are evergreen)

**Notes:**
- Game rule implementation is well-established domain with decades of prior art
- Focus planning on multiplayer synchronization and UX polish, not core game logic
- Existing Phase 3 escrow/payout system provides solid foundation for betting integration
- Phase context decisions (2D cards, classic felt, sound effects) align well with available libraries
