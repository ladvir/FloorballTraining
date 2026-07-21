import { create } from 'zustand'
import { authApi } from '../api'
import { getToken, setToken } from '../api/token'
import type { AuthResponse, LoginRequest } from '../types/domain.types'

interface AuthState {
  user: AuthResponse | null
  isAuthenticated: boolean
  isHydrated: boolean
  isLoggingIn: boolean
  error: string | null
  hydrate: () => Promise<void>
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoggingIn: false,
  error: null,

  // Only checks for a stored token so the app can skip straight to the login screen
  // or a signed-in shell on launch. Re-fetching /auth/me to restore `user` on cold
  // start belongs to the real auth flow (Etapa 5), not this scaffold.
  hydrate: async () => {
    const token = await getToken()
    set({ isAuthenticated: !!token, isHydrated: true })
  },

  login: async (data) => {
    set({ isLoggingIn: true, error: null })
    try {
      const user = await authApi.login(data)
      await setToken(user.token)
      set({ user, isAuthenticated: true, isLoggingIn: false })
    } catch {
      set({ isLoggingIn: false, error: 'Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.' })
    }
  },

  logout: async () => {
    await setToken(null)
    set({ user: null, isAuthenticated: false })
  },
}))
