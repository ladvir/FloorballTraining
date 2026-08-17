import { apiClient } from './axios'
import type { AuthResponse, LoginRequest } from '../types/domain.types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  me: () => apiClient.get<AuthResponse>('/auth/me').then((r) => r.data),

  // The server also accepts the refresh token via the (web-only) httpOnly cookie; the native
  // app has no cookie jar, so it always sends the token it stored from the last login/refresh.
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string | null) => apiClient.post('/auth/logout', { refreshToken }),
}
