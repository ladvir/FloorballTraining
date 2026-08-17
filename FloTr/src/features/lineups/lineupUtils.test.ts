import { describe, it, expect } from 'vitest'
import {
  colorClasses,
  rosterDisplayName,
  rosterShortName,
  rosterInitials,
  findFormationsForRoster,
  COLOR_CLASSES,
} from './lineupUtils'
import type { LineupRosterDto, MatchLineupDto } from '../../types/domain.types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRoster(overrides: Partial<LineupRosterDto> = {}): LineupRosterDto {
  return { id: 1, isAvailable: true, sortOrder: 0, ...overrides }
}

function makeLineup(partial: Partial<MatchLineupDto> = {}): MatchLineupDto {
  return {
    id: 1,
    teamId: 1,
    name: 'Test',
    formationTemplateId: 1,
    formationCount: 1,
    isShared: false,
    createdAt: '',
    updatedAt: '',
    roster: [],
    formations: [],
    ...partial,
  }
}

// ── colorClasses ──────────────────────────────────────────────────────────────

describe('colorClasses', () => {
  it('returns the correct class set for each known key', () => {
    for (const key of Object.keys(COLOR_CLASSES)) {
      const result = colorClasses(key)
      expect(result).toBe(COLOR_CLASSES[key as keyof typeof COLOR_CLASSES])
    }
  })

  it('falls back to blue for an unknown key', () => {
    expect(colorClasses('unknown')).toBe(COLOR_CLASSES.blue)
    expect(colorClasses('')).toBe(COLOR_CLASSES.blue)
  })
})

// ── rosterDisplayName ─────────────────────────────────────────────────────────

describe('rosterDisplayName', () => {
  it('returns "Příjmení Jméno" when both are set', () => {
    expect(rosterDisplayName(makeRoster({ memberLastName: 'Novák', memberFirstName: 'Jan' }))).toBe(
      'Novák Jan'
    )
  })

  it('returns last name only when first name is absent', () => {
    expect(rosterDisplayName(makeRoster({ memberLastName: 'Novák' }))).toBe('Novák')
  })

  it('returns first name only when last name is absent', () => {
    expect(rosterDisplayName(makeRoster({ memberFirstName: 'Jan' }))).toBe('Jan')
  })

  it('falls back to manualName when no member name', () => {
    expect(rosterDisplayName(makeRoster({ manualName: 'Náhradník' }))).toBe('Náhradník')
  })

  it('returns "Hráč" when all names are absent', () => {
    expect(rosterDisplayName(makeRoster())).toBe('Hráč')
  })
})

// ── rosterShortName ───────────────────────────────────────────────────────────

describe('rosterShortName', () => {
  it('returns last name when available', () => {
    expect(rosterShortName(makeRoster({ memberLastName: 'Novák', memberFirstName: 'Jan' }))).toBe(
      'Novák'
    )
  })

  it('returns manualName when last name is absent', () => {
    expect(rosterShortName(makeRoster({ manualName: 'Náhradník' }))).toBe('Náhradník')
  })

  it('returns "Hráč" when all names are absent', () => {
    expect(rosterShortName(makeRoster())).toBe('Hráč')
  })
})

// ── rosterInitials ────────────────────────────────────────────────────────────

describe('rosterInitials', () => {
  it('returns "JN" for Jan Novák (first[0] + last[0])', () => {
    expect(rosterInitials(makeRoster({ memberFirstName: 'Jan', memberLastName: 'Novák' }))).toBe(
      'JN'
    )
  })

  it('returns "N" when only last name is set', () => {
    expect(rosterInitials(makeRoster({ memberLastName: 'Novák' }))).toBe('N')
  })

  it('returns "J" when only first name is set', () => {
    expect(rosterInitials(makeRoster({ memberFirstName: 'Jan' }))).toBe('J')
  })

  it('returns two-letter initials from manualName with two words', () => {
    expect(rosterInitials(makeRoster({ manualName: 'Pavel Černý' }))).toBe('PČ')
  })

  it('returns first two letters of manualName when single word', () => {
    expect(rosterInitials(makeRoster({ manualName: 'Karel' }))).toBe('KA')
  })

  it('returns "?" when all names are absent', () => {
    expect(rosterInitials(makeRoster())).toBe('?')
  })
})

// ── findFormationsForRoster ───────────────────────────────────────────────────

describe('findFormationsForRoster', () => {
  it('returns empty array when roster is in no formation', () => {
    const lineup = makeLineup({
      formations: [
        { id: 1, index: 1, colorKey: 'blue', slots: [{ id: 10, position: 1, rosterId: 99 }] },
      ],
    })
    expect(findFormationsForRoster(lineup, 42)).toEqual([])
  })

  it('returns the formation index where roster appears', () => {
    const lineup = makeLineup({
      formations: [
        { id: 1, index: 1, colorKey: 'blue', slots: [{ id: 10, position: 1, rosterId: 5 }] },
        { id: 2, index: 2, colorKey: 'emerald', slots: [{ id: 11, position: 2, rosterId: 7 }] },
      ],
    })
    expect(findFormationsForRoster(lineup, 5)).toEqual([1])
  })

  it('returns sorted indices when roster appears in multiple formations', () => {
    const lineup = makeLineup({
      formations: [
        { id: 1, index: 3, colorKey: 'blue', slots: [{ id: 10, position: 1, rosterId: 5 }] },
        { id: 2, index: 1, colorKey: 'emerald', slots: [{ id: 11, position: 2, rosterId: 5 }] },
        { id: 3, index: 2, colorKey: 'amber', slots: [{ id: 12, position: 3, rosterId: 5 }] },
      ],
    })
    expect(findFormationsForRoster(lineup, 5)).toEqual([1, 2, 3])
  })

  it('returns empty array when lineup has no formations', () => {
    expect(findFormationsForRoster(makeLineup(), 1)).toEqual([])
  })
})
