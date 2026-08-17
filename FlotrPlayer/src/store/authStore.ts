import { create } from 'zustand'
import { authApi } from '../api'
import { onSessionExpired } from '../api/authEvents'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/token'
import { t } from '../i18n/strings'
import type { AccountType, AuthResponse, LoginRequest } from '../types/domain.types'

interface AuthState {
  user: AuthResponse | null
  isAuthenticated: boolean
  isHydrated: boolean
  isLoggingIn: boolean
  error: string | null
  accountType: AccountType | null
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
  accountType: null,

  // Restores the session on app launch. The stored access token is short-lived (15 min), so
  // it's very likely already expired by the time the app is reopened - that's fine, the axios
  // response interceptor (api/axios.ts) transparently refreshes it via the stored refresh
  // token before this GET /auth/me resolves. If that refresh also fails (no/expired/revoked
  // refresh token), the interceptor clears storage and emits sessionExpired, which the
  // subscription below turns into an unauthenticated state.
  hydrate: async () => {
    const token = await getAccessToken()
    if (!token) {
      set({ isAuthenticated: false, isHydrated: true })
      return
    }
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true, accountType: user.accountType, isHydrated: true })
    } catch {
      set({ user: null, isAuthenticated: false, accountType: null, isHydrated: true })
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true, error: null })
    try {
      const user = await authApi.login(data)
      await setTokens(user.accessToken, user.refreshToken ?? null)
      set({ user, isAuthenticated: true, accountType: user.accountType, isLoggingIn: false })
    } catch {
      set({ isLoggingIn: false, error: t('auth.loginError') })
    }
  },

  logout: async () => {
    const refreshToken = await getRefreshToken()
    try {
      await authApi.logout(refreshToken)
    } catch {
      // Best-effort server-side revocation - local session is cleared either way below.
    }
    await clearTokens()
    set({ user: null, isAuthenticated: false, accountType: null })
  },
}))

// Fired by the axios interceptor when a silent refresh fails outside of any store action
// (e.g. a background screen's request expires mid-session, or hydrate()'s /auth/me couldn't be
// salvaged) - not reachable via `get`/`set` closures above, since it happens independently of
// any store method call. Sets `error` too, so the login screen explains why it's showing again
// (AC: "expirace vede na login s hláškou") rather than looking like a silent, unexplained logout.
onSessionExpired(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    accountType: null,
    error: t('auth.sessionExpired'),
  })
})
