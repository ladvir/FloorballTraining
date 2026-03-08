import { apiClient } from './axios'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/domain.types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  getMe: () =>
    apiClient.get<AuthResponse>('/auth/me').then((r) => r.data),
}
