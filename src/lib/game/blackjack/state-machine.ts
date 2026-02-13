/**
 * Blackjack State Machine
 * Pure functional state machine following Kniffel pattern
 * Wraps engine-blackjack for multiplayer orchestration
 */

import type { Card } from '../cards/types';

// ============================================================================
// Types
// ============================================================================

export type BlackjackPhase =
  | 'betting'
  | 'dealing'
  | 'player_turn'
  | 'dealer_turn'
  | 'settlement'
  | 'round_end';

export type HandStatus =
  | 'playing'
  | 'stood'
  | 'busted'
  | 'blackjack'
  | 'surrendered';

export interface PlayerHand {
  cards: Card[];
  bet: number;
  status: HandStatus;
  isDoubled: boolean;
  isSplit: boolean;
}

export interface DealerHand {
  cards: Card[];
  hidden: boolean; // First card face down until dealer turn
}

export interface BlackjackPlayer {
  userId: string;
  displayName: string;
  hands: PlayerHand[];
  currentHandIndex: number;
  bet: number;
  insurance: number;
  isActive: boolean;
  isConnected: boolean;
}

export interface BlackjackSettings {
  deckCount: number;
  turnTimer: number;
  soloHandCount?: number; // For solo mode, up to 3 hands
}

export interface BlackjackGameState {
  phase: BlackjackPhase;
  players: BlackjackPlayer[];
  dealer: DealerHand;
  deck: Card[];
  roundNumber: number;
  settings: BlackjackSettings;
  currentPlayerIndex: number;
}

export type BlackjackAction =
  | { type: 'PLACE_BET'; payload: { amount: number } }
  | { type: 'HIT' }
  | { type: 'STAND' }
  | { type: 'DOUBLE' }
  | { type: 'SPLIT' }
  | { type: 'INSURANCE'; payload: { amount: number } }
  | { type: 'SURRENDER' }
  | { type: 'PLAYER_DISCONNECT'; payload: { userId: string } };

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create initial blackjack state in betting phase
 */
export function createBlackjackState(
  players: Array<{ userId: string; displayName: string }>,
  settings: BlackjackSettings
): BlackjackGameState {
  // TODO: Implement
  throw new Error('Not implemented');
}

/**
 * Apply an action to the game state
 * Returns new state or Error if action is invalid
 */
export function applyBlackjackAction(
  state: BlackjackGameState,
  action: BlackjackAction,
  userId: string
): BlackjackGameState | Error {
  // TODO: Implement
  return new Error('Not implemented');
}
