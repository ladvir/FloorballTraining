import { describe, it, expect } from 'vitest'
import { groupLineup } from './lineupGrouping'
import type { MatchLineupDto, LineupRosterDto, LineupFormationDto } from '../../types/domain.types'

// ── test builder helpers ──────────────────────────────────────────────────────

function makeRoster(
  id: number,
  memberId: number | null,
  first: string,
  last: string
): LineupRosterDto {
  return {
    id,
    memberId,
    memberFirstName: first || null,
    memberLastName: last || null,
    manualName: memberId ? null : 'Manual',
    isAvailable: true,
    sortOrder: id,
  }
}

function makeLineup(roster: LineupRosterDto[], formations: LineupFormationDto[]): MatchLineupDto {
  return {
    id: 1,
    teamId: 1,
    name: 'Test lineup',
    formationTemplateId: 1,
    formationCount: formations.length,
    isShared: false,
    createdAt: '',
    updatedAt: '',
    roster,
    formations,
  }
}

// ── groupLineup ───────────────────────────────────────────────────────────────

describe('groupLineup', () => {
  it('returns empty groups for a lineup with no roster and no formations', () => {
    const result = groupLineup(makeLineup([], []))
    expect(result.goalies).toEqual([])
    expect(result.formations).toEqual([])
    expect(result.bench).toEqual([])
    expect(result.all).toEqual([])
  })

  it('classifies a member in position 0 slot as a goalie', () => {
    const roster = [makeRoster(1, 10, 'Jan', 'Brankář')]
    const formations: LineupFormationDto[] = [
      { id: 1, index: 1, colorKey: 'blue', slots: [{ id: 101, position: 0, rosterId: 1 }] },
    ]
    const result = groupLineup(makeLineup(roster, formations))

    expect(result.goalies).toHaveLength(1)
    expect(result.goalies[0].memberId).toBe(10)
    // Goalie is not in field players of any formation
    expect(result.formations[0].members).toHaveLength(0)
    expect(result.all[0].isGoalkeeper).toBe(true)
  })

  it('classifies members in non-zero slots as field players', () => {
    const roster = [makeRoster(1, 10, 'Jan', 'Novák'), makeRoster(2, 11, 'Petr', 'Svoboda')]
    const formations: LineupFormationDto[] = [
      {
        id: 1,
        index: 1,
        colorKey: 'blue',
        slots: [
          { id: 101, position: 1, rosterId: 1 },
          { id: 102, position: 2, rosterId: 2 },
        ],
      },
    ]
    const result = groupLineup(makeLineup(roster, formations))

    expect(result.goalies).toHaveLength(0)
    expect(result.formations[0].members).toHaveLength(2)
    expect(result.formations[0].members.map((m) => m.memberId)).toEqual(
      expect.arrayContaining([10, 11])
    )
  })

  it('puts roster members not assigned to any slot on the bench', () => {
    const roster = [makeRoster(1, 10, 'Jan', 'Novák'), makeRoster(2, 11, 'Petr', 'Svoboda')]
    const formations: LineupFormationDto[] = [
      { id: 1, index: 1, colorKey: 'blue', slots: [{ id: 101, position: 1, rosterId: 1 }] },
    ]
    const result = groupLineup(makeLineup(roster, formations))

    expect(result.bench).toHaveLength(1)
    expect(result.bench[0].memberId).toBe(11)
  })

  it('skips manual roster entries (no memberId) in all groups', () => {
    // Manual player: memberId is null/undefined
    const roster = [makeRoster(1, null as unknown as number, '', '')]
    const formations: LineupFormationDto[] = [
      { id: 1, index: 1, colorKey: 'blue', slots: [{ id: 101, position: 1, rosterId: 1 }] },
    ]
    const result = groupLineup(makeLineup(roster, formations))

    expect(result.goalies).toHaveLength(0)
    expect(result.formations[0].members).toHaveLength(0)
    expect(result.bench).toHaveLength(0)
    expect(result.all).toHaveLength(0)
  })

  it('deduplicates members appearing in multiple formations', () => {
    const roster = [makeRoster(1, 10, 'Jan', 'Novák')]
    const formations: LineupFormationDto[] = [
      { id: 1, index: 1, colorKey: 'blue', slots: [{ id: 101, position: 1, rosterId: 1 }] },
      { id: 2, index: 2, colorKey: 'emerald', slots: [{ id: 102, position: 2, rosterId: 1 }] },
    ]
    const result = groupLineup(makeLineup(roster, formations))

    // Member is in both formations' field lists
    expect(result.formations[0].members).toHaveLength(1)
    expect(result.formations[1].members).toHaveLength(1)
    // But appears only once in `all`
    expect(result.all).toHaveLength(1)
    expect(result.all[0].memberId).toBe(10)
  })

  it('returns formations sorted by index', () => {
    const roster = [makeRoster(1, 10, 'A', 'B')]
    const formations: LineupFormationDto[] = [
      { id: 3, index: 3, colorKey: 'amber', slots: [] },
      { id: 1, index: 1, colorKey: 'blue', slots: [{ id: 101, position: 1, rosterId: 1 }] },
      { id: 2, index: 2, colorKey: 'emerald', slots: [] },
    ]
    const result = groupLineup(makeLineup(roster, formations))
    expect(result.formations.map((f) => f.index)).toEqual([1, 2, 3])
  })

  it('`all` list puts goalies first, then field players, then bench', () => {
    const roster = [
      makeRoster(1, 10, 'Brankář', 'B'),
      makeRoster(2, 20, 'Útočník', 'U'),
      makeRoster(3, 30, 'Lavička', 'L'),
    ]
    const formations: LineupFormationDto[] = [
      {
        id: 1,
        index: 1,
        colorKey: 'blue',
        slots: [
          { id: 101, position: 0, rosterId: 1 }, // goalie
          { id: 102, position: 1, rosterId: 2 }, // field
        ],
      },
    ]
    const result = groupLineup(makeLineup(roster, formations))

    expect(result.all).toHaveLength(3)
    expect(result.all[0].memberId).toBe(10) // goalie first
    expect(result.all[0].isGoalkeeper).toBe(true)
    expect(result.all[1].memberId).toBe(20) // field second
    expect(result.all[1].isGoalkeeper).toBe(false)
    expect(result.all[2].memberId).toBe(30) // bench last
    expect(result.all[2].isGoalkeeper).toBe(false)
  })
})
