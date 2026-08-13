import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, setAccessToken } from './token'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie to /auth/*
  headers: {
    'Content-Type': 'application/json',
  },
})

// Bare client for the refresh/logout calls - no response interceptor, so it can't
// recurse into the refresh flow below.
const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach the in-memory access token.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Exchange the refresh cookie for a fresh access token. Single-flight: the refresh token
// rotates (and single-use reuse is treated as a breach, invalidating the session) on every
// call, so concurrent callers (React StrictMode's double effect-invocation, multiple 401s
// firing near-simultaneously, ProtectedRoute racing the response interceptor, ...) must all
// share one in-flight request rather than each hitting /auth/refresh with a stale cookie.
let inFlightRefresh: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (inFlightRefresh) return inFlightRefresh
  inFlightRefresh = authClient
    .post('/auth/refresh')
    .then((res) => {
      const token: string = res.data.token
      setAccessToken(token)
      return token
    })
    .finally(() => {
      inFlightRefresh = null
    })
  return inFlightRefresh
}

function redirectToLogin() {
  setAccessToken(null)
  localStorage.removeItem('flotr_user')
  if (!window.location.pathname.endsWith('/login')) {
    window.location.href = import.meta.env.BASE_URL + 'login'
  }
}

// Response interceptor - on 401, try to refresh once, then retry the original request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status

    // A 401 from an anonymous auth endpoint is meaningful (bad credentials / no refresh
    // cookie), not an expired access token — never try to refresh or it would mask the
    // real error and clear the session.
    const url = original?.url ?? ''
    const isAuthEndpoint = [
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
      '/auth/forgot-password',
      '/auth/reset-password',
    ].some((p) => url.includes(p))

    if (status === 409) {
      const msg: string =
        (error.response?.data as { message?: string } | undefined)?.message ??
        'Záznam byl mezitím upraven jiným uživatelem. Načtěte aktuální verzi a opakujte změny.'
      window.dispatchEvent(new CustomEvent('flotr:conflict', { detail: { message: msg } }))
      return Promise.reject(error)
    }

    if (status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }
    original._retry = true

    try {
      const token = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${token}`
      return apiClient(original)
    } catch (refreshError) {
      redirectToLogin()
      return Promise.reject(refreshError)
    }
  }
)

export { authClient }
