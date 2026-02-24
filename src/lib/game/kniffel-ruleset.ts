import type { KniffelPreset, KniffelRuleset } from '@/types/game'

const CLASSIC_RULESET: KniffelRuleset = {
  preset: 'classic',
  allowScratch: true,
  strictStraights: false,
  fullHouseUsesSum: false,
  maxRolls: 3,
  categoryRandomizer: {
    enabled: false,
    disabledCategories: [],
    specialCategories: []
  },
  speedMode: {
    enabled: false,
    autoScore: false
  }
}

const PRESET_RULESETS: Record<KniffelPreset, KniffelRuleset> = {
  classic: CLASSIC_RULESET,
  triple: { ...CLASSIC_RULESET, preset: 'triple' },
  draft: { ...CLASSIC_RULESET, preset: 'draft' },
  duel: { ...CLASSIC_RULESET, preset: 'duel' },
  daily: { ...CLASSIC_RULESET, preset: 'daily' },
  ladder: { ...CLASSIC_RULESET, preset: 'ladder' },
  roguelite: { ...CLASSIC_RULESET, preset: 'roguelite' }
}

function mergeRuleset(base: KniffelRuleset, overrides?: Partial<KniffelRuleset>): KniffelRuleset {
  if (!overrides) return base

  return {
    ...base,
    ...overrides,
    categoryRandomizer: {
      ...base.categoryRandomizer,
      ...(overrides.categoryRandomizer || {})
    },
    speedMode: {
      ...base.speedMode,
      ...(overrides.speedMode || {})
    }
  }
}

export function resolveKniffelRuleset(
  preset: KniffelPreset = 'classic',
  overrides?: Partial<KniffelRuleset>
): KniffelRuleset {
  const base = PRESET_RULESETS[preset] || CLASSIC_RULESET
  return mergeRuleset(base, overrides)
}
