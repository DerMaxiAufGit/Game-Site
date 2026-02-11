# Phase 2: Core Game Engine (Kniffel MVP) - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Players can play Kniffel in real-time at shared tables. This phase delivers: lobby with room browsing, room creation with host settings, dice rolling with 3D animation, scoresheet with scoring, turn-based play with timers, table chat, spectator mode, AFK handling, and room cleanup. Virtual currency/betting, additional games, and statistics are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Lobby & Room Browsing
- Detailed room cards in lobby: room name, all player names/avatars, status (waiting/in progress), time created
- Public rooms visible to all; private rooms joinable only via shared link
- Room creator is host with powers: kick players, change settings before game, force-start
- Late arrivals can join an in-progress game as spectators, eligible to play next round

### Room Creation & Game Start
- 2-6 players supported per room
- Host sets: player count, public/private, turn timer, AFK kick threshold
- Ready-up system: each player marks ready, game starts when all are ready (minimum 2 players)
- After game ends: vote rematch — if majority says yes, new game starts with same group

### Dice Interaction
- Animated 3D dice with physics — dice tumble and bounce for satisfying, immersive feel
- Tap to keep: tap individual dice to lock/unlock them — kept dice visually distinct
- Standard Kniffel rules: 3 rolls per turn, keep any dice between rolls

### Scoresheet
- Player can toggle between compact view (own scores only) and full table view (all players' columns side by side)
- Available categories highlight/glow on the scoresheet when it's time to pick
- Tap directly on the highlighted row to score — no separate modal

### Turn Flow & Timing
- Turn timer configurable by host: 30s / 60s / 90s options
- Timer displayed as visual countdown bar plus numeric seconds remaining
- On timeout: system auto-picks the best available scoring category (forgiving)
- AFK threshold set by host via number input (consecutive inactive rounds before kick)

### Table Chat
- Chat positioned as collapsible bottom drawer — game takes priority on screen
- System messages inline in chat feed (e.g. "Max hat Kniffel gewürfelt!")
- Text-only messages, no emoji reactions
- Spectators can read and send chat messages — Stammtisch atmosphere

### Spectator Mode
- Non-players can watch ongoing games
- Spectators see dice, scores, and chat
- Spectators can participate in chat
- Spectators eligible to join next game round

### Claude's Discretion
- Lobby sorting and filtering behavior
- Exact 3D dice physics implementation and library choice
- Loading states and transition animations
- Sound effects (if any)
- Exact scoresheet typography and spacing
- Error state handling (disconnections mid-turn, etc.)
- Room cleanup timing for empty rooms

</decisions>

<specifics>
## Specific Ideas

- Stammtisch feeling — the social, casual atmosphere of a German game night should come through
- 3D dice are important for immersion — should feel physical and satisfying
- Host having control mirrors the real-life "Gastgeber" role at a Stammtisch
- Vote rematch keeps groups together naturally, like "noch eine Runde?"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-game-engine*
*Context gathered: 2026-02-11*
