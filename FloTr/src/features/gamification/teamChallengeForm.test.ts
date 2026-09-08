import { describe, it, expect } from 'vitest'
import {
  buildTeamChallengeSaveDto,
  isTeamChallengeFormValid,
  type TeamChallengeFormState,
} from './teamChallengeForm'

const base: TeamChallengeFormState = {
  teamId: 7,
  name: 'Docházka',
  description: '',
  isManual: false,
  metric: 'TrainingAttendance',
  target: '10',
  window: 'Month',
  startsOn: '',
  endsOn: '',
  rewardXp: '30',
  isActive: true,
}

describe('isTeamChallengeFormValid', () => {
  it('accepts a well-formed derived challenge', () => {
    expect(isTeamChallengeFormValid(base)).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(isTeamChallengeFormValid({ ...base, name: '  ' })).toBe(false)
  })

  it('rejects a derived challenge with target < 1', () => {
    expect(isTeamChallengeFormValid({ ...base, target: '0' })).toBe(false)
    expect(isTeamChallengeFormValid({ ...base, target: '' })).toBe(false)
  })

  it('ignores target for a manual challenge', () => {
    expect(isTeamChallengeFormValid({ ...base, isManual: true, target: '' })).toBe(true)
  })

  it('requires a valid from/to range for a custom window', () => {
    expect(isTeamChallengeFormValid({ ...base, window: 'Custom' })).toBe(false)
    expect(
      isTeamChallengeFormValid({
        ...base,
        window: 'Custom',
        startsOn: '2026-02-10',
        endsOn: '2026-02-01',
      })
    ).toBe(false)
    expect(
      isTeamChallengeFormValid({
        ...base,
        window: 'Custom',
        startsOn: '2026-02-01',
        endsOn: '2026-02-28',
      })
    ).toBe(true)
  })

  it('rejects a negative reward', () => {
    expect(isTeamChallengeFormValid({ ...base, rewardXp: '-5' })).toBe(false)
  })
})

describe('buildTeamChallengeSaveDto', () => {
  it('maps a derived challenge and drops the date range for a non-custom window', () => {
    const dto = buildTeamChallengeSaveDto({ ...base, startsOn: '2026-01-01', endsOn: '2026-01-31' })
    expect(dto).toMatchObject({
      teamId: 7,
      name: 'Docházka',
      isManual: false,
      metric: 'TrainingAttendance',
      target: 10,
      window: 'Month',
      startsOn: null,
      endsOn: null,
      rewardXp: 30,
      isActive: true,
    })
  })

  it('clears metric/target for a manual challenge and keeps a custom range', () => {
    const dto = buildTeamChallengeSaveDto({
      ...base,
      isManual: true,
      window: 'Custom',
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
    })
    expect(dto.metric).toBeNull()
    expect(dto.target).toBe(0)
    expect(dto.startsOn).toBe('2026-03-01')
    expect(dto.endsOn).toBe('2026-03-31')
  })

  it('floors reward at 0 and target at 1', () => {
    const dto = buildTeamChallengeSaveDto({ ...base, rewardXp: '-3', target: '-1' })
    expect(dto.rewardXp).toBe(0)
    expect(dto.target).toBe(1)
  })
})
