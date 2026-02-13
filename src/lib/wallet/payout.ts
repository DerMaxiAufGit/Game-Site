/**
 * Payout Calculator
 *
 * Pure functions for calculating prize distribution from pot using configurable ratios.
 * Uses integer arithmetic throughout to avoid floating point issues.
 */

export type FinalRanking = {
  position: number
  userIds: string[]
}

export type PayoutRatio = {
  position: number
  percentage: number
}

/**
 * Validate that payout ratios sum to 100 and positions are sequential starting at 1
 */
export function validatePayoutRatios(ratios: PayoutRatio[]): boolean {
  if (ratios.length === 0) return false

  // Check sum equals 100
  const sum = ratios.reduce((acc, ratio) => acc + ratio.percentage, 0)
  if (sum !== 100) return false

  // Check positions are sequential starting at 1
  const sortedRatios = [...ratios].sort((a, b) => a.position - b.position)
  for (let i = 0; i < sortedRatios.length; i++) {
    if (sortedRatios[i].position !== i + 1) return false
  }

  return true
}

/**
 * Calculate payouts from pot using rankings and payout ratios.
 *
 * Rules:
 * - Each position gets its percentage of the pot
 * - Tied players split their position's prize evenly
 * - Odd remainders go to the first player in the tie
 * - If only one player finishes, they get the entire pot
 * - Unclaimed positions (no players) don't distribute
 */
export function calculatePayouts(
  totalPot: number,
  rankings: FinalRanking[],
  ratios: PayoutRatio[]
): Map<string, number> {
  const payouts = new Map<string, number>()

  // Handle empty rankings
  if (rankings.length === 0) {
    return payouts
  }

  // Special case: only one finisher gets entire pot
  const totalFinishers = rankings.reduce((sum, r) => sum + r.userIds.length, 0)
  if (totalFinishers === 1 && rankings.length === 1) {
    payouts.set(rankings[0].userIds[0], totalPot)
    return payouts
  }

  // Create a map of position to ratio
  const ratioMap = new Map(ratios.map((r) => [r.position, r.percentage]))

  // Determine which positions are filled and sum their percentages
  const filledPositions = rankings.filter(r => ratioMap.has(r.position))
  const activePercentageSum = filledPositions.reduce(
    (sum, r) => sum + (ratioMap.get(r.position) ?? 0), 0
  )

  // If no active percentages, distribute nothing
  if (activePercentageSum === 0) return payouts

  // Calculate payout for each ranking, rescaling percentages so filled
  // positions absorb any unclaimed share (e.g. no 3rd place in a 2-player game)
  let distributed = 0
  const sortedFilledPositions = [...filledPositions].sort(
    (a, b) => a.position - b.position
  )

  for (const ranking of sortedFilledPositions) {
    const ratio = ratioMap.get(ranking.position)
    if (ratio === undefined) continue

    // Rescale: this position's share of the total active percentage
    const positionPrize = Math.floor((totalPot * ratio) / activePercentageSum)

    // Split evenly among tied players
    const numPlayers = ranking.userIds.length
    const baseAmount = Math.floor(positionPrize / numPlayers)
    const remainder = positionPrize % numPlayers

    // Distribute to players
    ranking.userIds.forEach((userId, index) => {
      // Give remainder to first player
      const amount = index === 0 ? baseAmount + remainder : baseAmount
      payouts.set(userId, amount)
      distributed += amount
    })
  }

  // Assign any leftover coins from rounding to 1st place
  const leftover = totalPot - distributed
  if (leftover > 0 && sortedFilledPositions.length > 0) {
    const firstPlaceUserId = sortedFilledPositions[0].userIds[0]
    payouts.set(firstPlaceUserId, (payouts.get(firstPlaceUserId) ?? 0) + leftover)
  }

  return payouts
}
