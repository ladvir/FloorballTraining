import { describe, it, expect } from 'vitest'
import { latestSeasonStars } from './xpUtils'

describe('latestSeasonStars', () => {
  it('returns 0 when no seasons', () => {
    expect(latestSeasonStars([])).toBe(0)
  })

  it('picks the highest seasonId, not the highest stars', () => {
    expect(
      latestSeasonStars([
        { seasonId: 1, xp: 500, stars: 5 },
        { seasonId: 3, xp: 40, stars: 1 },
        { seasonId: 2, xp: 200, stars: 3 },
      ])
    ).toBe(1)
  })
})
