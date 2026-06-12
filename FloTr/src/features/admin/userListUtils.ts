import type { UserDto } from '../../types/domain.types'

export type UserSortKey = 'lastName' | 'firstName' | 'clubName' | 'lastLoginAt'
export type UserSortDir = 'asc' | 'desc'

/**
 * Filters users by a free-text query (surname / first name / email, case-insensitive)
 * and sorts them by the given column. Pure — safe to unit test and memoize.
 */
export function filterAndSortUsers(
  users: UserDto[],
  filter: string,
  sortKey: UserSortKey,
  sortDir: UserSortDir
): UserDto[] {
  const q = filter.trim().toLowerCase()
  const filtered = q
    ? users.filter(
        (u) =>
          (u.lastName ?? '').toLowerCase().includes(q) ||
          (u.firstName ?? '').toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    : users

  const sorted = [...filtered].sort((a, b) => {
    let cmp: number
    switch (sortKey) {
      case 'lastName':
        cmp = (a.lastName ?? '').localeCompare(b.lastName ?? '', 'cs')
        break
      case 'firstName':
        cmp = (a.firstName ?? '').localeCompare(b.firstName ?? '', 'cs')
        break
      case 'clubName':
        cmp = (a.clubName ?? '').localeCompare(b.clubName ?? '', 'cs')
        break
      case 'lastLoginAt':
        // ISO strings sort chronologically; missing logins sort first ascending.
        cmp = (a.lastLoginAt ?? '').localeCompare(b.lastLoginAt ?? '')
        break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  return sorted
}
