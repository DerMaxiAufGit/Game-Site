# Phase 2: Core Game Engine (Kniffel MVP) - Research

**Researched:** 2026-02-11
**Domain:** Real-time multiplayer turn-based game with 3D physics, Socket.IO rooms, and server-authoritative state
**Confidence:** MEDIUM-HIGH

## Summary

This phase implements a real-time Kniffel (Yahtzee) multiplayer game engine using Socket.IO for real-time communication, React Three Fiber for 3D dice visualization, and server-authoritative game state management. The architecture follows the state synchronization pattern where the server maintains authoritative game state and broadcasts updates to all clients.

The standard approach uses Socket.IO rooms for game session isolation, crypto.randomInt() for server-side cryptographic dice rolls (SPIEL-07 requirement), and React Three Fiber with physics libraries (Rapier or Cannon-es) for 3D dice animation. State machines manage turn progression, with automatic cleanup for idle players and empty rooms.

Key challenges include preventing state desynchronization across clients, managing 3D resource cleanup to avoid memory leaks, implementing reliable timeout/AFK detection, and ensuring turn-based game logic remains deterministic and cheat-proof through server validation.

**Primary recommendation:** Use server-authoritative state with Socket.IO rooms, React Three Fiber v9 with @react-three/rapier for physics, finite state machines for turn flow, and crypto.randomInt() for dice rolls. Avoid client-side prediction for turn-based games—emit player actions and wait for server validation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| socket.io | 4.8+ | Real-time bidirectional communication | Industry standard for WebSocket rooms, built-in reconnection, connection state recovery (v4.6.0+) |
| @react-three/fiber | 9.x | React renderer for Three.js | Pairs with React 19, declarative 3D scene management, production-ready ecosystem |
| @react-three/drei | Latest | Helper components for R3F | Official helpers: useGLTF.preload, LOD, performance utilities |
| @react-three/rapier | Latest | 3D physics via Rapier (Rust/WASM) | Deterministic physics, 40-50kb, superior to Cannon-es for modern projects |
| three | Latest | 3D graphics engine | Peer dependency of R3F, WebGL renderer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @3d-dice/dice-box | Latest | Dedicated 3D dice roller | Alternative to custom physics—uses BabylonJS + AmmoJS, has Roll20 notation support via dice-parser-interface |
| use-cannon (cannon-es) | Latest | Alternative 3D physics | If Rapier incompatible or simpler physics needed—40-50kb, JavaScript-based |
| crypto (Node.js built-in) | Native | Cryptographic random numbers | Server-side RNG for dice rolls (SPIEL-07 requirement) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Rapier | Cannon-es | Cannon-es is JavaScript-based and simpler, but Rapier is deterministic and more performant via WASM |
| Custom dice physics | @3d-dice/dice-box | dice-box is BabylonJS-based (not Three.js), requires engine switch or separate canvas |
| Socket.IO | Raw WebSockets | Socket.IO provides rooms, reconnection, acknowledgements out-of-box; raw WS requires manual implementation |

**Installation:**
```bash
# Core real-time + 3D stack
npm install socket.io socket.io-client
npm install three @types/three @react-three/fiber @react-three/drei @react-three/rapier

# Alternative physics (if not using Rapier)
npm install @react-three/cannon cannon-es
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── socket/              # Socket.IO client wrapper
│   │   ├── socket.ts        # Socket initialization with auth
│   │   └── hooks.ts         # useSocket, useRoom hooks
│   ├── game/                # Game logic (shared client/server if possible)
│   │   ├── kniffel-rules.ts # Scoring algorithms, validation
│   │   └── state-machine.ts # Turn state machine definitions
│   └── crypto-rng.ts        # Server-side: crypto.randomInt wrapper
├── components/
│   ├── lobby/               # Room browsing, creation
│   ├── game/                # Game UI components
│   │   ├── DiceScene.tsx    # R3F Canvas with dice
│   │   ├── Scoresheet.tsx   # Scoring UI
│   │   ├── TurnTimer.tsx    # Countdown timer
│   │   └── GameChat.tsx     # Chat drawer
│   └── 3d/                  # R3F components
│       ├── Dice.tsx         # Individual die component
│       └── DicePhysics.tsx  # Physics world setup
└── app/
    └── game/
        └── [roomId]/
            └── page.tsx     # Game room page with useSocket
```

### Pattern 1: Server-Authoritative State with Socket.IO Rooms
**What:** Server maintains single source of truth for game state, validates all actions, broadcasts state updates to room members.

**When to use:** All multiplayer games where fairness matters (prevents cheating, ensures consistency).

**Example:**
```typescript
// Server: server.js or app/api/socket/route.ts
io.on('connection', (socket) => {
  // Auth from Phase 1: JWT session cookie verified in middleware
  const userId = socket.data.userId;

  socket.on('game:roll-dice', async ({ roomId, keptDice }) => {
    const room = await getRoom(roomId);

    // Server-authoritative validation
    if (!validateTurn(room, userId)) {
      socket.emit('game:error', { message: 'Not your turn' });
      return;
    }

    // Server-side cryptographic RNG (SPIEL-07)
    const { randomInt } = await import('node:crypto');
    const newDice = Array(5 - keptDice.length)
      .fill(0)
      .map(() => randomInt(1, 7)); // 1-6 inclusive

    // Update authoritative state
    const updatedState = {
      ...room.gameState,
      dice: [...keptDice, ...newDice],
      rollsRemaining: room.gameState.rollsRemaining - 1
    };

    await updateRoomState(roomId, updatedState);

    // Broadcast to all players in room
    io.to(roomId).emit('game:state-update', updatedState);
  });
});
```

### Pattern 2: State Machine for Turn Flow
**What:** Finite state machine manages game phases (waiting, playing, scoring, ended) and turn transitions.

**When to use:** Turn-based games with complex state transitions and validation rules.

**Example:**
```typescript
// lib/game/state-machine.ts
type GameState =
  | { phase: 'waiting'; players: Player[] }
  | { phase: 'playing'; currentPlayer: string; rollsRemaining: number }
  | { phase: 'scoring'; currentPlayer: string; availableCategories: string[] }
  | { phase: 'ended'; winner: string; scores: Record<string, number> };

function transition(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case 'waiting':
      if (event.type === 'START_GAME' && state.players.length >= 2) {
        return {
          phase: 'playing',
          currentPlayer: state.players[0].id,
          rollsRemaining: 3
        };
      }
      return state;

    case 'playing':
      if (event.type === 'ROLL_DICE') {
        return { ...state, rollsRemaining: state.rollsRemaining - 1 };
      }
      if (event.type === 'CHOOSE_CATEGORY') {
        return { phase: 'scoring', currentPlayer: state.currentPlayer, availableCategories: [] };
      }
      return state;

    // ... more transitions
  }
}
```

### Pattern 3: Socket.IO Room Lifecycle Management
**What:** Automatic room creation, player join/leave handling, empty room cleanup, idle timeout detection.

**When to use:** All multi-room game applications requiring session isolation.

**Example:**
```typescript
// Server: Room lifecycle
socket.on('room:create', async ({ settings }) => {
  const roomId = generateRoomId();
  const room = {
    id: roomId,
    host: socket.data.userId,
    players: [socket.data.userId],
    settings,
    createdAt: Date.now(),
    gameState: { phase: 'waiting' }
  };

  await saveRoom(room);
  socket.join(roomId);
  socket.emit('room:created', { roomId });
});

socket.on('disconnect', async () => {
  const rooms = await getRoomsByUser(socket.data.userId);

  for (const room of rooms) {
    // Remove player from room
    room.players = room.players.filter(id => id !== socket.data.userId);

    // Broadcast player left
    io.to(room.id).emit('room:player-left', { userId: socket.data.userId });

    // Cleanup empty rooms
    if (room.players.length === 0) {
      await deleteRoom(room.id);
      // Rooms are left automatically upon disconnection
    } else {
      await updateRoom(room);
    }
  }
});

// Idle timeout pattern (runs periodically)
setInterval(async () => {
  const rooms = await getAllActiveRooms();
  const now = Date.now();

  for (const room of rooms) {
    // Check AFK players
    for (const player of room.players) {
      const lastActivity = room.gameState.lastActivity[player.id];
      if (now - lastActivity > room.settings.afkTimeout) {
        // Kick player
        io.to(room.id).emit('game:player-kicked', { userId: player.id, reason: 'AFK' });
        room.players = room.players.filter(p => p.id !== player.id);
      }
    }

    // Cleanup empty rooms (RAUM-05)
    if (room.players.length === 0) {
      await deleteRoom(room.id);
    }
  }
}, 30000); // Check every 30s
```

### Pattern 4: React Three Fiber with Physics
**What:** Declarative 3D scene using R3F Canvas with Rapier physics for dice rolling animation.

**When to use:** Interactive 3D objects requiring realistic physics simulation.

**Example:**
```typescript
// components/3d/DiceScene.tsx
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';

export function DiceScene({ diceValues, onRollComplete }) {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
      <Physics gravity={[0, -30, 0]}>
        {/* Dice table */}
        <RigidBody type="fixed">
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[10, 0.5, 10]} />
            <meshStandardMaterial color="green" />
          </mesh>
        </RigidBody>

        {/* Dice */}
        {diceValues.map((value, i) => (
          <Dice
            key={i}
            position={[i * 1.5 - 3, 5, 0]}
            value={value}
            onRest={() => i === 4 && onRollComplete()}
          />
        ))}
      </Physics>

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
    </Canvas>
  );
}

// components/3d/Dice.tsx
import { RigidBody } from '@react-three/rapier';
import { useRef } from 'react';

function Dice({ position, value, onRest }) {
  const rigidBody = useRef();

  // Apply random rotation and impulse for tumbling effect
  useEffect(() => {
    if (rigidBody.current) {
      rigidBody.current.applyImpulse({
        x: Math.random() * 4 - 2,
        y: 2,
        z: Math.random() * 4 - 2
      }, true);

      rigidBody.current.applyTorqueImpulse({
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5,
        z: Math.random() * 10 - 5
      }, true);
    }
  }, []);

  return (
    <RigidBody
      ref={rigidBody}
      position={position}
      colliders="cuboid"
      onSleep={onRest}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </mesh>
      {/* Add dice face textures/numbers based on value */}
    </RigidBody>
  );
}
```

### Pattern 5: Timer Management with useRef
**What:** Turn timer using useRef to store interval ID, proper cleanup in useEffect to prevent memory leaks.

**When to use:** Countdown timers, polling, any React component needing intervals.

**Example:**
```typescript
// components/game/TurnTimer.tsx
import { useState, useEffect, useRef } from 'react';

export function TurnTimer({ duration, onTimeout }) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start countdown
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or duration change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, onTimeout]);

  const percentage = (timeRemaining / duration) * 100;

  return (
    <div className="timer">
      <div className="progress-bar" style={{ width: `${percentage}%` }} />
      <span>{timeRemaining}s</span>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Client-predicted dice rolls:** Dice results MUST come from server using crypto.randomInt() for fairness and SPIEL-07 compliance. Never generate dice client-side then "sync" to server.
- **Direct state mutation in Socket.IO handlers:** Always validate, then emit new state. Don't trust client-reported state values.
- **Forgetting 3D resource disposal:** Memory leaks from undisposed geometries, materials, textures. Use cleanup in useEffect.
- **Storing game state in socket.data:** Use database (Prisma) for persistence. socket.data is ephemeral and doesn't survive reconnection.
- **Emitting without acknowledgements for critical actions:** Use socket.timeout().emitWithAck() for important player actions to detect failures.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Yahtzee/Kniffel scoring algorithm | Custom category matching logic | Open-source Yahtzee scoring libraries (e.g., GitHub: markusdutschke/yahtzee) | Handles edge cases: upper section bonus (+35 if sum >= 63), Kniffel bonus (50), small/large straight detection, full house validation |
| Cryptographic random numbers | Math.random() or custom PRNG | Node.js crypto.randomInt(min, max) | Math.random() is not cryptographically secure (SPIEL-07 violation), crypto module uses OS-level CSPRNG (/dev/urandom, CryptoGenRandom) |
| Socket.IO reconnection | Manual reconnect logic | Socket.IO built-in auto-reconnect + connection state recovery | Built-in exponential backoff, session restoration (rooms, data, missed packets) since v4.6.0 |
| 3D dice physics | Custom collision detection | @react-three/rapier or use-cannon | Physics engines handle: collision response, friction, restitution, sleeping bodies, constraint solving |
| Turn timer with pause/resume | setInterval with manual state | Custom useInterval hook or react-use library | Handles cleanup, stale closures, dynamic delays |
| Room cleanup scheduling | setInterval loops checking all rooms | Event-driven cleanup: disconnect handler + periodic sweep | O(active_rooms) complexity scales poorly; disconnect events trigger targeted cleanup |

**Key insight:** Server-authoritative multiplayer games have many edge cases (disconnections during turns, simultaneous actions, cheating attempts). Use battle-tested libraries for state management, physics, and networking. Custom solutions miss corner cases that cause desyncs, exploits, or poor UX.

## Common Pitfalls

### Pitfall 1: State Desynchronization Across Clients
**What goes wrong:** Clients display different game states (dice values, scores, whose turn) despite being in same room. Causes frustration, accusations of cheating, unplayable games.

**Why it happens:**
- Clients applying game logic locally before server validation
- Race conditions when multiple clients emit simultaneously
- Non-deterministic logic (e.g., client-side random, floating point errors)
- Missed Socket.IO events due to disconnection

**How to avoid:**
- Server is single source of truth—never apply game logic client-side except for optimistic UI (and rollback on server rejection)
- Use state machine on server to enforce legal transitions
- Broadcast full state or deltas to io.to(roomId) after every mutation
- Use connection state recovery (maxDisconnectionDuration: 2 * 60 * 1000) to recover missed packets

**Warning signs:**
- Players reporting "I see different scores than opponent"
- Turn doesn't advance for some players
- Dice show different values on different screens

### Pitfall 2: Three.js Memory Leaks in Long-Running Games
**What goes wrong:** Browser memory usage grows over time, eventually causing tab crashes or severe lag after ~10-15 minutes of gameplay.

**Why it happens:**
- Three.js doesn't auto-garbage-collect geometries, materials, textures
- R3F components creating new meshes on every re-render
- Forgetting to dispose resources when dice re-roll or components unmount
- Event listeners not cleaned up

**How to avoid:**
- Call geometry.dispose(), material.dispose(), texture.dispose() in useEffect cleanup
- Reuse geometries/materials across dice instances (React.memo, useMemo)
- Monitor renderer.info.memory during development—if geometries/textures grow, you have a leak
- For GLTF models: call texture.source.data.close?.() for ImageBitmap textures

**Warning signs:**
- Browser DevTools shows increasing MB usage in Performance monitor
- FPS degrades after multiple dice rolls
- renderer.info.memory.geometries or textures count keeps increasing

### Pitfall 3: Socket.IO Room State Not Persisting Across Reconnections
**What goes wrong:** Player disconnects briefly (WiFi blip, phone lock), reconnects, but is no longer in game room. Game appears "lost."

**Why it happens:**
- Connection state recovery doesn't restore room membership automatically—it restores rooms only if server re-joins the socket
- Client doesn't store roomId in persistent state (localStorage, URL param)
- Server doesn't handle reconnection with same user ID rejoining room

**How to avoid:**
- Store roomId in URL path: /game/[roomId] so page refresh re-joins
- On reconnection, client emits 'room:rejoin' with roomId from URL
- Server checks if userId was previously in room, re-adds to room, sends current state
- Use connection state recovery to receive missed events during disconnection

**Warning signs:**
- Player refreshes page and game is gone
- After WiFi reconnect, lobby shows instead of game
- Socket.data.rooms is empty after reconnect

### Pitfall 4: AFK Detection False Positives
**What goes wrong:** Active players get kicked for "AFK" despite interacting with game (viewing scores, chatting).

**Why it happens:**
- Only tracking specific actions as "activity" (e.g., roll dice) but not passive actions (chat, toggle view)
- Timer reset logic buggy or not updating lastActivity on all valid interactions
- Timeout threshold too aggressive (e.g., 30s for a turn-based game where thinking is allowed)

**How to avoid:**
- Track lastActivity timestamp on ANY player interaction: dice roll, category selection, chat message, ready-up
- Set reasonable AFK thresholds: host-configurable, default to 2-3 consecutive turns missed
- Emit 'heartbeat' from client every 15-30s to signal presence even if not acting
- Show warning before kicking: "You'll be kicked in 30s for inactivity"

**Warning signs:**
- Players complaining about unfair kicks
- Active players removed during opponent's long turn
- Chat participants getting AFK-kicked

### Pitfall 5: Turn Timer Desync and Auto-Play Issues
**What goes wrong:** Turn timer shows different times on different clients. Auto-play triggers for player who already acted. Timer "freezes" or counts negative.

**Why it happens:**
- Client-side timers started at different times (network delay)
- Server doesn't broadcast "turn started at" timestamp—clients guess
- Auto-play logic runs client-side, leading to duplicate submissions
- Timer state not reset on turn change events

**How to avoid:**
- Server broadcasts { event: 'turn:start', player: userId, startedAt: Date.now(), duration: 60000 }
- Clients calculate remaining = duration - (Date.now() - startedAt) every tick
- Auto-play logic ONLY on server—when timer expires server-side, emit auto-selected category
- Clients display warning at 10s remaining: "Auto-play in 10s"

**Warning signs:**
- Timers show "65s" or negative numbers
- Player submits move but also gets auto-played
- Some clients show timer running, others show 0

### Pitfall 6: Dice Animation Blocking Game Flow
**What goes wrong:** Dice rolling animation takes 5-10 seconds. Players can't proceed until animation completes. Impatient players click repeatedly, causing bugs.

**Why it happens:**
- Waiting for onSleep physics callback before enabling UI
- Animation duration not configurable or skippable
- Server sends next state immediately, but client still rendering previous roll

**How to avoid:**
- Decouple game logic from animation: server sends dice values immediately, client animates in background
- Allow "Skip animation" button after 2s—sets dice to final values instantly
- Use animation duration of 2-3s max for satisfying feel without tedium
- Disable further actions during animation, show loading state

**Warning signs:**
- Players report "game feels slow"
- Repeated clicks on "Roll" button during animation
- Animation sometimes skips or shows wrong final values

## Code Examples

Verified patterns from official sources:

### Server-Side Cryptographic Dice Roll
```typescript
// Source: https://nodejs.org/api/crypto.html
import { randomInt } from 'node:crypto';

// Roll 5 dice (1-6 inclusive)
function rollDice(count: number = 5): number[] {
  return Array(count)
    .fill(0)
    .map(() => randomInt(1, 7)); // max is exclusive, so 7 gives 1-6
}

// Example: [3, 6, 2, 5, 1]
const dice = rollDice(5);
```

### Socket.IO Emit with Acknowledgement and Timeout
```typescript
// Source: https://socket.io/docs/v4/emitting-events/
// Client
socket.timeout(5000).emit('game:choose-category',
  { category: 'threeOfKind', dice: [3, 3, 3, 2, 1] },
  (err, response) => {
    if (err) {
      // Server didn't respond within 5s
      console.error('Server timeout');
    } else {
      console.log('Score applied:', response.newScore);
    }
  }
);

// Server
socket.on('game:choose-category', (data, callback) => {
  const score = calculateScore(data.category, data.dice);
  callback({ newScore: score }); // Acknowledges client
});
```

### R3F Resource Cleanup
```typescript
// Source: https://r3f.docs.pmnd.rs/ + https://www.utsubo.com/blog/threejs-best-practices-100-tips
import { useEffect, useMemo } from 'react';
import { BoxGeometry, MeshStandardMaterial } from 'three';

function Dice({ value }) {
  // Reuse geometry/material across instances
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new MeshStandardMaterial({ color: 'white' }), []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh geometry={geometry} material={material}>
      {/* Dice face textures */}
    </mesh>
  );
}
```

### Connection State Recovery Configuration
```typescript
// Source: https://socket.io/docs/v4/connection-state-recovery
// Server
const io = new Server(httpServer, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true, // Skip auth middlewares on recovery
  }
});

// Client handler
socket.on('connect', () => {
  if (socket.recovered) {
    // Connection was successfully recovered
    console.log('Reconnected and recovered state');
  } else {
    // New or failed recovery—request full state
    socket.emit('game:request-state', { roomId });
  }
});
```

### State Machine Transition with Validation
```typescript
// Source: Pattern from https://gameprogrammingpatterns.com/state.html
type GamePhase = 'waiting' | 'rolling' | 'scoring' | 'ended';

interface GameState {
  phase: GamePhase;
  currentPlayer: string;
  rollsRemaining: number;
  dice: number[];
}

function applyAction(state: GameState, action: GameAction, userId: string): GameState | Error {
  // Validation
  if (state.currentPlayer !== userId) {
    return new Error('Not your turn');
  }

  switch (action.type) {
    case 'ROLL_DICE':
      if (state.phase !== 'rolling' && state.phase !== 'waiting') {
        return new Error('Cannot roll in current phase');
      }
      if (state.rollsRemaining <= 0) {
        return new Error('No rolls remaining');
      }

      return {
        ...state,
        phase: 'rolling',
        dice: rollDice(5 - action.keptDice.length).concat(action.keptDice),
        rollsRemaining: state.rollsRemaining - 1
      };

    case 'CHOOSE_CATEGORY':
      if (state.phase !== 'rolling' && state.phase !== 'scoring') {
        return new Error('Must roll dice first');
      }

      const score = calculateScore(action.category, state.dice);
      return {
        ...state,
        phase: 'scoring',
        // Update scores, advance to next player, etc.
      };

    default:
      return new Error('Unknown action');
  }
}
```

### Kniffel Scoring Algorithm
```typescript
// Source: Rules from https://en.wikipedia.org/wiki/Yahtzee + https://www.gamedesire.com/game/yatzy/help/gameplay
// Note: This is illustrative—use tested open-source implementation for production

function calculateScore(category: string, dice: number[]): number {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // counts[1] = count of 1s, etc.
  dice.forEach(d => counts[d]++);

  switch (category) {
    // Upper section: sum of matching dice
    case 'ones': return counts[1] * 1;
    case 'twos': return counts[2] * 2;
    case 'threes': return counts[3] * 3;
    case 'fours': return counts[4] * 4;
    case 'fives': return counts[5] * 5;
    case 'sixes': return counts[6] * 6;

    // Lower section
    case 'threeOfKind':
      return counts.some(c => c >= 3) ? dice.reduce((a, b) => a + b, 0) : 0;

    case 'fourOfKind':
      return counts.some(c => c >= 4) ? dice.reduce((a, b) => a + b, 0) : 0;

    case 'fullHouse':
      const hasThree = counts.some(c => c === 3);
      const hasTwo = counts.some(c => c === 2);
      return (hasThree && hasTwo) ? 25 : 0;

    case 'smallStraight':
      // 1-2-3-4, 2-3-4-5, or 3-4-5-6
      const patterns = [[1,2,3,4], [2,3,4,5], [3,4,5,6]];
      return patterns.some(p => p.every(n => counts[n] > 0)) ? 30 : 0;

    case 'largeStraight':
      // 1-2-3-4-5 or 2-3-4-5-6
      const largePatterns = [[1,2,3,4,5], [2,3,4,5,6]];
      return largePatterns.some(p => p.every(n => counts[n] > 0)) ? 40 : 0;

    case 'kniffel': // Yahtzee
      return counts.some(c => c === 5) ? 50 : 0;

    case 'chance':
      return dice.reduce((a, b) => a + b, 0);

    default:
      return 0;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Socket.IO v3 manual state sync | Socket.IO v4.6+ connection state recovery | Feb 2023 | Auto-restores rooms, data, missed packets on reconnection—reduces custom sync code |
| React Three Fiber v8 | React Three Fiber v9 | 2025 | Pairs with React 19, requires major version match (v8→React 18, v9→React 19) |
| Cannon.js (unmaintained) | cannon-es or @react-three/rapier | 2020 (cannon-es fork) | Cannon.js deprecated, cannon-es is maintained fork; Rapier is WASM-based and deterministic |
| Math.random() for dice | crypto.randomInt() | Node.js v14.10.0 (2020) | Cryptographically secure RNG required for fair gameplay (SPIEL-07) |
| Manual WebSocket room management | Socket.IO rooms API | Always existed but best practices evolved | Rooms auto-cleanup on disconnect, built-in broadcast targeting |

**Deprecated/outdated:**
- **Cannon.js**: Original library no longer maintained, use cannon-es fork or migrate to Rapier
- **React Three Fiber v8 with React 19**: Version mismatch causes errors, must use R3F v9 for React 19
- **socket.io-redis v6**: Use @socket.io/redis-adapter v8+ for Socket.IO v4 compatibility
- **Client-side game state as source of truth**: Modern multiplayer games use server-authoritative to prevent cheating

## Open Questions

Things that couldn't be fully resolved:

1. **3D Dice Library Choice: Custom Physics vs. @3d-dice/dice-box**
   - What we know: dice-box is feature-rich (Roll20 notation, pre-built models) but uses BabylonJS not Three.js; custom physics with Rapier integrates cleanly with R3F stack
   - What's unclear: Performance comparison, effort to build custom dice models vs. using dice-box's assets
   - Recommendation: Start with custom R3F + Rapier implementation for stack consistency. If dice modeling effort is too high, evaluate dice-box in separate canvas/iframe

2. **Optimal AFK Threshold Configuration**
   - What we know: Host can configure via number input (consecutive inactive rounds); too low = false positives, too high = dead games
   - What's unclear: What's a good default? Should it be rounds (3 turns) or time (5 minutes)?
   - Recommendation: Default to 3 consecutive turns missed OR 5 minutes total inactivity, whichever comes first. A/B test in beta.

3. **Spectator State Synchronization Performance**
   - What we know: Spectators see game state and chat; if 50 spectators join a room, broadcasting every dice roll to 50+ sockets could be expensive
   - What's unclear: Does Socket.IO throttle/batch broadcasts efficiently? Should spectators be in separate "spectator room" with rate-limited updates?
   - Recommendation: Start with single room (players + spectators), monitor socket.io server metrics. If >20 spectators causes lag, split into player room + spectator room with 1s throttled state updates.

4. **Auto-Play AI Algorithm Complexity**
   - What we know: On timeout, server picks "best available scoring category"
   - What's unclear: How sophisticated should this be? Simple heuristic (pick highest score) or optimal strategy (considers future turns, upper section bonus)?
   - Recommendation: Use simple greedy algorithm (pick category yielding highest immediate score) for forgiving UX. Document that optimal play would require Monte Carlo simulation (out of scope for MVP).

5. **Prisma Pulse for Real-Time Room Updates**
   - What we know: Prisma Pulse (CDC) can stream DB changes to clients in real-time
   - What's unclear: Is this needed for Phase 2, or is Socket.IO room broadcasting sufficient? Pulse adds complexity and cost.
   - Recommendation: NOT needed for Phase 2. Socket.IO handles real-time updates within active game sessions. Pulse relevant for Phase 4+ (live lobby updates, leaderboards, notifications).

## Sources

### Primary (HIGH confidence)
- Node.js Crypto API - https://nodejs.org/api/crypto.html - crypto.randomInt() for CSPRNG dice rolls
- Socket.IO v4 Documentation - https://socket.io/docs/v4/rooms/ - Room management, broadcasting, lifecycle
- Socket.IO Connection State Recovery - https://socket.io/docs/v4/connection-state-recovery - Reconnection handling
- Socket.IO Emitting Events - https://socket.io/docs/v4/emitting-events/ - Acknowledgements, timeouts, best practices
- React Three Fiber Introduction - https://r3f.docs.pmnd.rs/getting-started/introduction - Installation, versioning, React pairing

### Secondary (MEDIUM confidence)
- Codrops Dice Roller Tutorial (2023) - https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/ - Three.js + cannon-es dice physics patterns
- 100 Three.js Performance Tips (2026) - https://www.utsubo.com/blog/threejs-best-practices-100-tips - Memory management, disposal, optimization
- Gabriel Gambetta Client-Server Architecture - https://www.gabrielgambetta.com/client-server-game-architecture.html - Server-authoritative patterns, client prediction
- State Machines: Game Programming Patterns - https://gameprogrammingpatterns.com/state.html - Finite state machine pattern for game logic
- Yahtzee Wikipedia - https://en.wikipedia.org/wiki/Yahtzee - Official Kniffel/Yahtzee rules and scoring
- Patterns.dev Compound Components - https://www.patterns.dev/react/compound-pattern/ - React UI patterns for collapsible/drawer

### Tertiary (LOW confidence - WebSearch only, marked for validation)
- Rapier vs Cannon-es comparison (GitHub discussion, Three.js Journey course) - No single authoritative benchmark, multiple sources indicate Rapier is newer, deterministic, and WASM-based
- @3d-dice/dice-box npm page - https://www.npmjs.com/package/@3d-dice/dice-box - BabylonJS-based dice roller, not verified in production Three.js environment
- Turn-based game state machine tutorials (GameDev.net, Medium) - General patterns but not specific to Socket.IO or Node.js backend

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Socket.IO, R3F, crypto module verified from official docs; Rapier vs Cannon-es based on multiple credible sources
- Architecture: HIGH - Socket.IO patterns from official docs, state machine from authoritative game programming patterns, R3F from official docs
- Pitfalls: MEDIUM - Based on real-world issues from GitHub issues, Stack Overflow, and multiplayer game development articles; not all verified in production Kniffel context
- Code examples: HIGH - Direct from official documentation (Node.js, Socket.IO, R3F) or adapted from authoritative tutorials
- Kniffel scoring: MEDIUM - Rules from Wikipedia + game design sites, but illustrative code not production-tested

**Research date:** 2026-02-11
**Valid until:** ~2026-03-11 (30 days - ecosystem is relatively stable, but R3F/Three.js updates frequently)

**Notes:**
- Phase 1 Socket.IO foundation (JWT auth, reconnection) already in place—leverage existing patterns
- CONTEXT.md locked decision: 3D dice with physics (must implement, not optional)
- SPIEL-07 requirement: Server-side cryptographic RNG (crypto.randomInt) is non-negotiable
- Spectator mode, vote rematch, AFK detection are novel features—less established patterns, may require iteration
