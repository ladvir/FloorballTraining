import { apiClient } from './axios'
import type { ActivityDto } from '../types/domain.types'

export const activitiesApi = {
  getAll: () =>
    apiClient.get<ActivityDto[]>('/activities/all').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ActivityDto>(`/activities/${id}`).then((r) => r.data),

  create: (data: Partial<ActivityDto>) =>
    apiClient.post<ActivityDto>('/activities', data).then((r) => r.data),

  update: (id: number, data: Partial<ActivityDto>) =>
    apiClient.put(`/activities/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/activities/${id}`),
}
