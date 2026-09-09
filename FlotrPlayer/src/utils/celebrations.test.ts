import { describe, expect, it } from 'vitest'
import {
  buildCelebrationQueue,
  FIRST_RUN_MAX_BADGES,
  nextCelebrationState,
  type CelebrationState,
} from './celebrations'
import type { BadgeStatusDto } from '../types/domain.types'

const NOW = '2026-09-10T00:00:00Z'

const badge = (code: string, earned: boolean, earnedAt: string | null): BadgeStatusDto => ({
  code,
  icon: `badges/${code}.png`,
  threshold: 10,
  current: 10,
  earned,
  earnedAt,
  progress: earned ? 1 : 0.5,
  teamHolders: 3,
})

const state = (over: Partial<CelebrationState> = {}): CelebrationState => ({
  badgesSeenAt: '2026-09-01T00:00:00Z',
  rankIndex: 1,
  level: 2,
  ...over,
})

const codes = (q: ReturnType<typeof buildCelebrationQueue>) =>
  q.map((c) => (c.kind === 'badge' ? c.badge.code : `${c.kind}:${c.level}`))

describe('buildCelebrationQueue — first run (no prev)', () => {
  it('replays the newest few badges from the last two weeks, never a level card', () => {
    const q = buildCelebrationQueue(
      null,
      { rankIndex: 3, level: 4 },
      [
        badge('Ancient', true, '2026-01-01T00:00:00Z'),
        badge('RecentA', true, '2026-09-02T00:00:00Z'),
        badge('RecentB', true, '2026-09-08T00:00:00Z'),
      ],
      NOW,
    )
    expect(codes(q)).toEqual(['RecentB', 'RecentA'])
  })

  it('caps the first-run replay', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      badge(`B${i}`, true, `2026-09-0${i + 1}T00:00:00Z`),
    )
    const q = buildCelebrationQueue(null, { rankIndex: 0, level: 1 }, many, NOW)
    expect(q).toHaveLength(FIRST_RUN_MAX_BADGES)
  })

  it('falls back to just the single newest badge when nothing is recent', () => {
    const q = buildCelebrationQueue(
      null,
      { rankIndex: 0, level: 1 },
      [badge('Old1', true, '2025-05-01T00:00:00Z'), badge('Old2', true, '2025-06-01T00:00:00Z')],
      NOW,
    )
    expect(codes(q)).toEqual(['Old2'])
  })

  it('celebrates nothing when the player has no badges at all', () => {
    expect(buildCelebrationQueue(null, { rankIndex: 0, level: 1 }, [], NOW)).toEqual([])
  })
})

describe('buildCelebrationQueue — returning player (prev set)', () => {
  it('queues a badge earned after the last-seen timestamp, not one earned before', () => {
    const q = buildCelebrationQueue(
      state(),
      { rankIndex: 1, level: 2 },
      [
        badge('Old', true, '2026-08-01T00:00:00Z'),
        badge('New', true, '2026-09-05T12:00:00Z'),
        badge('Locked', false, null),
      ],
      NOW,
    )
    expect(codes(q)).toEqual(['New'])
  })

  it('detects a new badge across timestamp formats (API no-Z + 7 digits vs baseline Z + ms)', () => {
    const q = buildCelebrationQueue(
      state({ badgesSeenAt: '2026-09-08T09:00:00.000Z' }),
      { rankIndex: 1, level: 2 },
      [
        badge('Before', true, '2026-09-08T08:59:59.9999999'),
        badge('After', true, '2026-09-08T13:45:12.3456789'),
      ],
      NOW,
    )
    expect(codes(q)).toEqual(['After'])
  })

  it('celebrates a rank promotion (level resets, so compare rankIndex first)', () => {
    const q = buildCelebrationQueue(state({ rankIndex: 1, level: 5 }), { rankIndex: 2, level: 1 }, [], NOW)
    expect(q).toEqual([{ kind: 'rank', rankIndex: 2, level: 1 }])
  })

  it('collapses several level-ups within a rank into one card', () => {
    const q = buildCelebrationQueue(state({ rankIndex: 1, level: 2 }), { rankIndex: 1, level: 5 }, [], NOW)
    expect(q).toEqual([{ kind: 'level', rankIndex: 1, level: 5 }])
  })

  it('does not celebrate a level going backwards (XP prune / recompute)', () => {
    const q = buildCelebrationQueue(state({ rankIndex: 2, level: 3 }), { rankIndex: 1, level: 1 }, [], NOW)
    expect(q).toEqual([])
  })

  it('emits the progression card before badge cards', () => {
    const q = buildCelebrationQueue(
      state({ rankIndex: 1, level: 2 }),
      { rankIndex: 1, level: 3 },
      [badge('New', true, '2026-09-05T00:00:00Z')],
      NOW,
    )
    expect(q.map((c) => c.kind)).toEqual(['level', 'badge'])
  })
})

describe('nextCelebrationState', () => {
  it('advances badgesSeenAt to the newest earned badge and stores the current level', () => {
    const next = nextCelebrationState(
      state(),
      { rankIndex: 2, level: 1 },
      [badge('A', true, '2026-09-05T00:00:00Z'), badge('B', true, '2026-09-09T00:00:00Z'), badge('C', false, null)],
      NOW,
    )
    expect(next).toEqual({ badgesSeenAt: '2026-09-09T00:00:00Z', rankIndex: 2, level: 1 })
  })

  it('first run with no badges falls back to `now`', () => {
    const next = nextCelebrationState(null, { rankIndex: 0, level: 1 }, [], NOW)
    expect(next.badgesSeenAt).toBe(NOW)
  })
})
