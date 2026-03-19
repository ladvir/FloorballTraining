import { apiClient } from './axios'
import type { UserDto } from '../types/domain.types'

export interface CreateUserData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  clubId?: number
  role?: string
}

export const usersApi = {
  getAll: () =>
    apiClient.get<UserDto[]>('/users').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<UserDto>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserData) =>
    apiClient.post<UserDto>('/users', data).then((r) => r.data),

  updateRole: (id: string, role: string) =>
    apiClient.put(`/users/${id}/role`, { role }),

  updateClub: (id: string, clubId: number | null) =>
    apiClient.put(`/users/${id}/club`, { clubId }),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
}
