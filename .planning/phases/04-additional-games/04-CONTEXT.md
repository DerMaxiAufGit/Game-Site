# Phase 4: Additional Games - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Full game suite with Texas Hold'em Poker, Blackjack, and Roulette added to the platform. Each game integrates with the existing virtual currency and escrow/betting system from Phase 3. All game outcomes use server-side cryptographic RNG. Solo play (vs house) for Blackjack and Roulette; multiplayer for all three games.

</domain>

<decisions>
## Implementation Decisions

### Poker format
- 9-max (full ring) tables — up to 9 players per table
- Room creator fully configures blinds: starting blind amount, whether blinds escalate or stay fixed, escalation intervals
- Room creator sets whether rebuys are allowed and rebuy limits
- Room creator sets min/max buy-in range for their table
- Host decides when to end the game — no automatic ending
- Chips convert back proportionally to buy-in rate when game ends
- Spectators can watch but cannot see players' hole cards
- Full side pot support — all-in creates proper side pot(s), each resolved separately

### Blackjack house rules
- Full action set: Hit, Stand, Double Down, Split, Insurance, Surrender
- 6-deck shoe, reshuffled after every round (not running shoe)
- Blackjack pays 3:2 (classic payout)
- Bet-then-deal flow: player places bet amount each round before cards are dealt
- Up to 3 hands per player in solo mode (multi-hand)
- Multiplayer is shared experience: multiple players at table, each playing own hand against dealer independently, but can see each other's hands and chat (Stammtisch feel)

### Roulette style
- European variant (single zero, 37 numbers, 2.7% house edge)
- Full casino bet range: inside bets (straight, split, street, corner, line) + outside bets (red/black, odd/even, dozens, columns, high/low)
- No racetrack/special bets (Voisins du Zéro, etc.) — standard table only
- Multiplayer: shared table with simultaneous betting — all players place bets on the same spin, see each other's bets
- Unlimited bet positions per spin
- Spin timing: host chooses via dropdown with presets and manual input, or can opt for manual spin trigger
- Display last 10-20 results with hot/cold number indicators

### Card & table presentation
- 2D flat cards (SVG/CSS) with flip animations — not 3D
- Classic casino felt table style: green felt texture, wood border, gold accents
- Visual chip stacks with denominations, drag to bet — immersive display
- Elaborate animations: smooth dealing arcs, card flips, chip movements — cinematic casino feel
- 2D animated roulette wheel (top-down) with ball animation
- Classic crosshatch/diamond pattern card backs — no custom branding
- Poker: oval table with fixed seat positions, players arranged around
- Full ambient sound effects: card flips, chip clinks, wheel spinning, win/loss sounds

### Claude's Discretion
- Dealer behavior for Blackjack (stand on soft 17 vs hit on soft 17)
- Exact animation timing and easing curves
- Chip denomination breakpoints and colors
- Sound effect selection and mixing
- Poker auto-fold timer duration
- Roulette ball animation physics

</decisions>

<specifics>
## Specific Ideas

- Poker should feel like a configurable home game — room creator has full control over the session parameters (blinds, rebuys, buy-in range)
- Blackjack multiplayer should create the "Stammtisch" feeling — everyone at the table together, chatting while playing their own hands
- Roulette host controls the pace — can set a timer or manually trigger spins when the group is ready
- Visual style mixes 2D cards with classic casino felt for an elegant, readable presentation
- Sound effects are important for immersion across all three games

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-additional-games*
*Context gathered: 2026-02-13*
