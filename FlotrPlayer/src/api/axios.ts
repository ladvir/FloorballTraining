import axios from 'axios'
import { Platform } from 'react-native'
import { getToken } from './token'

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
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
