import { apiClient } from './axios'
import type { AuthResponse, LoginRequest } from '../types/domain.types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
}
