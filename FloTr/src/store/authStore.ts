import { create } from 'zustand'
import type { AuthResponse, EffectiveRole } from '../types/domain.types'

interface AuthState {
  user: AuthResponse | null
  isAuthenticated: boolean
  effectiveRole: EffectiveRole
  isAdmin: boolean
  isHeadCoach: boolean
  isCoach: boolean
  setUser: (user: AuthResponse) => void
  logout: () => void
}

const loadUser = (): AuthResponse | null => {
  try {
    const stored = localStorage.getItem('flotr_user')
    const user = stored ? JSON.parse(stored) : null
    // Force re-login if stored user is missing id (added later)
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
  const isHeadCoach = isAdmin || role === 'HeadCoach'
  const isCoach = isHeadCoach || role === 'Coach'
  return { isAdmin, isHeadCoach, isCoach }
}

function getEffectiveRole(user: AuthResponse | null): EffectiveRole {
  return user?.effectiveRole ?? (user?.roles?.includes('Admin') ? 'Admin' : 'User')
}

const initialUser = loadUser()
const initialRole = getEffectiveRole(initialUser)

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  effectiveRole: initialRole,
  ...computeRoleFlags(initialRole),

  setUser: (user: AuthResponse) => {
    localStorage.setItem('flotr_token', user.token)
    localStorage.setItem('flotr_user', JSON.stringify(user))
    const role = getEffectiveRole(user)
    set({
      user,
      isAuthenticated: true,
      effectiveRole: role,
      ...computeRoleFlags(role),
    })
  },

  logout: () => {
    localStorage.removeItem('flotr_token')
    localStorage.removeItem('flotr_user')
    set({
      user: null,
      isAuthenticated: false,
      effectiveRole: 'User',
      isAdmin: false,
      isHeadCoach: false,
      isCoach: false,
    })
  },
}))
