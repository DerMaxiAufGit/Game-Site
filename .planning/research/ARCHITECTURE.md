# Architecture Research

**Domain:** Real-time multiplayer web gaming platform
**Researched:** 2026-02-11
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Browser)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Game   │  │  Lobby   │  │  Wallet  │  │   Auth   │        │
│  │   UI     │  │   UI     │  │   UI     │  │   UI     │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                          │                                       │
│                   WebSocket Client                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                      (WebSocket)
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    API/WEBSOCKET GATEWAY                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express + WebSocket Server (Socket.IO or Colyseus)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴────────┐  ┌───────┴────────┐  ┌──────┴─────────┐
│  GAME ENGINE   │  │  MATCHMAKING   │  │  AUTH SERVICE  │
│                │  │                │  │                │
│ - Game Logic   │  │ - Room Mgmt    │  │ - Invite Codes │
│ - State Mgmt   │  │ - Lobby        │  │ - Sessions     │
│ - Turn Handling│  │ - Queue        │  │ - Admin Check  │
│ - RNG/House    │  │ - Reconnect    │  │                │
└───────┬────────┘  └───────┬────────┘  └──────┬─────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    SERVICE LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Wallet     │  │   Game       │  │   Event      │          │
│  │   Service    │  │   History    │  │   Logger     │          │
│  │              │  │   Service    │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
┌─────────┴──────────────────┴──────────────────┴─────────────────┐
│                     DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  PostgreSQL │  │    Redis    │  │   File      │             │
│  │             │  │             │  │   Storage   │             │
│  │ - Users     │  │ - Sessions  │  │ - Game Logs │             │
│  │ - Wallets   │  │ - Room State│  │ - Analytics │             │
│  │ - History   │  │ - Lobby Data│  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **API/WebSocket Gateway** | Single entry point, handles HTTP + WebSocket connections, authentication middleware, rate limiting | Express.js with Socket.IO or Colyseus for room management |
| **Game Engine** | Server-authoritative game logic, validates all player actions, manages game state, handles turn sequences, RNG for casino games | Separate modules per game type (Kniffel, Blackjack, Poker, Roulette) with shared base class |
| **Matchmaking Service** | Creates/manages game rooms, lobby system, player queuing, handles reconnections, room lifecycle | Room-based architecture with Redis for state persistence |
| **Auth Service** | Invite-only authentication, admin privilege checks, session management | JWT tokens + Redis session store |
| **Wallet Service** | Virtual currency transactions (ACID), balance validation, bet handling, payout processing | PostgreSQL with row-level locking for concurrency |
| **Game History Service** | Records all game events, provides replay data, analytics logging | PostgreSQL for persistent storage, file storage for detailed event streams |
| **Event Logger** | Audit trail, debugging, analytics pipeline | Structured logging to files, optional streaming to analytics platform |

## Recommended Project Structure

```
kniff/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # UI components (game boards, lobby, wallet)
│   │   ├── services/       # WebSocket client, API calls
│   │   ├── stores/         # Client-side state management
│   │   ├── games/          # Game-specific rendering logic
│   │   └── theme/          # Theme system (multiple selectable themes)
│   └── public/
│
├── server/                 # Backend application
│   ├── src/
│   │   ├── core/           # Core server setup
│   │   │   ├── app.ts      # Express app initialization
│   │   │   ├── server.ts   # HTTP + WebSocket server
│   │   │   └── config.ts   # Environment config
│   │   │
│   │   ├── auth/           # Authentication
│   │   │   ├── middleware.ts
│   │   │   ├── inviteCodes.ts
│   │   │   └── sessions.ts
│   │   │
│   │   ├── games/          # Game engine implementations
│   │   │   ├── base/       # Base game classes
│   │   │   │   ├── Game.ts           # Abstract base class
│   │   │   │   ├── TurnBasedGame.ts
│   │   │   │   └── CasinoGame.ts
│   │   │   ├── kniffel/    # Kniffel/Yahtzee implementation
│   │   │   ├── blackjack/  # Blackjack implementation
│   │   │   ├── poker/      # Texas Hold'em implementation
│   │   │   └── roulette/   # Roulette implementation
│   │   │
│   │   ├── rooms/          # Room & matchmaking
│   │   │   ├── RoomManager.ts
│   │   │   ├── Lobby.ts
│   │   │   ├── Room.ts
│   │   │   └── reconnection.ts
│   │   │
│   │   ├── wallet/         # Virtual currency system
│   │   │   ├── WalletService.ts
│   │   │   ├── transactions.ts
│   │   │   └── betting.ts
│   │   │
│   │   ├── services/       # Supporting services
│   │   │   ├── history.ts
│   │   │   └── logger.ts
│   │   │
│   │   ├── database/       # Data access layer
│   │   │   ├── postgres.ts
│   │   │   ├── redis.ts
│   │   │   └── models/     # Database models/schemas
│   │   │
│   │   └── websocket/      # WebSocket handlers
│   │       ├── handlers/   # Event handlers
│   │       └── events.ts   # Event definitions
│   │
│   └── tests/
│
├── shared/                 # Shared code (types, constants)
│   ├── types/              # TypeScript interfaces
│   ├── events/             # WebSocket event definitions
│   └── constants/          # Game rules, config constants
│
└── package.json
```

### Structure Rationale

- **games/base/:** Abstract classes enforce consistent API across game types. TurnBasedGame handles turn sequences, CasinoGame adds house/RNG logic.
- **shared/:** TypeScript types shared between client and server prevent desync. Events and game constants must match exactly.
- **rooms/:** Room-based architecture isolates game sessions. Each room is independent, making horizontal scaling straightforward (one server per room).
- **wallet/:** Isolated service with clear boundaries. All currency changes go through this layer, ensuring transactional integrity.
- **websocket/handlers/:** Event-driven architecture. Each handler is a pure function (event → state change), making testing and debugging easier.

## Architectural Patterns

### Pattern 1: Server-Authoritative State with Client Prediction

**What:** Server is the single source of truth for game state. Clients send inputs (actions), not state changes. Server validates, updates state, broadcasts to all clients. For responsive feel, clients can predict outcome and reconcile when server responds.

**When to use:** All multiplayer games to prevent cheating. Critical for games with betting/currency.

**Trade-offs:**
- **Pros:** Cheat-proof, consistent state, easier to reason about
- **Cons:** Requires RTT (round-trip time) for validation, needs client prediction for smooth UX

**Example:**
```typescript
// Client sends action
socket.emit('player:action', {
  type: 'ROLL_DICE',
  roomId: 'room-123'
});

// Server validates and updates
function handlePlayerAction(socket, action) {
  const room = roomManager.getRoom(action.roomId);
  const player = room.getPlayer(socket.id);

  // Server validates
  if (!room.isPlayerTurn(player)) {
    socket.emit('error', { message: 'Not your turn' });
    return;
  }

  // Server executes
  const result = room.game.rollDice();
  room.game.applyResult(player, result);

  // Broadcast new state to all clients
  room.broadcast('game:state', room.game.getState());
}

// Client receives authoritative state
socket.on('game:state', (newState) => {
  // Replace local state with server state
  gameStore.setState(newState);
});
```

### Pattern 2: Room-Based Architecture

**What:** Each game session is a "room" with isolated state. Players join rooms, rooms have lifecycle (waiting → playing → finished). Rooms are independent units that can be distributed across servers.

**When to use:** Multiplayer games with discrete sessions (not persistent MMO worlds). Perfect for turn-based games, card games, matchmaking-based games.

**Trade-offs:**
- **Pros:** Natural scalability (distribute rooms across servers), isolation prevents cross-game bugs, easy reconnection handling
- **Cons:** Players in different rooms can't interact, requires lobby/matchmaking layer

**Example:**
```typescript
class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(gameType: string, config: RoomConfig): Room {
    const room = new Room(gameType, config);
    this.rooms.set(room.id, room);

    // Persist room state to Redis for reconnection
    redis.hset('rooms', room.id, JSON.stringify(room.serialize()));

    return room;
  }

  joinRoom(roomId: string, player: Player): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.isFull()) throw new Error('Room is full');

    room.addPlayer(player);

    // If room is ready, start game
    if (room.isReady()) {
      room.startGame();
    }
  }

  handleDisconnect(playerId: string): void {
    const room = this.findRoomByPlayer(playerId);
    if (room) {
      room.markPlayerDisconnected(playerId);

      // Give player 60 seconds to reconnect before removing
      setTimeout(() => {
        if (!room.isPlayerConnected(playerId)) {
          room.removePlayer(playerId);
        }
      }, 60000);
    }
  }
}
```

### Pattern 3: Event Sourcing for Game History

**What:** Store all game events (actions) as immutable log. Game state can be reconstructed by replaying events. Enables replay, debugging, dispute resolution, analytics.

**When to use:** Games with betting/currency (audit trail), competitive games (anti-cheat), any game where you want replay functionality.

**Trade-offs:**
- **Pros:** Complete audit trail, easy debugging, can replay any game, supports time-travel debugging
- **Cons:** Storage overhead, need to handle schema changes carefully, replay can be slow for long games

**Example:**
```typescript
interface GameEvent {
  id: string;
  roomId: string;
  timestamp: number;
  type: string;
  playerId: string;
  data: any;
}

class GameHistory {
  async recordEvent(event: GameEvent): Promise<void> {
    // Append-only log
    await db.query(
      'INSERT INTO game_events (id, room_id, timestamp, type, player_id, data) VALUES ($1, $2, $3, $4, $5, $6)',
      [event.id, event.roomId, event.timestamp, event.type, event.playerId, event.data]
    );
  }

  async replayGame(roomId: string): Promise<GameState> {
    const events = await db.query(
      'SELECT * FROM game_events WHERE room_id = $1 ORDER BY timestamp ASC',
      [roomId]
    );

    // Reconstruct game state by replaying events
    const game = new Game();
    for (const event of events.rows) {
      game.applyEvent(event);
    }

    return game.getState();
  }
}
```

### Pattern 4: Wallet Service with ACID Transactions

**What:** Virtual currency changes are atomic database transactions. Balance checks, bet deduction, payout happen in single transaction. Prevents race conditions, ensures consistency.

**When to use:** Any game with virtual currency, especially betting. Critical for maintaining user trust.

**Trade-offs:**
- **Pros:** Impossible to lose currency to bugs, prevents race conditions, easy to audit
- **Cons:** Database becomes bottleneck under high load, requires careful transaction design

**Example:**
```typescript
class WalletService {
  async placeBet(userId: string, amount: number, gameId: string): Promise<boolean> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Lock row for update
      const result = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      const currentBalance = result.rows[0].balance;

      if (currentBalance < amount) {
        await client.query('ROLLBACK');
        return false;
      }

      // Deduct bet amount
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
        [amount, userId]
      );

      // Record transaction
      await client.query(
        'INSERT INTO transactions (user_id, type, amount, game_id, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [userId, 'BET', -amount, gameId, Date.now()]
      );

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async payout(userId: string, amount: number, gameId: string): Promise<void> {
    // Similar transaction for payouts
    await db.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
      [amount, userId]
    );

    await db.query(
      'INSERT INTO transactions (user_id, type, amount, game_id, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'PAYOUT', amount, gameId, Date.now()]
    );
  }
}
```

### Pattern 5: Redis for Hot State, Postgres for Cold Storage

**What:** Active game rooms and sessions live in Redis (fast, in-memory). Completed games, user data, transaction history in PostgreSQL (durable, queryable). Redis acts as cache + session store.

**When to use:** All real-time multiplayer games. Balance performance (Redis) with durability (PostgreSQL).

**Trade-offs:**
- **Pros:** Fast reads/writes for active games, persistent storage for important data, can rebuild Redis from Postgres on crash
- **Cons:** Dual storage adds complexity, need sync strategy, Redis memory limits

**Example:**
```typescript
class RoomState {
  async saveToRedis(room: Room): Promise<void> {
    // Store active room state in Redis (expires after 24h)
    await redis.setex(
      `room:${room.id}`,
      86400, // 24 hours
      JSON.stringify(room.serialize())
    );

    // Also store player connections
    await redis.sadd(
      `room:${room.id}:players`,
      ...room.players.map(p => p.id)
    );
  }

  async onGameComplete(room: Room): Promise<void> {
    // Move to Postgres for permanent storage
    await db.query(
      'INSERT INTO completed_games (room_id, game_type, players, final_state, started_at, completed_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [room.id, room.gameType, JSON.stringify(room.players), JSON.stringify(room.getFinalState()), room.startedAt, Date.now()]
    );

    // Clean up Redis
    await redis.del(`room:${room.id}`);
    await redis.del(`room:${room.id}:players`);
  }

  async restoreRoom(roomId: string): Promise<Room | null> {
    // Try Redis first (hot path)
    const cached = await redis.get(`room:${roomId}`);
    if (cached) {
      return Room.deserialize(JSON.parse(cached));
    }

    // Fall back to Postgres (cold path, reconnection after restart)
    const result = await db.query(
      'SELECT * FROM completed_games WHERE room_id = $1',
      [roomId]
    );

    if (result.rows.length === 0) return null;
    return Room.fromDatabase(result.rows[0]);
  }
}
```

## Data Flow

### Request Flow (Player Action)

```
[User clicks "Roll Dice"]
    ↓
[Client] sends WebSocket event: { type: 'ROLL_DICE', roomId: 'xyz' }
    ↓
[WebSocket Gateway] receives event, authenticates session
    ↓
[Room Handler] finds room by ID, validates player's turn
    ↓
[Game Engine] executes roll, updates game state
    ↓ (if betting game)
[Wallet Service] updates balance (database transaction)
    ↓
[Game History] records event to database
    ↓
[Room Handler] broadcasts new state to all players in room
    ↓
[Clients] receive state update, re-render UI
```

### Matchmaking Flow

```
[User clicks "Find Game"]
    ↓
[Client] sends: { type: 'JOIN_LOBBY', gameType: 'kniffel' }
    ↓
[Matchmaking Service] adds player to lobby queue
    ↓
[Check if enough players for new room]
    ├─ YES: Create new room, move players from queue to room
    │   ↓
    │   [Room Manager] creates room, initializes game
    │   ↓
    │   [Broadcast to players]: { type: 'GAME_START', roomId, players }
    │   ↓
    │   [Game begins]
    │
    └─ NO: Keep player in queue, send queue position update
        ↓
        [Broadcast]: { type: 'QUEUE_UPDATE', position: 3, waitTime: '~30s' }
```

### Reconnection Flow

```
[Player disconnects mid-game]
    ↓
[WebSocket Gateway] detects disconnect
    ↓
[Room Manager] marks player as disconnected, starts 60s timer
    ↓
[Broadcast to other players]: { type: 'PLAYER_DISCONNECTED', playerId }
    ↓
    ├─ Player reconnects within 60s:
    │   ↓
    │   [Auth Service] validates session token
    │   ↓
    │   [Room Manager] finds player's active room (from Redis)
    │   ↓
    │   [Send full state to reconnected player]
    │   ↓
    │   [Broadcast to others]: { type: 'PLAYER_RECONNECTED', playerId }
    │
    └─ Player doesn't reconnect:
        ↓
        [Room Manager] removes player from room
        ↓
        [Game Logic] handles player removal (end game or continue with bots)
```

### State Synchronization Pattern

```
Server State (Source of Truth)
    ↓ (every state change)
[Broadcast via WebSocket] → All Connected Clients
    ↓
Client State (Replica)

User Input → Client
    ↓ (optimistic update - optional)
Client predicts outcome, updates UI immediately
    ↓ (send action to server)
Server validates, updates authoritative state
    ↓ (broadcast result)
Client receives authoritative state
    ↓
Client reconciles: predicted state == server state?
    ├─ YES: Do nothing (prediction was correct)
    └─ NO: Replace prediction with server state (rollback)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 users** | Single Node.js server with Redis and PostgreSQL. WebSocket connections directly to server. Rooms managed in-memory with Redis persistence. |
| **100-1,000 users** | Add Redis Pub/Sub for multi-server WebSocket coordination. Use sticky sessions (socket.io-redis adapter) to route players to same server for duration of game. Separate database connections from game server (connection pooling). |
| **1,000-10,000 users** | Horizontal scaling: Multiple game servers behind load balancer. Redis Cluster for distributed state. Read replicas for PostgreSQL. Separate lobby server from game servers. CDN for static assets. |
| **10,000+ users** | Full microservices: Separate services for auth, matchmaking, game logic, wallet. Message queue (RabbitMQ/Kafka) for inter-service communication. Sharded databases. Geographic distribution (regional servers for low latency). |

### Scaling Priorities

1. **First bottleneck: WebSocket connections per server**
   - Symptom: Slow connections, timeouts, high memory usage
   - Fix: Add more servers with load balancer, use Redis Pub/Sub to coordinate across servers
   - Target: 500-2000 concurrent connections per Node.js server (depends on game complexity)

2. **Second bottleneck: Database writes (wallet transactions, game events)**
   - Symptom: Slow transaction commits, wallet updates lag, event log write queue builds up
   - Fix: Connection pooling (pgBouncer), batch event writes, read replicas for queries, consider write-optimized storage for event log
   - Target: <10ms average transaction time

3. **Third bottleneck: Redis memory (room state)**
   - Symptom: Redis evictions, rooms disappearing, reconnection failures
   - Fix: Redis Cluster for horizontal scaling, aggressive room cleanup after games end, move completed games to PostgreSQL faster
   - Target: Keep only active rooms (playing or waiting) in Redis

For Kniff (20-100 concurrent users), start with **single server** architecture. Only consider scaling when approaching 100+ concurrent users or 500+ rooms.

## Anti-Patterns

### Anti-Pattern 1: Client-Authoritative State

**What people do:** Trust the client to report game state changes. Client sends "I rolled a 6" and server just broadcasts it to others.

**Why it's wrong:** Trivial to cheat. Player can modify client code to send "I rolled all 6s" every time. For games with betting, this is catastrophic.

**Do this instead:** Server-authoritative state. Client sends "I want to roll" (intent), server generates random number, validates against game rules, then broadcasts result. Server is the only source of truth.

```typescript
// WRONG - Client authoritative
socket.on('dice:rolled', (diceValues) => {
  // Trusting client to send honest dice values
  room.updatePlayerDice(playerId, diceValues);
});

// CORRECT - Server authoritative
socket.on('dice:roll', () => {
  const diceValues = generateRandomDice(5);
  room.updatePlayerDice(playerId, diceValues);
  room.broadcast('dice:result', { playerId, diceValues });
});
```

### Anti-Pattern 2: Polling for Updates

**What people do:** Clients repeatedly HTTP GET /game-state every second to check for changes.

**Why it's wrong:** Wastes bandwidth, adds latency (up to 1s delay between events), server CPU spent processing redundant requests, doesn't scale.

**Do this instead:** WebSocket bidirectional communication. Server pushes updates to clients immediately when state changes. Clients only send when they have actions.

```typescript
// WRONG - Polling
setInterval(() => {
  fetch(`/api/game/${roomId}/state`)
    .then(res => res.json())
    .then(state => updateUI(state));
}, 1000);

// CORRECT - WebSocket push
socket.on('game:state', (state) => {
  updateUI(state);
});
```

### Anti-Pattern 3: Global Mutable State

**What people do:** Store all game rooms in global variable, directly mutate shared state from different handlers.

**Why it's wrong:** Race conditions, hard to debug, breaks when scaling to multiple servers, impossible to test in isolation.

**Do this instead:** Room Manager class with clear encapsulation. Each room is isolated. Use Redis for shared state across servers.

```typescript
// WRONG - Global state
const allRooms = {}; // Global mutable object

socket.on('player:action', (action) => {
  allRooms[action.roomId].gameState.score += 10; // Direct mutation
});

// CORRECT - Encapsulated state
class RoomManager {
  private rooms = new Map<string, Room>();

  applyPlayerAction(roomId: string, playerId: string, action: Action) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    // Room handles its own state changes
    room.applyAction(playerId, action);
  }
}
```

### Anti-Pattern 4: Synchronous Database Calls in Game Loop

**What people do:** Call `await db.query()` directly in event handler for every action, blocking WebSocket processing.

**Why it's wrong:** Database latency (5-50ms) blocks event processing. If 10 players act simultaneously, requests queue up. Game feels laggy.

**Do this instead:** Write-behind pattern. Update in-memory state immediately, queue database write asynchronously. Batch writes when possible. Use Redis for hot data.

```typescript
// WRONG - Blocking database call
socket.on('player:action', async (action) => {
  await db.query('UPDATE game_state SET score = score + 10 WHERE room_id = $1', [roomId]);
  room.broadcast('state:update', newState);
});

// CORRECT - Write-behind pattern
socket.on('player:action', (action) => {
  // Update in-memory immediately
  room.updateState(action);
  room.broadcast('state:update', room.getState());

  // Queue database write asynchronously
  dbWriteQueue.enqueue(() => {
    db.query('UPDATE game_state SET score = $1 WHERE room_id = $2', [room.state.score, roomId]);
  });
});
```

### Anti-Pattern 5: Reinventing the Wheel (Custom WebSocket Protocol)

**What people do:** Build custom binary protocol for WebSocket messages, custom room management, custom state sync logic.

**Why it's wrong:** Months of development time, subtle bugs, no community support, hard to onboard new developers.

**Do this instead:** Use battle-tested libraries. Socket.IO for basic games, Colyseus for room-based games with automatic state sync. Focus on game logic, not infrastructure.

```typescript
// WRONG - Custom protocol
socket.on('message', (buffer) => {
  const opcode = buffer.readUInt8(0);
  const roomId = buffer.readUInt32BE(1);
  // ... hundreds of lines of parsing logic
});

// CORRECT - Use Socket.IO or Colyseus
// Socket.IO
socket.emit('player:action', { type: 'ROLL_DICE', roomId });

// Colyseus (even better for room-based games)
room.onMessage('player:action', (client, message) => {
  // Colyseus handles room state sync automatically
  this.state.players[client.sessionId].score += 10;
});
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **PostgreSQL** | Connection pooling via pg pool, prepared statements | Use transactions for wallet operations, consider read replicas for reporting |
| **Redis** | redis npm package, separate connections for pub/sub vs. data | Use for sessions, room state, lobby queues. Configure eviction policy (allkeys-lru) |
| **WebSocket (Socket.IO)** | Socket.io-redis adapter for multi-server | Enables broadcasting across multiple servers, mandatory for horizontal scaling |
| **Theme Assets (CDN)** | Serve from CDN, fetch manifest on load | Multiple theme support requires lazy loading, bundle per theme to reduce initial load |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client ↔ API Gateway** | WebSocket (Socket.IO events) | Single persistent connection per client, heartbeat every 30s to detect disconnects |
| **API Gateway ↔ Game Engine** | Direct function calls (same process) | For 20-100 users, no need for separate services. Keep in same Node.js process |
| **Game Engine ↔ Wallet Service** | Direct function calls with async/await | Wallet service can be separate module but same process. Extract to microservice only if scaling beyond 1000 users |
| **Any Service ↔ Redis** | Redis client library | All services share Redis instance. Use key prefixes (`room:`, `session:`, `wallet:`) to namespace data |
| **Any Service ↔ PostgreSQL** | Shared connection pool | Max 20 connections in pool for small deployment. Each query gets connection from pool, returns it when done |

## Build Order Implications

Based on the architecture, recommended build order:

### Phase 1: Foundation
**Build:** Database schema, auth service, basic WebSocket gateway, room manager skeleton

**Why first:** Everything depends on these. Can't build games without rooms, can't test without auth, can't connect without WebSocket.

**Dependencies:** None

### Phase 2: Core Game Engine
**Build:** Base game classes, first game implementation (Kniffel - simplest), server-authoritative validation

**Why second:** Proves the architecture works. Kniffel is turn-based with no betting, simplest to implement.

**Dependencies:** Phase 1 (needs rooms to run games in)

### Phase 3: Wallet System
**Build:** Virtual currency, transactions, betting integration into games

**Why third:** Only needed once games work. Adding betting is an enhancement to existing game loop.

**Dependencies:** Phase 2 (needs working games to add betting to)

### Phase 4: Additional Games
**Build:** Blackjack, Poker, Roulette (build in parallel if desired)

**Why fourth:** Reuses all infrastructure from Phase 1-3. Each game is independent.

**Dependencies:** Phase 3 (casino games need wallet for betting)

### Phase 5: Polish & Features
**Build:** Reconnection, game history/replay, admin panel, themes, analytics

**Why last:** Nice-to-have features. Core gameplay works without them.

**Dependencies:** All previous phases (builds on complete system)

## Technology Stack Recommendation

Based on research for this architecture:

**WebSocket Framework:** **Colyseus** over Socket.IO for room-based games
- Why: Automatic state synchronization, built-in matchmaking, room lifecycle management
- Colyseus is purpose-built for multiplayer games, Socket.IO requires more manual work
- **Confidence:** HIGH (official docs, widespread use in web games)

**Database:** **PostgreSQL** for persistence, **Redis** for sessions/room state
- Why: PostgreSQL provides ACID transactions for wallet, Redis provides fast access for active games
- Standard pattern for real-time games with persistent data
- **Confidence:** HIGH (industry standard, verified in multiple sources)

**Auth:** **JWT tokens** stored in Redis sessions
- Why: Stateless auth with server-side session revocation capability
- Invite-only requires admin to generate tokens, Redis stores active sessions
- **Confidence:** HIGH (standard pattern)

**State Management:** Server-authoritative with event sourcing for game history
- Why: Prevents cheating, enables replay/debugging, required for betting games
- **Confidence:** HIGH (verified across multiple game architecture sources)

## Sources

**Architecture Patterns:**
- [Client-Server Game Architecture - Gabriel Gambetta](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [Mastering Multiplayer Game Architecture - Getgud.io](https://www.getgud.io/blog/mastering-multiplayer-game-architecture-choosing-the-right-approach/)
- [Building Scalable Multiplayer Games with Azure Web PubSub - Microsoft](https://techcommunity.microsoft.com/blog/appsonazureblog/building-scalable-cost-effective-real-time-multiplayer-games-with-azure-web-pubs/4483584)

**Room-Based Architecture:**
- [Colyseus - Multiplayer Framework for Node.js (GitHub)](https://github.com/colyseus/colyseus)
- [Design a Simple Real-Time Matchmaking Service - Medium](https://yashh21.medium.com/designing-a-simple-real-time-matchmaking-service-architecture-implementation-96e10f095ce1)
- [Scalable WebSocket Architecture - Hathora](https://blog.hathora.dev/scalable-websocket-architecture/)

**Casino/Betting Architecture:**
- [Best Practices in Casino Game Backend Architecture - SDLC Corp](https://sdlccorp.com/post/best-practices-in-casino-game-backend-architecture/)
- [Building the Backend of Online Casino Platforms - ALX Africa](https://www.alxafrica.com/building-the-backend-of-luck-how-online-casino-platforms-handle-real-time-gameplay/)

**Virtual Currency/Wallet:**
- [Building a Serverless Wallet Service for In-Game Currency - AWS](https://aws.amazon.com/blogs/architecture/building-a-serverless-wallet-service-for-in-game-currency/)
- [Introduction to Wallets - AccelByte Documentation](https://docs.accelbyte.io/gaming-services/services/monetization/wallets/)

**State Synchronization:**
- [How Multiplayer Games Sync Their State - Medium](https://medium.com/@qingweilim/how-do-multiplayer-game-sync-their-state-part-2-d746fa303950)
- [Game Networking Fundamentals 2025 - Generalist Programmer](https://generalistprogrammer.com/tutorials/game-networking-fundamentals-complete-multiplayer-guide-2025)

**Turn-Based Games:**
- [Networking of a Turn-Based Game - Longwelwind](https://longwelwind.net/blog/networking-turn-based-game/)
- [Turn-Based Game Architecture - Outscal](https://outscal.com/blog/turn-based-game-architecture)

**Technology Comparison:**
- [Socket.IO vs Colyseus - npm trends](https://npmtrends.com/colyseus-vs-socket.io)
- [Colyseus Documentation - uWebSockets.js](https://docs.colyseus.io/server/transport/uwebsockets)

**Anti-Patterns:**
- [Server Architecture: A Noobs Guide - Game Developer](https://www.gamedeveloper.com/programming/server-architecture-a-noobs-guide)
- [Anti-Patterns in Software Architecture - IT Architecture Insights](https://www.itar.pro/anti-patterns-in-software-architecture/)

---
*Architecture research for: Kniff (German gaming platform)*
*Researched: 2026-02-11*
*Confidence: MEDIUM - Based on web search of current best practices, verified across multiple sources. Core patterns (server-authoritative, room-based, WebSocket) are HIGH confidence. Specific tech recommendations (Colyseus over Socket.IO) are MEDIUM confidence (requires validation with official docs).*
