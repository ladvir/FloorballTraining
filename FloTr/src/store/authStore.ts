import { create } from 'zustand'
import { authApi } from '../api/index'
import type { AuthResponse, EffectiveRole, UserClubMembership } from '../types/domain.types'

interface AuthState {
  user: AuthResponse | null
  isAuthenticated: boolean
  effectiveRole: EffectiveRole
  isAdmin: boolean
  isClubAdmin: boolean
  isAdminLike: boolean
  isHeadCoach: boolean
  isCoach: boolean
  clubMemberships: UserClubMembership[]
  activeClubId: number | null
  activeClubName: string | null
  setUser: (user: AuthResponse) => void
  refreshUser: () => Promise<void>
  switchClub: (clubId: number) => Promise<void>
  logout: () => void
}

const loadUser = (): AuthResponse | null => {
  try {
    const stored = localStorage.getItem('flotr_user')
    const user = stored ? JSON.parse(stored) : null
    if (user && !user.id) {
      localStorage.removeItem('flotr_user')
      localStorage.removeItem('flotr_token')
      return null
    }
    return user
  } catch {
    return null
  }
}

function computeRoleFlags(role: EffectiveRole) {
  const isAdmin = role === 'Admin'
  const isClubAdmin = role === 'ClubAdmin'
  const isAdminLike = isAdmin || isClubAdmin
  const isHeadCoach = isAdminLike || role === 'HeadCoach'
  const isCoach = isHeadCoach || role === 'Coach'
  return { isAdmin, isClubAdmin, isAdminLike, isHeadCoach, isCoach }
}

function getEffectiveRole(user: AuthResponse | null): EffectiveRole {
  return user?.effectiveRole ?? (user?.roles?.includes('Admin') ? 'Admin' : 'User')
}

function getActiveClubInfo(user: AuthResponse | null) {
  const memberships = user?.clubMemberships ?? []
  const activeId = user?.clubId ?? user?.defaultClubId ?? null
  const activeMembership = memberships.find((m) => m.clubId === activeId)
  return {
    clubMemberships: memberships,
    activeClubId: activeId,
    activeClubName: activeMembership?.clubName ?? null,
  }
}

const initialUser = loadUser()
const initialRole = getEffectiveRole(initialUser)
const initialClubInfo = getActiveClubInfo(initialUser)

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  effectiveRole: initialRole,
  ...computeRoleFlags(initialRole),
  ...initialClubInfo,

  setUser: (user: AuthResponse) => {
    localStorage.setItem('flotr_token', user.token)
    localStorage.setItem('flotr_user', JSON.stringify(user))
    const role = getEffectiveRole(user)
    const clubInfo = getActiveClubInfo(user)
    set({
      user,
      isAuthenticated: true,
      effectiveRole: role,
      ...computeRoleFlags(role),
      ...clubInfo,
    })
  },

  refreshUser: async () => {
    try {
      const response = await authApi.getMe()
      get().setUser(response)
    } catch {
      // If refresh fails (e.g. expired token), don't crash
    }
  },

  switchClub: async (clubId: number) => {
    const response = await authApi.setActiveClub(clubId)
    get().setUser(response)
  },

  logout: () => {
    localStorage.removeItem('flotr_token')
    localStorage.removeItem('flotr_user')
    set({
      user: null,
      isAuthenticated: false,
      effectiveRole: 'User',
      isAdmin: false,
      isClubAdmin: false,
      isAdminLike: false,
      isHeadCoach: false,
      isCoach: false,
      clubMemberships: [],
      activeClubId: null,
      activeClubName: null,
    })
  },
}))
