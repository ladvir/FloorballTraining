import type { SaveTeamChallengeDto } from '../../types/domain.types'

/** Raw form field values held by the team-challenge modal (all strings, as typed). */
export interface TeamChallengeFormState {
  teamId: number
  name: string
  description: string
  isManual: boolean
  metric: string
  target: string
  window: string
  startsOn: string
  endsOn: string
  rewardXp: string
  isActive: boolean
}

/** A custom window needs a valid from/to range; a derived challenge needs target ≥ 1. */
export function isTeamChallengeFormValid(s: TeamChallengeFormState): boolean {
  if (s.name.trim().length === 0) return false
  if (Number(s.rewardXp) < 0 || Number.isNaN(Number(s.rewardXp))) return false
  if (!s.isManual && (!(Number(s.target) >= 1) || Number.isNaN(Number(s.target)))) return false
  if (s.window === 'Custom' && (!s.startsOn || !s.endsOn || s.endsOn < s.startsOn)) return false
  return true
}

/** Map the form state to the API payload — clears metric/target for a manual challenge and the
 *  date range for a non-custom window. */
export function buildTeamChallengeSaveDto(s: TeamChallengeFormState): SaveTeamChallengeDto {
  const custom = s.window === 'Custom'
  return {
    teamId: s.teamId,
    name: s.name.trim(),
    description: s.description.trim() || null,
    isManual: s.isManual,
    metric: s.isManual ? null : s.metric,
    target: s.isManual ? 0 : Math.max(1, Number(s.target) || 1),
    window: s.window,
    startsOn: custom ? s.startsOn : null,
    endsOn: custom ? s.endsOn : null,
    rewardXp: Math.max(0, Number(s.rewardXp) || 0),
    isActive: s.isActive,
  }
}
