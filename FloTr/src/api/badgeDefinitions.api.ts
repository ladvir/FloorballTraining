import { apiClient } from './axios'
import type { BadgeDefinitionDto } from '../types/domain.types'

/** Admin management of badge definitions. */
export const badgeDefinitionsApi = {
  getAll: () => apiClient.get<BadgeDefinitionDto[]>('/badges/definitions').then((r) => r.data),
  create: (dto: Partial<BadgeDefinitionDto>) =>
    apiClient.post<BadgeDefinitionDto>('/badges/definitions', dto).then((r) => r.data),
  update: (id: number, dto: Partial<BadgeDefinitionDto>) =>
    apiClient.put<BadgeDefinitionDto>(`/badges/definitions/${id}`, dto).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/badges/definitions/${id}`),
  uploadIcon: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<BadgeDefinitionDto>(`/badges/definitions/${id}/icon`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
