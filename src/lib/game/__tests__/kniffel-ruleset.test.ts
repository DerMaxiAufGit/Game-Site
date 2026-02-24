import { describe, it, expect } from '@jest/globals'
import { buildKniffelRulesetOverrides } from '../kniffel-ruleset'

describe('buildKniffelRulesetOverrides', () => {
  it('builds nested overrides for ruleset toggles', () => {
    const overrides = buildKniffelRulesetOverrides({
      allowScratch: false,
      strictStraights: true,
      fullHouseUsesSum: true,
      maxRolls: 4,
      speedModeEnabled: true,
      categoryRandomizerEnabled: true,
      disabledCategories: ['chance', 'ones'],
      specialCategories: ['twoPairs', 'allEven'],
    })

    expect(overrides).toEqual({
      allowScratch: false,
      strictStraights: true,
      fullHouseUsesSum: true,
      maxRolls: 4,
      speedMode: {
        enabled: true,
        autoScore: true,
      },
      categoryRandomizer: {
        enabled: true,
        disabledCategories: ['chance', 'ones'],
        specialCategories: ['twoPairs', 'allEven'],
      },
    })
  })
})
