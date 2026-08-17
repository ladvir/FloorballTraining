import { describe, it, expect } from 'vitest'
import { filterAndSortUsers } from './userListUtils'
import type { UserDto } from '../../types/domain.types'

function user(overrides: Partial<UserDto>): UserDto {
  return {
    id: overrides.id ?? Math.random().toString(),
    email: 'x@flotr.cz',
    firstName: '',
    lastName: '',
    roles: [],
    effectiveRole: 'User',
    clubMemberships: [],
    ...overrides,
  }
}

const novak = user({ id: '1', firstName: 'Jan', lastName: 'Novák', email: 'novak@flotr.cz' })
const adamcova = user({
  id: '2',
  firstName: 'Eva',
  lastName: 'Adamcová',
  email: 'eva@flotr.cz',
  clubName: 'FBC Vsetín',
})
const svoboda = user({
  id: '3',
  firstName: 'Petr',
  lastName: 'Svoboda',
  email: 'petr@flotr.cz',
  lastLoginAt: '2026-06-01T10:00:00Z',
})

const all = [novak, adamcova, svoboda]

describe('filterAndSortUsers', () => {
  it('sorts by surname ascending using Czech collation', () => {
    const result = filterAndSortUsers(all, '', 'lastName', 'asc')
    expect(result.map((u) => u.lastName)).toEqual(['Adamcová', 'Novák', 'Svoboda'])
  })

  it('sorts by surname descending', () => {
    const result = filterAndSortUsers(all, '', 'lastName', 'desc')
    expect(result.map((u) => u.lastName)).toEqual(['Svoboda', 'Novák', 'Adamcová'])
  })

  it('sorts by first name', () => {
    const result = filterAndSortUsers(all, '', 'firstName', 'asc')
    expect(result.map((u) => u.firstName)).toEqual(['Eva', 'Jan', 'Petr'])
  })

  it('filters by surname (case-insensitive)', () => {
    const result = filterAndSortUsers(all, 'novák', 'lastName', 'asc')
    expect(result.map((u) => u.id)).toEqual(['1'])
  })

  it('filters by first name', () => {
    const result = filterAndSortUsers(all, 'eva', 'lastName', 'asc')
    expect(result.map((u) => u.id)).toEqual(['2'])
  })

  it('filters by email', () => {
    const result = filterAndSortUsers(all, 'petr@', 'lastName', 'asc')
    expect(result.map((u) => u.id)).toEqual(['3'])
  })

  it('sorts by club name (users without a club first ascending)', () => {
    const result = filterAndSortUsers(all, '', 'clubName', 'asc')
    // only adamcová has a club → sorts last when ascending
    expect(result[result.length - 1].id).toBe('2')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterAndSortUsers(all, 'zzz', 'lastName', 'asc')).toEqual([])
  })

  it('does not mutate the input array', () => {
    const input = [...all]
    filterAndSortUsers(input, '', 'lastName', 'desc')
    expect(input).toEqual(all)
  })

  it('orders missing last-login first when ascending', () => {
    const result = filterAndSortUsers(all, '', 'lastLoginAt', 'asc')
    // novak & adamcova have no lastLoginAt → sort before svoboda
    expect(result[result.length - 1].id).toBe('3')
  })
})
