/**
 * Poker Hand Evaluator TDD Tests
 * Test-first implementation following RED-GREEN-REFACTOR cycle
 */

import { describe, it, expect } from '@jest/globals';
import type { Card } from '../../cards/types';
import {
  evaluateHand,
  compareHands,
  findBestHand,
  getHandName
} from '../hand-evaluator';

describe('Poker Hand Evaluator', () => {
  describe('evaluateHand', () => {
    it('should evaluate a royal flush', () => {
      const royalFlush: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'hearts' },
        { rank: 'J', suit: 'hearts' },
        { rank: '10', suit: 'hearts' }
      ];

      const result = evaluateHand(royalFlush);
      expect(result.rank).toBe(1);
      expect(result.name).toBe('Royal Flush');
    });

    it('should evaluate a straight flush', () => {
      const straightFlush: Card[] = [
        { rank: '9', suit: 'diamonds' },
        { rank: '8', suit: 'diamonds' },
        { rank: '7', suit: 'diamonds' },
        { rank: '6', suit: 'diamonds' },
        { rank: '5', suit: 'diamonds' }
      ];

      const result = evaluateHand(straightFlush);
      expect(result.rank).toBe(2);
      expect(result.name).toBe('Straight Flush');
    });

    it('should evaluate four of a kind (Vierling)', () => {
      const fourOfKind: Card[] = [
        { rank: '7', suit: 'hearts' },
        { rank: '7', suit: 'diamonds' },
        { rank: '7', suit: 'clubs' },
        { rank: '7', suit: 'spades' },
        { rank: 'K', suit: 'hearts' }
      ];

      const result = evaluateHand(fourOfKind);
      expect(result.rank).toBe(3);
      expect(result.name).toBe('Vierling');
    });

    it('should evaluate a full house', () => {
      const fullHouse: Card[] = [
        { rank: 'Q', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
        { rank: '5', suit: 'hearts' },
        { rank: '5', suit: 'spades' }
      ];

      const result = evaluateHand(fullHouse);
      expect(result.rank).toBe(4);
      expect(result.name).toBe('Full House');
    });

    it('should evaluate a flush', () => {
      const flush: Card[] = [
        { rank: 'A', suit: 'clubs' },
        { rank: 'J', suit: 'clubs' },
        { rank: '9', suit: 'clubs' },
        { rank: '6', suit: 'clubs' },
        { rank: '3', suit: 'clubs' }
      ];

      const result = evaluateHand(flush);
      expect(result.rank).toBe(5);
      expect(result.name).toBe('Flush');
    });

    it('should evaluate a straight (Straße)', () => {
      const straight: Card[] = [
        { rank: '9', suit: 'hearts' },
        { rank: '8', suit: 'diamonds' },
        { rank: '7', suit: 'clubs' },
        { rank: '6', suit: 'spades' },
        { rank: '5', suit: 'hearts' }
      ];

      const result = evaluateHand(straight);
      expect(result.rank).toBe(6);
      expect(result.name).toBe('Straße');
    });

    it('should evaluate ace-low straight (wheel)', () => {
      const wheel: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: '2', suit: 'diamonds' },
        { rank: '3', suit: 'clubs' },
        { rank: '4', suit: 'spades' },
        { rank: '5', suit: 'hearts' }
      ];

      const result = evaluateHand(wheel);
      expect(result.rank).toBe(6);
      expect(result.name).toBe('Straße');
    });

    it('should evaluate three of a kind (Drilling)', () => {
      const threeOfKind: Card[] = [
        { rank: '8', suit: 'hearts' },
        { rank: '8', suit: 'diamonds' },
        { rank: '8', suit: 'clubs' },
        { rank: 'K', suit: 'spades' },
        { rank: '2', suit: 'hearts' }
      ];

      const result = evaluateHand(threeOfKind);
      expect(result.rank).toBe(7);
      expect(result.name).toBe('Drilling');
    });

    it('should evaluate two pair (Zwei Paare)', () => {
      const twoPair: Card[] = [
        { rank: 'J', suit: 'hearts' },
        { rank: 'J', suit: 'diamonds' },
        { rank: '4', suit: 'clubs' },
        { rank: '4', suit: 'spades' },
        { rank: '9', suit: 'hearts' }
      ];

      const result = evaluateHand(twoPair);
      expect(result.rank).toBe(8);
      expect(result.name).toBe('Zwei Paare');
    });

    it('should evaluate one pair (Ein Paar)', () => {
      const onePair: Card[] = [
        { rank: '10', suit: 'hearts' },
        { rank: '10', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
        { rank: '7', suit: 'spades' },
        { rank: '3', suit: 'hearts' }
      ];

      const result = evaluateHand(onePair);
      expect(result.rank).toBe(9);
      expect(result.name).toBe('Ein Paar');
    });

    it('should evaluate high card (Höchste Karte)', () => {
      const highCard: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: '9', suit: 'clubs' },
        { rank: '5', suit: 'spades' },
        { rank: '2', suit: 'hearts' }
      ];

      const result = evaluateHand(highCard);
      expect(result.rank).toBe(10);
      expect(result.name).toBe('Höchste Karte');
    });
  });

  describe('compareHands', () => {
    it('should rank royal flush > straight flush', () => {
      const royalFlush: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'hearts' },
        { rank: 'J', suit: 'hearts' },
        { rank: '10', suit: 'hearts' }
      ];

      const straightFlush: Card[] = [
        { rank: '9', suit: 'diamonds' },
        { rank: '8', suit: 'diamonds' },
        { rank: '7', suit: 'diamonds' },
        { rank: '6', suit: 'diamonds' },
        { rank: '5', suit: 'diamonds' }
      ];

      expect(compareHands(royalFlush, straightFlush)).toBe(1);
      expect(compareHands(straightFlush, royalFlush)).toBe(-1);
    });

    it('should rank four of a kind > full house', () => {
      const fourOfKind: Card[] = [
        { rank: '3', suit: 'hearts' },
        { rank: '3', suit: 'diamonds' },
        { rank: '3', suit: 'clubs' },
        { rank: '3', suit: 'spades' },
        { rank: 'K', suit: 'hearts' }
      ];

      const fullHouse: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'K', suit: 'spades' }
      ];

      expect(compareHands(fourOfKind, fullHouse)).toBe(1);
    });

    it('should rank full house > flush', () => {
      const fullHouse: Card[] = [
        { rank: '6', suit: 'hearts' },
        { rank: '6', suit: 'diamonds' },
        { rank: '6', suit: 'clubs' },
        { rank: '4', suit: 'hearts' },
        { rank: '4', suit: 'spades' }
      ];

      const flush: Card[] = [
        { rank: 'A', suit: 'clubs' },
        { rank: 'K', suit: 'clubs' },
        { rank: 'Q', suit: 'clubs' },
        { rank: 'J', suit: 'clubs' },
        { rank: '9', suit: 'clubs' }
      ];

      expect(compareHands(fullHouse, flush)).toBe(1);
    });

    it('should compare same pair hands using kicker', () => {
      const pairWithAceKicker: Card[] = [
        { rank: '5', suit: 'hearts' },
        { rank: '5', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
        { rank: '7', suit: 'spades' },
        { rank: '3', suit: 'hearts' }
      ];

      const pairWithKingKicker: Card[] = [
        { rank: '5', suit: 'clubs' },
        { rank: '5', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: '7', suit: 'diamonds' },
        { rank: '3', suit: 'clubs' }
      ];

      expect(compareHands(pairWithAceKicker, pairWithKingKicker)).toBe(1);
      expect(compareHands(pairWithKingKicker, pairWithAceKicker)).toBe(-1);
    });

    it('should detect tie (exact same hand rank)', () => {
      const hand1: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'hearts' },
        { rank: 'J', suit: 'hearts' },
        { rank: '10', suit: 'hearts' }
      ];

      const hand2: Card[] = [
        { rank: 'A', suit: 'diamonds' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'diamonds' },
        { rank: '10', suit: 'diamonds' }
      ];

      expect(compareHands(hand1, hand2)).toBe(0);
    });
  });

  describe('findBestHand', () => {
    it('should find best 5-card hand from 7 cards (hole + community)', () => {
      const holeCards: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'hearts' }
      ];

      const communityCards: Card[] = [
        { rank: 'Q', suit: 'hearts' },
        { rank: 'J', suit: 'hearts' },
        { rank: '10', suit: 'hearts' },
        { rank: '3', suit: 'diamonds' },
        { rank: '2', suit: 'clubs' }
      ];

      const result = findBestHand(holeCards, communityCards);

      expect(result.rank).toBe(1); // Royal Flush
      expect(result.name).toBe('Royal Flush');
      expect(result.cards).toHaveLength(5);
    });

    it('should select best full house over lower-ranking flush', () => {
      const holeCards: Card[] = [
        { rank: 'Q', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' }
      ];

      const communityCards: Card[] = [
        { rank: 'Q', suit: 'clubs' },
        { rank: '5', suit: 'hearts' },
        { rank: '5', suit: 'spades' },
        { rank: '3', suit: 'hearts' },
        { rank: '2', suit: 'hearts' }
      ];

      const result = findBestHand(holeCards, communityCards);

      expect(result.rank).toBe(4); // Full House
      expect(result.name).toBe('Full House');
    });

    it('should work with exactly 5 cards (no selection needed)', () => {
      const holeCards: Card[] = [
        { rank: '7', suit: 'hearts' },
        { rank: '7', suit: 'diamonds' }
      ];

      const communityCards: Card[] = [
        { rank: '7', suit: 'clubs' },
        { rank: 'K', suit: 'spades' },
        { rank: 'Q', suit: 'hearts' }
      ];

      const result = findBestHand(holeCards, communityCards);

      expect(result.rank).toBe(7); // Three of a kind
      expect(result.name).toBe('Drilling');
    });
  });

  describe('getHandName', () => {
    it('should return German hand names', () => {
      expect(getHandName(1)).toBe('Royal Flush');
      expect(getHandName(2)).toBe('Straight Flush');
      expect(getHandName(3)).toBe('Vierling');
      expect(getHandName(4)).toBe('Full House');
      expect(getHandName(5)).toBe('Flush');
      expect(getHandName(6)).toBe('Straße');
      expect(getHandName(7)).toBe('Drilling');
      expect(getHandName(8)).toBe('Zwei Paare');
      expect(getHandName(9)).toBe('Ein Paar');
      expect(getHandName(10)).toBe('Höchste Karte');
    });
  });
});
