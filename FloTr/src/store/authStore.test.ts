import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AuthResponse, EffectiveRole } from '../types/domain.types'

const setAccessToken = vi.fn()
const logout = vi.fn(() => Promise.resolve())
const setActiveClub = vi.fn()
const getMe = vi.fn()

vi.mock('../api/index', () => ({
  authApi: {
    getMe: (...args: unknown[]) => getMe(...args),
    setActiveClub: (...args: unknown[]) => setActiveClub(...args),
    logout: (...args: unknown[]) => logout(...args),
  },
}))
vi.mock('../api/token', () => ({
  setAccessToken: (...args: unknown[]) => setAccessToken(...args),
}))

import { useAuthStore } from './authStore'

function makeUser(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    id: 'u1',
    token: 'jwt-token',
    email: 'coach@flotr.cz',
    firstName: 'Eva',
    lastName: 'Coachová',
    roles: ['User'],
    effectiveRole: 'Coach',
    coachTeamIds: [],
    clubMemberships: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useAuthStore.getState().logout()
  vi.clearAllMocks()
})

describe('authStore role flags', () => {
  it.each<[EffectiveRole, Record<string, boolean>]>([
    ['Admin', { isAdmin: true, isAdminLike: true, isHeadCoach: true, isCoach: true }],
    ['ClubAdmin', { isAdmin: false, isClubAdmin: true, isAdminLike: true, isCoach: true }],
    ['HeadCoach', { isAdmin: false, isAdminLike: false, isHeadCoach: true, isCoach: true }],
    ['Coach', { isHeadCoach: false, isCoach: true }],
    ['User', { isCoach: false, isHeadCoach: false, isAdmin: false }],
  ])('derives flags for %s', (role, expected) => {
    useAuthStore.getState().setUser(makeUser({ effectiveRole: role }))
    const state = useAuthStore.getState()
    for (const [flag, value] of Object.entries(expected)) {
      expect(state[flag as keyof typeof state]).toBe(value)
    }
    expect(state.isAuthenticated).toBe(true)
    expect(state.effectiveRole).toBe(role)
  })
})

describe('authStore setUser', () => {
  it('stores the access token in memory and persists the user', () => {
    useAuthStore.getState().setUser(makeUser())
    expect(setAccessToken).toHaveBeenCalledWith('jwt-token')
    expect(localStorage.getItem('flotr_user')).toContain('coach@flotr.cz')
  })

  it('resolves the active club from memberships', () => {
    useAuthStore.getState().setUser(
      makeUser({
        clubId: 7,
        clubMemberships: [
          {
            clubId: 7,
            clubName: 'FBC Vsetín',
            memberId: 1,
            effectiveRole: 'Coach',
            coachTeamIds: [],
          },
        ],
      })
    )
    const state = useAuthStore.getState()
    expect(state.activeClubId).toBe(7)
    expect(state.activeClubName).toBe('FBC Vsetín')
  })
})

describe('authStore switchClub', () => {
  it('calls the API and applies the returned user', async () => {
    setActiveClub.mockResolvedValueOnce(makeUser({ effectiveRole: 'HeadCoach', clubId: 9 }))
    await useAuthStore.getState().switchClub(9)
    expect(setActiveClub).toHaveBeenCalledWith(9)
    expect(useAuthStore.getState().isHeadCoach).toBe(true)
  })
})

describe('authStore logout', () => {
  it('clears the session, token and stored user', () => {
    useAuthStore.getState().setUser(makeUser({ effectiveRole: 'Admin' }))
    vi.clearAllMocks()

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.effectiveRole).toBe('User')
    expect(state.isAdmin).toBe(false)
    expect(setAccessToken).toHaveBeenCalledWith(null)
    expect(localStorage.getItem('flotr_user')).toBeNull()
  })
})
