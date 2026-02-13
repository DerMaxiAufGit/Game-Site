/**
 * Engine Blackjack Wrapper
 * Thin wrapper around engine-blackjack npm library
 * Adapts single-player engine to our multiplayer card types
 */

import type { Card } from '../cards/types';

// Re-export what we need from engine-blackjack
// This will wrap the library with our project conventions

/**
 * Create a blackjack engine instance with project config
 */
export function createBlackjackEngine(config: {
  decks: number;
  standOnSoft17: boolean;
  double: 'any' | 'none' | '9or10' | '9or10or11' | '9thru15';
  split: boolean;
  doubleAfterSplit: boolean;
  surrender: boolean;
  insurance: boolean;
}) {
  // TODO: Implement
  throw new Error('Not implemented');
}

/**
 * Get available actions for a hand given dealer's up card
 */
export function getAvailableActions(
  hand: Card[],
  dealerUpCard: Card
): {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  insurance: boolean;
  surrender: boolean;
} {
  // TODO: Implement
  throw new Error('Not implemented');
}

/**
 * Calculate hand value (returns both high and low for Aces)
 */
export function calculateHandValue(cards: Card[]): { hi: number; lo: number } {
  // TODO: Implement
  throw new Error('Not implemented');
}

/**
 * Check if hand is blackjack (Ace + 10-value card)
 */
export function isBlackjack(cards: Card[]): boolean {
  // TODO: Implement
  return false;
}

/**
 * Check if hand is busted (>21)
 */
export function isBusted(cards: Card[]): boolean {
  // TODO: Implement
  return false;
}
