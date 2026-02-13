/**
 * Poker Pot Calculator with Side Pot Support
 * Pure functions following project conventions
 */

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface PlayerContribution {
  userId: string;
  amount: number;
  isFolded: boolean;
}

/**
 * Calculate side pots from player contributions
 *
 * Algorithm (from RESEARCH.md Pattern 4):
 * 1. Sort players by bet amount ascending
 * 2. For each distinct bet level, create a pot
 * 3. Each pot's amount = (bet - previous bet level) × number of players who bet at least that much
 * 4. Folded players contribute to pots but are NOT eligible to win
 * 5. Each pot tracks eligible (non-folded) players
 *
 * @param contributions - Array of player contributions with fold status
 * @returns Array of pots with amounts and eligible player IDs
 */
export function calculateSidePots(contributions: PlayerContribution[]): Pot[] {
  // Filter out zero contributions
  const validContributions = contributions.filter(c => c.amount > 0);

  if (validContributions.length === 0) {
    return [];
  }

  // Sort by amount ascending
  const sorted = [...validContributions].sort((a, b) => a.amount - b.amount);

  const pots: Pot[] = [];
  let previousLevel = 0;

  // Get unique bet levels
  const uniqueLevels = Array.from(new Set(sorted.map(c => c.amount))).sort((a, b) => a - b);

  for (const level of uniqueLevels) {
    // Players who bet at least this level
    const playersAtLevel = validContributions.filter(c => c.amount >= level);

    // Amount contributed at this level (difference from previous level)
    const amountPerPlayer = level - previousLevel;
    const potAmount = amountPerPlayer * playersAtLevel.length;

    // Only non-folded players are eligible
    const eligiblePlayerIds = playersAtLevel
      .filter(c => !c.isFolded)
      .map(c => c.userId);

    pots.push({
      amount: potAmount,
      eligiblePlayerIds
    });

    previousLevel = level;
  }

  return pots;
}

/**
 * Distribute pots to winners based on hand rankings
 *
 * For each pot:
 * 1. Find the best hand among eligible players
 * 2. If tie, split evenly (remainder to first in tie)
 * 3. Return total winnings per player
 *
 * @param pots - Array of pots with eligible players
 * @param handRankings - Map of userId to hand ranking value (higher is better)
 * @returns Map of userId to total winnings
 */
export function distributePots(pots: Pot[], handRankings: Map<string, number>): Map<string, number> {
  const winnings = new Map<string, number>();

  for (const pot of pots) {
    const { amount, eligiblePlayerIds } = pot;

    if (eligiblePlayerIds.length === 0) {
      // No eligible players, pot stays (shouldn't happen in practice)
      continue;
    }

    if (eligiblePlayerIds.length === 1) {
      // Only one eligible player, they win automatically
      const winnerId = eligiblePlayerIds[0];
      winnings.set(winnerId, (winnings.get(winnerId) || 0) + amount);
      continue;
    }

    // Find best hand among eligible players
    let bestRanking = -Infinity;
    for (const playerId of eligiblePlayerIds) {
      const ranking = handRankings.get(playerId);
      if (ranking !== undefined && ranking > bestRanking) {
        bestRanking = ranking;
      }
    }

    // Find all players with best ranking (handles ties)
    const winners = eligiblePlayerIds.filter(playerId => {
      const ranking = handRankings.get(playerId);
      return ranking === bestRanking;
    });

    // Split pot among winners
    const sharePerWinner = Math.floor(amount / winners.length);
    const remainder = amount % winners.length;

    for (let i = 0; i < winners.length; i++) {
      const winnerId = winners[i];
      const share = sharePerWinner + (i === 0 ? remainder : 0); // First winner gets remainder
      winnings.set(winnerId, (winnings.get(winnerId) || 0) + share);
    }
  }

  return winnings;
}
