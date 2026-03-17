import { create } from 'zustand'
import type { AuthResponse } from '../types/domain.types'

interface AuthState {
  user: AuthResponse | null
  isAuthenticated: boolean
  isAdmin: boolean
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

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  isAuthenticated: !!loadUser(),
  isAdmin: loadUser()?.roles?.includes('Admin') ?? false,

  setUser: (user: AuthResponse) => {
    localStorage.setItem('flotr_token', user.token)
    localStorage.setItem('flotr_user', JSON.stringify(user))
    set({
      user,
      isAuthenticated: true,
      isAdmin: user.roles.includes('Admin'),
    })
  },

  logout: () => {
    localStorage.removeItem('flotr_token')
    localStorage.removeItem('flotr_user')
    set({ user: null, isAuthenticated: false, isAdmin: false })
  },
}))
