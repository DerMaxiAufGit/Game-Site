# Project Research Summary

**Project:** Kniff - Deutsche Spieleseite
**Domain:** Real-time multiplayer web gaming platform (casino/traditional games)
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

Kniff is a real-time multiplayer web gaming platform for classic German games (Kniffel, Texas Hold'em, Blackjack, Roulette) targeting 20-100 concurrent users in an invite-only community. Research shows this domain is well-established with proven technology patterns: Node.js with Socket.IO for real-time communication, PostgreSQL for transactional currency management, Redis for session state, and React with Vite for responsive frontend. The critical success factor is implementing server-authoritative architecture from day one—all game logic, RNG, and currency operations must execute server-side to prevent cheating in betting scenarios.

The recommended approach follows a proven three-layer architecture: WebSocket gateway for real-time connections, server-authoritative game engine with room-based isolation, and dual-storage pattern (Redis for hot state, PostgreSQL for persistence). This avoids premature optimization while maintaining clear upgrade paths. The MVP should focus on core multiplayer mechanics with one game (Kniffel) to validate the architecture before adding betting and additional games.

Key risks center on state synchronization, reconnection handling, and currency integrity. These are mitigated through well-documented patterns: event sourcing for game history, ACID transactions for all currency operations, cryptographic RNG for game outcomes, and comprehensive WebSocket lifecycle management with reconnection recovery. The invite-only model reduces toxicity concerns but requires secure token management. Research confidence is high due to mature documentation, proven patterns at scale, and consistent recommendations across multiple authoritative sources.

## Key Findings

### Recommended Stack

The optimal stack balances proven reliability with 2026 best practices. Node.js 24.x LTS provides the event-driven runtime ideal for 100+ concurrent WebSocket connections. Socket.IO 4.x handles real-time bidirectional communication with automatic reconnection, room management, and fallback to long-polling. Fastify 5.x outperforms Express (9.7x faster) for concurrent API requests during room joins and bet placements. TypeScript 5.9.x adds type safety critical for game logic and currency transactions.

**Core technologies:**
- **Node.js 24.x + Socket.IO 4.x**: Industry standard for multiplayer games, handles WebSocket connections with automatic reconnection, room-based matchmaking essential for lobby system
- **PostgreSQL 18.1**: ACID compliance required for virtual currency transactions, prevents double-spend and race conditions, superior security reputation for casino games
- **Redis 8.x**: Sub-millisecond session management and real-time game state storage, used by Roblox at scale, sorted sets perfect for leaderboards
- **React 19.2 + Vite 7.3**: React 19's Activity component handles tab visibility during games, Vite provides instant HMR, SPA architecture simpler than Next.js for authenticated-only platform
- **Zustand 5.x**: Minimal-boilerplate state management, 40% adoption in 2026, selective subscriptions prevent unnecessary re-renders during real-time updates
- **Prisma 6.x**: Type-safe database access with auto-generated queries, superior migration DX, eliminates SQL injection risks

**Critical requirements:**
- Cryptographic RNG via `crypto.randomInt()` for all game outcomes—never `Math.random()`
- JWT with refresh token pattern for auth (5-10min access token lifetime for quick revocation)
- Docker Compose for deployment (single VPS sufficient for 20-100 users, scales to Docker Swarm/K8s later)

**Source quality:** HIGH—verified via official PostgreSQL 18.1 release notes, Socket.IO documentation, React 19.2 announcement, ecosystem surveys for Zustand adoption.

### Expected Features

Research identified clear table stakes vs. differentiators based on user expectations in the multiplayer gaming domain.

**Must have (table stakes):**
- **User Authentication with admin approval**: Security baseline, required for invite-only model
- **Room/Lobby System**: Industry standard, players expect to browse/create/join game rooms with visible attributes
- **Virtual Currency (1000 starting balance)**: Core to gaming economy, in-memory tracking during sessions
- **Real-time Game State Sync**: Technical requirement, all players must see identical game state
- **Text Chat**: Expected communication method, easier to moderate than voice
- **Disconnect/Reconnection Handling**: Players expect to rejoin after network issues without losing progress or bets
- **Responsive Mobile-First Design**: 2026 table stakes, instant load times expected
- **Admin Controls**: Required for invite-only platform to manage users, moderate behavior

**Should have (competitive differentiators):**
- **German-First UX**: Culturally appropriate game names and UI (Kniffel not Yahtzee), low technical complexity, high cultural value
- **Optional Room Betting**: Adds excitement without forcing gambling, winner-takes-pot model, room creator sets amount (0 allowed)
- **Classic Game Focus**: Four curated games vs. overwhelming library, quality over quantity
- **Invite-Only Community**: Trusted, moderated environment vs. open platform toxicity
- **Transparent Fair Play**: Open game logic and provable RNG for trust-building

**Defer (v2+):**
- Spectator mode (only needed if users request it)
- Tournaments (significant complexity)
- Achievement system (gamification beyond leaderboard)
- Friend system (may be redundant in invite-only community)
- PWA features (offline support, install prompt)

**Rejected as anti-features:**
- Voice chat (moderation nightmare, high bandwidth, amplifies toxicity)
- Blockchain/crypto (regulatory nightmare, breaks game economy)
- AI opponents for multiplayer (defeats social connection purpose)
- Complex ELO ranking (20-100 users too small for meaningful pools)
- Microtransactions/real money (legal minefield, introduces pay-to-win)
- Native mobile apps (3x dev cost, PWA achieves 90% of native experience)

**Source quality:** MEDIUM—based on web search from Unity Lobby, Steam Matchmaking, iGaming 2026 trends, Board Game Arena competitive analysis, verified across multiple gaming platform sources.

### Architecture Approach

The standard architecture for real-time multiplayer games follows a three-layer pattern: API/WebSocket Gateway for connections, service layer for game logic, and dual-storage data layer.

**Major components:**
1. **API/WebSocket Gateway (Socket.IO)**: Single entry point handling HTTP + WebSocket, authentication middleware, rate limiting. Room-based architecture isolates game sessions for horizontal scaling.
2. **Game Engine (Server-Authoritative)**: Validates all player actions server-side, manages game state, handles turn sequences, cryptographic RNG for casino games. Separate modules per game type (Kniffel, Blackjack, Poker, Roulette) with shared base class.
3. **Wallet Service (ACID Transactions)**: Virtual currency changes are atomic database transactions with row-level locking. Prevents race conditions, ensures consistency for betting.
4. **Room Manager (Lifecycle Management)**: Creates/manages game rooms, lobby system, player queuing, handles reconnections with 60s grace period before removal.
5. **Data Layer (Redis + PostgreSQL)**: Redis for hot state (active sessions, room state), PostgreSQL for cold storage (completed games, user data, transaction history). Write-behind pattern for performance.

**Critical patterns:**
- **Server-Authoritative State**: Client sends intents ("I want to roll"), server validates and executes, broadcasts authoritative result. Prevents all client-side cheating.
- **Event Sourcing for Game History**: Store immutable log of all game events, enables replay, debugging, dispute resolution, required for betting games.
- **Room-Based Architecture**: Each game session is isolated with independent state, natural scalability, easy reconnection handling.
- **Redis for Hot + PostgreSQL for Cold**: Active games in-memory (fast), completed games persisted (durable), can rebuild Redis from PostgreSQL on crash.

**Recommended project structure:**
```
kniff/
├── client/                 # React + Vite frontend
│   ├── components/         # UI (game boards, lobby, wallet)
│   ├── services/           # WebSocket client, API calls
│   └── stores/             # Zustand state management
├── server/                 # Node.js backend
│   ├── core/               # Express + Socket.IO setup
│   ├── auth/               # JWT authentication, invite codes
│   ├── games/              # Game engines (Kniffel, Blackjack, etc.)
│   ├── rooms/              # Room manager, lobby, reconnection
│   ├── wallet/             # Virtual currency with ACID transactions
│   └── database/           # PostgreSQL + Redis access
└── shared/                 # TypeScript types, event definitions
```

**Scaling considerations:**
- 0-100 users: Single server (current target)
- 100-1000 users: Add Redis pub/sub for multi-server coordination
- 1000-10000 users: Horizontal scaling with load balancer, read replicas
- 10000+ users: Full microservices (out of scope)

**Source quality:** MEDIUM—based on Gabriel Gambetta's Client-Server Game Architecture, Colyseus documentation, Microsoft Azure multiplayer architecture guide, SDLC Corp casino backend best practices, verified across multiple gaming architecture sources.

### Critical Pitfalls

Research identified nine critical pitfalls that can break the platform if not addressed correctly from the beginning.

1. **Client-Side Trust and Validation Vulnerabilities**: Trusting client-side data for dice rolls, card deals, bet amounts, or currency updates enables trivial cheating. Prevention: Server-authoritative architecture from day one—all critical logic executes server-side. Must be correct in Foundation phase as retrofitting requires complete rewrite.

2. **Insecure Random Number Generation**: Using `Math.random()` or predictable PRNGs allows attackers to predict future outcomes in casino games. Prevention: Cryptographic RNG exclusively (`crypto.randomInt()`), never `Math.random()` for game outcomes. Implement provably fair pattern (client+server seed with HMAC-SHA256) for transparency. Critical in Foundation/RNG Implementation phase.

3. **Race Conditions in Currency Operations**: Concurrent bet requests exploit timing windows to duplicate currency or over-bet balance. Prevention: ACID transactions with row-level locking (`SELECT ... FOR UPDATE`), atomic check-and-deduct operations. Test explicitly with concurrent requests. Critical in Currency System phase.

4. **State Synchronization Divergence**: Client and server states diverge causing visual "pops" where game elements teleport or re-roll. Prevention: For turn-based games (Kniffel, Poker, Blackjack), use server as single source of truth with client as "dumb terminal". Include sequence numbers on all state updates. Address in State Sync phase.

5. **WebSocket Connection Lifecycle Mismanagement**: Dropped connections without reconnection lose player progress. Prevention: Heartbeat/ping-pong every 30s, exponential backoff for reconnection (1s, 2s, 4s, 8s, max 30s), cleanup between attempts, 60s server-side idle timeout. Critical in WebSocket Infrastructure phase.

6. **Reconnection State Recovery Disasters**: Player reconnects but sees corrupted, duplicated, or lost game state. Prevention: Decouple state from WebSocket connection, store authoritative state server-side with game/session ID, validate state integrity before restoration, persist every turn completion. Critical in State Persistence phase.

7. **Lobby/Room State Inconsistency**: Players see rooms that don't exist or are full, stale player counts, AFK players blocking rooms. Prevention: Lobby pagination/filtering, pub/sub for room updates, server-side cleanup (remove empty rooms after 5min, kick AFK after 2min), heartbeat per player. Address in Lobby/Room Management phase.

8. **Timing-Based Cheating in Turn-Based Games**: Players deliberately delay actions to observe opponent behavior before deciding. Prevention: Strict server-side turn timers (30s for Kniffel, 20s for Poker), reject late inputs or auto-play (fold/pass), never trust client timestamps. Address per-game in Game Logic phases.

9. **Weak Invite Token Management**: Predictable, reusable, or non-expiring tokens allow bypassing invite-only restriction. Prevention: Cryptographically random tokens (`crypto.randomBytes(32)`), 7-day expiration, single-use or limited use, hash in database, transmit only via HTTPS, admin revocation interface. Critical in Authentication/Invite System phase.

**Additional concerns:**
- Performance traps: Broadcasting room list to all clients breaks at >20 concurrent rooms (use pagination), no connection pooling breaks at >50 users, no indexing on user_id/game_id breaks at >1000 rows
- Security mistakes: Exposing RNG seed enables pre-computation, storing balance in JWT enables manipulation, no rate limiting enables bot spam
- UX pitfalls: No reconnection feedback causes page refreshes losing state, no turn timer indication creates indefinite waits, no bet confirmation causes accidental losses

**Source quality:** MEDIUM—based on multiple authoritative sources including Gaffer On Games (state sync), Unity Multiplayer docs (reconnection), SDLC Corp (casino backends), Snyk Learn (race conditions), Web Security Academy (authentication), verified across gaming security and anti-cheat documentation.

## Implications for Roadmap

Based on combined research findings, the recommended approach is to build in five phases that follow natural dependencies and minimize risk through iterative validation.

### Phase 1: Foundation & Infrastructure
**Rationale:** Everything depends on auth, WebSocket infrastructure, and data layer. Building these first enables parallel game development and prevents architectural rewrites. This phase addresses the most critical pitfalls (client-side trust, WebSocket lifecycle, reconnection) that must be correct from the beginning.

**Delivers:**
- Database schema (PostgreSQL + Prisma)
- Authentication service with secure invite tokens
- WebSocket gateway (Socket.IO) with connection lifecycle management
- Redis session store
- Room manager skeleton
- Basic admin controls

**Addresses from research:**
- Stack: Node.js, Socket.IO, PostgreSQL, Redis, JWT pattern
- Architecture: API gateway, data layer, service layer skeleton
- Pitfalls: Weak invite tokens (#9), WebSocket lifecycle (#5), reconnection infrastructure (#6)

**Research flag:** SKIP RESEARCH—well-documented patterns, standard authentication and WebSocket setup with official documentation.

### Phase 2: Core Game Engine (Kniffel MVP)
**Rationale:** Validate architecture with simplest game first. Kniffel is turn-based, familiar to German users, has no betting complexity. Proves server-authoritative state, room-based architecture, and state synchronization work correctly before adding currency risk.

**Delivers:**
- Base game classes (abstract Game, TurnBasedGame)
- Kniffel game implementation (server-side)
- Server-authoritative validation
- Cryptographic RNG implementation
- Event sourcing for game history
- Responsive React UI with game board

**Addresses from research:**
- Features: One multiplayer game (table stakes), game state sync, responsive UI
- Stack: React 19 + Vite, Zustand, game logic structure
- Architecture: Game engine component, server-authoritative pattern, event sourcing
- Pitfalls: Client-side trust (#1), insecure RNG (#2), state sync divergence (#4), timing-based cheating (#8)

**Research flag:** SKIP RESEARCH—Kniffel/Yahtzee rules are well-known, turn-based game patterns are standard.

### Phase 3: Virtual Currency & Betting System
**Rationale:** Once core gameplay works, add economic layer. Implementing currency with ACID transactions before building more games ensures all subsequent games inherit correct transaction patterns. Validates optional betting adds engagement.

**Delivers:**
- Wallet service with ACID transactions
- 1000 starting balance per user
- Bet escrow and payout logic
- Balance validation (check before bet)
- Row-level locking for concurrency
- Optional room betting (0 = no betting)
- Transaction audit log

**Addresses from research:**
- Features: Virtual currency system (table stakes), optional room betting (differentiator)
- Architecture: Wallet service component
- Pitfalls: Race conditions in currency (#3)

**Research flag:** SKIP RESEARCH—Database transaction patterns and wallet implementations are well-documented in gaming backends and e-commerce patterns.

### Phase 4: Additional Games (Poker, Blackjack, Roulette)
**Rationale:** Reuses all infrastructure from phases 1-3. Each game is independent and can be built in parallel. Texas Hold'em validates betting with multiplayer interaction, Blackjack/Roulette add solo-vs-house modes.

**Delivers:**
- CasinoGame base class
- Texas Hold'em implementation (validates betting)
- Blackjack implementation (solo vs. house)
- Roulette implementation (solo vs. house)
- Game-specific UI components

**Addresses from research:**
- Features: Classic game focus (4 curated games), solo vs. house mode
- Architecture: Game engine modularity, shared patterns
- Pitfalls: Timing-based cheating per game (#8), cryptographic RNG per game

**Research flag:** NEEDS RESEARCH for Texas Hold'em—complex betting rules (blinds, raises, side pots) may need deeper research during planning. Blackjack and Roulette are standard casino games with well-known rules.

### Phase 5: Polish & Community Features
**Rationale:** Core gameplay and economy work. Now add features that improve retention and experience but aren't essential for launch validation.

**Delivers:**
- Enhanced lobby (pagination, filtering)
- User statistics and leaderboard
- Chat moderation (mute/block/report)
- Multiple theme support (dark/light)
- Enhanced admin tools (room monitoring, ban/timeout)
- Reconnection state recovery hardening
- AFK detection and timeout

**Addresses from research:**
- Features: User statistics (table stakes), chat moderation, multiple themes (differentiators)
- Architecture: Enhanced room manager, lobby optimization
- Pitfalls: Lobby state inconsistency (#7)

**Research flag:** SKIP RESEARCH—UI polish and admin tools follow standard patterns.

### Phase Ordering Rationale

**Dependency-driven order:**
- Authentication must exist before any game can identify players
- WebSocket infrastructure must exist before room management
- Room management must exist before games can be played
- Games must work before adding betting (validate mechanics without currency risk)
- Currency system must work before additional betting games

**Risk-reduction strategy:**
- Build foundation correctly once (Phase 1) to prevent architectural rewrites
- Validate architecture with simplest game (Phase 2) before adding complexity
- Add economic layer after gameplay proven (Phase 3) to isolate currency bugs
- Build additional games after patterns established (Phase 4) for rapid iteration
- Polish after core validated (Phase 5) to avoid premature optimization

**Pitfall avoidance mapping:**
- Critical pitfalls (#1, #2, #5, #6, #9) addressed in Phases 1-2 (foundation)
- Currency pitfall (#3) isolated in Phase 3 with comprehensive testing
- State sync (#4) and timing (#8) validated per-game in Phases 2 and 4
- Lobby issues (#7) deferred to Phase 5 as non-critical for small user base

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Texas Hold'em)**: Complex betting rules with blinds, raises, all-in scenarios, side pots. Poker has many edge cases that may need rule clarification and implementation pattern research.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Authentication, WebSocket, database setup are well-documented with official guides and established patterns.
- **Phase 2 (Kniffel)**: Yahtzee rules are simple and widely known, turn-based patterns are standard in multiplayer gaming.
- **Phase 3 (Currency)**: ACID transaction patterns for virtual wallets are mature in gaming and e-commerce domains.
- **Phase 4 (Blackjack, Roulette)**: Standard casino rules with established implementations, no ambiguity.
- **Phase 5 (Polish)**: UI/UX improvements follow standard web development patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Technologies verified via official documentation (PostgreSQL 18.1 release notes, Socket.IO docs, React 19.2 announcement), current LTS versions confirmed, ecosystem surveys validate adoption (Zustand 40%+). Only infrastructure components rated MEDIUM (Docker versions from web search). |
| Features | MEDIUM | Based on web search of gaming platforms (Unity Lobby, Steam, Board Game Arena), iGaming 2026 trends, community discussions. Table stakes validated across multiple sources. Differentiators based on cultural context (German focus) and competitive analysis. |
| Architecture | MEDIUM | Patterns verified across authoritative sources (Gaffer On Games, Gabriel Gambetta, Microsoft Azure multiplayer guide, SDLC Corp casino backends). Server-authoritative, room-based, and event sourcing patterns are HIGH confidence (industry standard). Specific tech recommendations (Socket.IO vs Colyseus, Fastify vs Express) are MEDIUM confidence. |
| Pitfalls | MEDIUM | Critical pitfalls verified across multiple sources (anti-cheat guides, security documentation, multiplayer architecture). Client-side trust, RNG security, and race conditions are HIGH confidence concerns backed by security research. Reconnection and lobby issues are MEDIUM confidence based on developer community experience and platform documentation. |

**Overall confidence:** HIGH for core technical patterns and stack selection, MEDIUM for feature prioritization and specific implementation details.

### Gaps to Address

**During planning phase:**
- **Texas Hold'em betting complexity**: Research poker betting rules in detail during Phase 4 planning to ensure all edge cases (side pots, all-in calculations, split pots) are covered.
- **Scaling thresholds**: Research identified rough breakpoints (>100 users needs Redis pub/sub, >50 users needs connection pooling) but exact thresholds depend on game complexity and update frequency. Monitor performance in production to determine actual limits.
- **i18n library selection**: Research confirmed German-first UX is a differentiator but didn't validate which i18n library best handles German compound words and regional variations. Evaluate during Phase 1 implementation.

**During implementation:**
- **Socket.IO vs Colyseus trade-off**: Research suggests Colyseus provides more built-in room management but Socket.IO is more widely used. Evaluate during Phase 1 based on team familiarity and room management requirements.
- **Reconnection grace period**: Research suggests 60s timeout, but optimal duration may vary based on user feedback and network conditions in target market (Germany). Make configurable.
- **Turn timer durations**: Research provides general guidance (20-30s) but exact values should be tuned based on user testing in Phase 2.

**Validation needed:**
- Test currency system (Phase 3) extensively with concurrent requests and failure scenarios before declaring production-ready
- Validate cryptographic RNG implementation with third-party review before launch (regulatory consideration for betting games)
- Load test with simulated 100 concurrent users before public beta to verify scaling assumptions

## Sources

### Primary (HIGH confidence)

**Stack research:**
- PostgreSQL 18.1 Release Notes (official)
- Socket.IO v4 Documentation (official)
- React 19.2 Release Announcement (official)
- Node.js LTS Schedule (official)
- Redis 8.x Documentation (official)
- Vite 7.3 Release Notes (official)
- TypeScript 5.9 Release (official)

**Architecture patterns:**
- Client-Server Game Architecture by Gabriel Gambetta
- State Synchronization by Gaffer On Games
- Unity Multiplayer Netcode Documentation (reconnection patterns)
- AccelByte Gaming Services Documentation (wallet patterns)

### Secondary (MEDIUM confidence)

**Features and market research:**
- Unity Lobby Documentation (room management patterns)
- Steam Matchmaking Documentation (matchmaking patterns)
- iGaming 2026 Trends by EE Gaming
- Board Game Arena competitive analysis
- Multiplayer Gaming Trends 2026 by Editorial GE

**Security and pitfalls:**
- Anti-Cheat in Gaming: The Definitive 2026 Player Guide
- Web Security Academy Authentication Vulnerabilities
- Snyk Learn: Race Condition Tutorial
- Building Provably Fair Casino Games article
- RNG Certification and Safety Measures (2025 casino systems)

**Architecture implementation:**
- Building Scalable Multiplayer Games with Azure Web PubSub (Microsoft)
- Best Practices in Casino Game Backend Architecture (SDLC Corp)
- Handling Game State Synchronization in Scalable Casino Games (SDLC Corp)
- How Multiplayer Games Sync State (Medium series by Qing Wei Lim)
- Colyseus Multiplayer Framework (GitHub and docs)

**Reconnection and lifecycle:**
- How to Successfully Create a Reconnect Ability (Getgud.io)
- WebSocket Debugging: Keeping Real-Time Apps Running
- WebSocket Connection Failed Troubleshooting (VideoSDK)
- Multiplayer Game With WebSockets (Medium)

### Tertiary (LOW confidence, needs validation)

**Scaling patterns:**
- WebSockets at Scale: Production Architecture (WebSocket.org)
- The Challenge of 100K Concurrent WebSocket Users (Medium)
- Scaling WebSockets for High-Concurrency Systems (Ably)

**Community discussions:**
- npm trends: Zustand vs Redux adoption
- State Management 2026 surveys (40%+ Zustand adoption)
- Stack Overflow discussions on multiplayer game patterns
- Reddit r/gamedev architecture discussions

---
*Research completed: 2026-02-11*
*Ready for roadmap: yes*
