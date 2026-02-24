import type { KniffelRuleset, PlayerState, TeamInfo } from '@/types/game'
import { calculateTotalScoreWithRuleset } from './kniffel-rules'
import { resolveKniffelRuleset } from './kniffel-ruleset'

export function buildTeamTotals(
  teams: TeamInfo[],
  players: PlayerState[],
  ruleset?: KniffelRuleset
) {
  const effectiveRuleset = ruleset ?? resolveKniffelRuleset('classic')

  return teams
    .map(team => {
      const members = players.filter(player => team.memberUserIds.includes(player.userId))
      return {
        teamId: team.id,
        teamName: team.name,
        total: members.reduce(
          (sum, member) => sum + calculateTotalScoreWithRuleset(member.scoresheet, effectiveRuleset),
          0
        ),
        members: members.map(member => member.displayName).join(', ')
      }
    })
    .sort((a, b) => b.total - a.total)
}
