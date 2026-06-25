import { describe, it, expect } from 'vitest'
import { canEditAppointment } from './useCanEditAppointment'
import type { AppointmentDto, UserClubMembership, TeamDto } from '../../types/domain.types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeApt(overrides: Partial<AppointmentDto> = {}): AppointmentDto {
  return {
    id: 1,
    start: '2026-06-25T10:00:00',
    end: '2026-06-25T11:30:00',
    ...overrides,
  }
}

function makeMembership(overrides: Partial<UserClubMembership> = {}): UserClubMembership {
  return {
    clubId: 10,
    clubName: 'Klub A',
    memberId: 1,
    effectiveRole: 'User',
    coachTeamIds: [],
    ...overrides,
  }
}

function makeTeam(overrides: Partial<TeamDto> = {}): TeamDto {
  return {
    id: 5,
    name: 'Tým A',
    clubId: 10,
    ...overrides,
  }
}

const TEAMS: TeamDto[] = [makeTeam()]

// ── canEditAppointment ────────────────────────────────────────────────────────

describe('canEditAppointment', () => {
  // ── Admin ──

  it('Admin can always edit any appointment', () => {
    expect(canEditAppointment(makeApt(), true, 'user-1', [], TEAMS)).toBe(true)
  })

  it('Admin can edit even without any club membership', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other-user' })
    expect(canEditAppointment(apt, true, undefined, [], TEAMS)).toBe(true)
  })

  // ── Owner ──

  it('owner of a personal event (no teamId) can edit it', () => {
    const apt = makeApt({ ownerUserId: 'user-42' })
    expect(canEditAppointment(apt, false, 'user-42', [], TEAMS)).toBe(true)
  })

  it('non-owner of a personal event cannot edit it', () => {
    const apt = makeApt({ ownerUserId: 'user-1' })
    expect(canEditAppointment(apt, false, 'user-99', [], TEAMS)).toBe(false)
  })

  it('owner of a team appointment can edit it', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'user-42' })
    expect(canEditAppointment(apt, false, 'user-42', [], TEAMS)).toBe(true)
  })

  // ── Club roles on team appointments ──

  it('HeadCoach in the same club can edit a team appointment', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'HeadCoach', clubId: 10 })
    expect(canEditAppointment(apt, false, 'user-2', [m], TEAMS)).toBe(true)
  })

  it('ClubAdmin in the same club can edit a team appointment', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'ClubAdmin', clubId: 10 })
    expect(canEditAppointment(apt, false, 'user-3', [m], TEAMS)).toBe(true)
  })

  it('Coach assigned to this specific team can edit its appointment', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'Coach', clubId: 10, coachTeamIds: [5] })
    expect(canEditAppointment(apt, false, 'user-4', [m], TEAMS)).toBe(true)
  })

  it('Coach of a different team cannot edit this team appointment', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'Coach', clubId: 10, coachTeamIds: [99] })
    expect(canEditAppointment(apt, false, 'user-5', [m], TEAMS)).toBe(false)
  })

  it('regular User role cannot edit a team appointment they do not own', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'User', clubId: 10 })
    expect(canEditAppointment(apt, false, 'user-6', [m], TEAMS)).toBe(false)
  })

  // ── Cross-club boundary ──

  it('HeadCoach from a different club cannot edit', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'HeadCoach', clubId: 99 }) // wrong club
    expect(canEditAppointment(apt, false, 'user-7', [m], TEAMS)).toBe(false)
  })

  it('returns false when team is found but has no clubId', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const teamsNoClub: TeamDto[] = [{ id: 5, name: 'X' }] // no clubId
    const m = makeMembership({ effectiveRole: 'HeadCoach', clubId: 10 })
    expect(canEditAppointment(apt, false, 'user-8', [m], teamsNoClub)).toBe(false)
  })

  it('returns false when teams list is undefined (data not yet loaded)', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'HeadCoach', clubId: 10 })
    expect(canEditAppointment(apt, false, 'user-9', [m], undefined)).toBe(false)
  })

  it('returns false when teamId is set but team not found in list', () => {
    const apt = makeApt({ teamId: 999, ownerUserId: 'other' })
    const m = makeMembership({ effectiveRole: 'HeadCoach', clubId: 10 })
    expect(canEditAppointment(apt, false, 'user-10', [m], TEAMS)).toBe(false)
  })

  // ── Multi-membership edge cases ──

  it('user with membership in two clubs — correct club grants access', () => {
    const apt = makeApt({ teamId: 5, ownerUserId: 'other' })
    const wrongClub = makeMembership({ effectiveRole: 'Coach', clubId: 99, coachTeamIds: [5] })
    const rightClub = makeMembership({ effectiveRole: 'HeadCoach', clubId: 10 })
    expect(canEditAppointment(apt, false, 'user-11', [wrongClub, rightClub], TEAMS)).toBe(true)
  })
})
