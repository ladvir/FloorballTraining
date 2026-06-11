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

// Exchange the refresh cookie for a fresh access token.
export async function refreshAccessToken(): Promise<string> {
  const res = await authClient.post('/auth/refresh')
  const token: string = res.data.token
  setAccessToken(token)
  return token
}

function redirectToLogin() {
  setAccessToken(null)
  localStorage.removeItem('flotr_user')
  if (!window.location.pathname.endsWith('/login')) {
    window.location.href = import.meta.env.BASE_URL + 'login'
  }
}

// Single-flight refresh: while one refresh is in progress, queue the other 401s.
let isRefreshing = false
let pendingQueue: { resolve: (token: string | null) => void; reject: (e: unknown) => void }[] = []

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  pendingQueue = []
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

    if (status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            if (token) original.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(original))
          },
          reject,
        })
      })
    }

    isRefreshing = true
    try {
      const token = await refreshAccessToken()
      flushQueue(null, token)
      original.headers.Authorization = `Bearer ${token}`
      return apiClient(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      redirectToLogin()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export { authClient }
