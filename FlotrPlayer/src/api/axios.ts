import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { Platform } from 'react-native'
import { emitSessionExpired } from './authEvents'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './token'
import type { AuthResponse } from '../types/domain.types'

// The Android emulator can't resolve `localhost` as the host machine - it needs the
// special alias 10.0.2.2. iOS simulator and web both reach the host via `localhost`.
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'

// Same dev API instance FloTr (web) proxies to. Unlike FloTr's Vite dev server, there is
// no proxy layer here to work around the API's self-signed dev certificate, so HTTPS
// requests from a real device/emulator will fail TLS validation until the dev cert is
// trusted (or the app points at a deployed API) - tracked for a later stage, not solved here.
const DEFAULT_DEV_API_URL = `https://${DEV_HOST}:5210`

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_API_URL

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Bare instance for the refresh call itself so it never re-enters the response interceptor
// below, regardless of how that interceptor evolves.
const refreshClient = axios.create({ baseURL: API_BASE_URL })

// Concurrent 401s (e.g. several screens fetching at once after the access token expires)
// must trigger exactly one /auth/refresh call, not one per failed request.
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

const performRefresh = async (): Promise<string> => {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token stored')

  const { data } = await refreshClient.post<AuthResponse>('/auth/refresh', { refreshToken })
  await setTokens(data.accessToken, data.refreshToken ?? null)
  return data.accessToken
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')

    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }
    original._retry = true

    try {
      const newAccessToken = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(original)
    } catch (refreshError) {
      await clearTokens()
      emitSessionExpired()
      return Promise.reject(refreshError)
    }
  },
)
