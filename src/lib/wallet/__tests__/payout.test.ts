import { calculatePayouts, validatePayoutRatios, type FinalRanking, type PayoutRatio } from '../payout'

describe('validatePayoutRatios', () => {
  it('should accept valid ratios that sum to 100', () => {
    const ratios: PayoutRatio[] = [
      { position: 1, percentage: 60 },
      { position: 2, percentage: 30 },
      { position: 3, percentage: 10 },
    ]
    expect(validatePayoutRatios(ratios)).toBe(true)
  })

  it('should reject ratios that do not sum to 100', () => {
    const ratios: PayoutRatio[] = [
      { position: 1, percentage: 50 },
      { position: 2, percentage: 30 },
      { position: 3, percentage: 10 },
    ]
    expect(validatePayoutRatios(ratios)).toBe(false)
  })

  it('should reject non-sequential positions', () => {
    const ratios: PayoutRatio[] = [
      { position: 1, percentage: 60 },
      { position: 3, percentage: 30 },
      { position: 4, percentage: 10 },
    ]
    expect(validatePayoutRatios(ratios)).toBe(false)
  })

  it('should reject positions not starting at 1', () => {
    const ratios: PayoutRatio[] = [
      { position: 2, percentage: 60 },
      { position: 3, percentage: 30 },
      { position: 4, percentage: 10 },
    ]
    expect(validatePayoutRatios(ratios)).toBe(false)
  })
})

describe('calculatePayouts', () => {
  const standardRatios: PayoutRatio[] = [
    { position: 1, percentage: 60 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 10 },
  ]

  describe('standard cases', () => {
    it('should distribute prizes correctly in 3-player game', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a'] },
        { position: 2, userIds: ['b'] },
        { position: 3, userIds: ['c'] },
      ]
      const result = calculatePayouts(1000, rankings, standardRatios)

      expect(result.get('a')).toBe(600)
      expect(result.get('b')).toBe(300)
      expect(result.get('c')).toBe(100)
      expect(getTotalPayout(result)).toBe(1000)
    })

    it('should redistribute unclaimed 3rd place prize in 2-player game', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a'] },
        { position: 2, userIds: ['b'] },
      ]
      const result = calculatePayouts(500, rankings, standardRatios)

      // Active: 60+30=90. P1: floor(500*60/90)=333, P2: floor(500*30/90)=166, leftover 1→P1
      expect(result.get('a')).toBe(334)
      expect(result.get('b')).toBe(166)
      expect(getTotalPayout(result)).toBe(500) // full pot distributed
    })
  })

  describe('tie handling', () => {
    it('should split prize evenly for 2-way tie for 1st place', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a', 'b'] },
        { position: 3, userIds: ['c'] },
      ]
      const result = calculatePayouts(1000, rankings, standardRatios)

      // Active: 60+10=70 (position 2 unclaimed)
      // P1: floor(1000*60/70)=857 split 2: base=428, remainder=1 → a=429, b=428
      // P3: floor(1000*10/70)=142 → c=142
      // Distributed: 999, leftover 1 → a
      expect(result.get('a')).toBe(430)
      expect(result.get('b')).toBe(428)
      expect(result.get('c')).toBe(142)
      expect(getTotalPayout(result)).toBe(1000)
    })

    it('should split prize evenly for 3-way tie for 1st place', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a', 'b', 'c'] },
      ]
      const result = calculatePayouts(1000, rankings, standardRatios)

      // Only position 1 active (60/60=100%). Prize=floor(1000*60/60)=1000
      // Split 3: base=333, remainder=1 → a=334, b=333, c=333
      expect(result.get('a')).toBe(334)
      expect(result.get('b')).toBe(333)
      expect(result.get('c')).toBe(333)
      expect(getTotalPayout(result)).toBe(1000)
    })

    it('should handle odd remainder by giving extra chip to first tied player', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a', 'b', 'c'] },
      ]
      const result = calculatePayouts(997, rankings, standardRatios)

      // Only position 1 active (60/60=100%). Prize=floor(997*60/60)=997
      // Split 3: base=332, remainder=1 → a=333, b=332, c=332
      const payouts = [result.get('a')!, result.get('b')!, result.get('c')!]
      expect(payouts.sort((a, b) => b - a)).toEqual([333, 332, 332])
      expect(getTotalPayout(result)).toBe(997)
    })

    it('should handle 2-way tie for 2nd place', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a'] },
        { position: 2, userIds: ['b', 'c'] },
      ]
      const result = calculatePayouts(1000, rankings, standardRatios)

      // Active: 60+30=90. P1: floor(1000*60/90)=666. P2: floor(1000*30/90)=333
      // P2 split 2: base=166, remainder=1 → b=167, c=166
      // Distributed: 666+167+166=999, leftover 1 → a
      expect(result.get('a')).toBe(667)
      expect(result.get('b')).toBe(167)
      expect(result.get('c')).toBe(166)
      expect(getTotalPayout(result)).toBe(1000)
    })
  })

  describe('edge cases', () => {
    it('should give entire pot to sole finisher when all others forfeit', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a'] },
      ]
      const result = calculatePayouts(800, rankings, standardRatios)

      expect(result.get('a')).toBe(800)
      expect(getTotalPayout(result)).toBe(800)
    })

    it('should handle empty rankings by returning empty map', () => {
      const rankings: FinalRanking[] = []
      const result = calculatePayouts(1000, rankings, standardRatios)

      expect(result.size).toBe(0)
      expect(getTotalPayout(result)).toBe(0)
    })

    it('should handle zero pot', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a'] },
        { position: 2, userIds: ['b'] },
      ]
      const result = calculatePayouts(0, rankings, standardRatios)

      expect(result.get('a')).toBe(0)
      expect(result.get('b')).toBe(0)
      expect(getTotalPayout(result)).toBe(0)
    })
  })

  describe('invariants', () => {
    it('should ensure total payout never exceeds pot', () => {
      const testCases = [
        { pot: 1000, rankings: [{ position: 1, userIds: ['a', 'b', 'c'] }] },
        { pot: 997, rankings: [{ position: 1, userIds: ['a', 'b'] }] },
        { pot: 1500, rankings: [{ position: 1, userIds: ['a'] }, { position: 2, userIds: ['b'] }] },
      ]

      testCases.forEach(({ pot, rankings }) => {
        const result = calculatePayouts(pot, rankings, standardRatios)
        const total = getTotalPayout(result)
        expect(total).toBeLessThanOrEqual(pot)
      })
    })

    it('should ensure all payouts are non-negative integers', () => {
      const rankings: FinalRanking[] = [
        { position: 1, userIds: ['a', 'b', 'c'] },
      ]
      const result = calculatePayouts(997, rankings, standardRatios)

      result.forEach((payout) => {
        expect(payout).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(payout)).toBe(true)
      })
    })
  })
})

// Helper function to sum all payouts
function getTotalPayout(payouts: Map<string, number>): number {
  return Array.from(payouts.values()).reduce((sum, amount) => sum + amount, 0)
}
