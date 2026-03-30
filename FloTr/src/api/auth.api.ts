import { apiClient } from './axios'
import type { AuthResponse, LoginRequest } from '../types/domain.types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  getMe: () =>
    apiClient.get<AuthResponse>('/auth/me').then((r) => r.data),

  setActiveClub: (clubId: number) =>
    apiClient.put<AuthResponse>('/auth/active-club', { clubId }).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (email: string, token: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { email, token, newPassword }).then((r) => r.data),
}
