import { apiClient } from './axios'
import type { UserDto } from '../types/domain.types'

export const usersApi = {
  getAll: () =>
    apiClient.get<UserDto[]>('/users').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<UserDto>(`/users/${id}`).then((r) => r.data),

  updateRole: (id: string, role: string) =>
    apiClient.put(`/users/${id}/role`, { role }),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
}
