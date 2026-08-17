import { describe, it, expect } from 'vitest'
import { reduceAwards } from './attendanceUtils'
import type { XpAwardDto } from '../../types/domain.types'

const award = (id: number, memberId: number, type: XpAwardDto['type']): XpAwardDto => ({
  id,
  appointmentId: 7,
  memberId,
  type,
  awardedByUserId: 'u',
  awardedAt: '',
})

describe('reduceAwards', () => {
  it('toggles a per-player bonus on then off', () => {
    const on = reduceAwards([], { kind: 'toggle', memberId: 1, type: 'FairPlay' }, 7)
    expect(on).toHaveLength(1)
    expect(on[0]).toMatchObject({ memberId: 1, type: 'FairPlay' })

    const off = reduceAwards(on, { kind: 'toggle', memberId: 1, type: 'FairPlay' }, 7)
    expect(off).toHaveLength(0)
  })

  it('player-of-training is single-select — awarding B removes A', () => {
    const withA = [award(1, 1, 'PlayerOfTraining')]
    const withB = reduceAwards(withA, { kind: 'pot', memberId: 2 }, 7)
    const pot = withB.filter((a) => a.type === 'PlayerOfTraining')
    expect(pot).toHaveLength(1)
    expect(pot[0].memberId).toBe(2)
  })

  it('tapping the current player-of-training clears it', () => {
    const withA = [award(1, 1, 'PlayerOfTraining')]
    const cleared = reduceAwards(withA, { kind: 'pot', memberId: 1 }, 7)
    expect(cleared).toHaveLength(0)
  })

  it('leaves other players’ bonuses untouched when swapping player-of-training', () => {
    const list = [award(1, 1, 'PlayerOfTraining'), award(2, 3, 'FairPlay')]
    const next = reduceAwards(list, { kind: 'pot', memberId: 2 }, 7)
    expect(next.find((a) => a.type === 'FairPlay')).toMatchObject({ memberId: 3 })
  })
})
