import { apiClient } from './axios'
import type { ActivityDto, ActivityMediaDto } from '../types/domain.types'

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
    apiClient.delete(`/activities/delete/${id}`),

  validate: (id: number) =>
    apiClient.post<{ isDraft: boolean; errors: string[] }>(`/activities/${id}/validate`).then((r) => r.data),

  validateAll: () =>
    apiClient.post<{ total: number; validCount: number; draftCount: number }>('/activities/validate-all').then((r) => r.data),

  addImage: (activityId: number, image: Pick<ActivityMediaDto, 'name' | 'data' | 'isThumbnail'>) =>
    apiClient.post<ActivityMediaDto>(`/activities/${activityId}/images`, image).then((r) => r.data),

  deleteImage: (activityId: number, imageId: number) =>
    apiClient.delete(`/activities/${activityId}/images/${imageId}`),

  setThumbnail: (activityId: number, imageId: number) =>
    apiClient.post(`/activities/${activityId}/images/${imageId}/thumbnail`),

  downloadPdf: async (id: number, name: string) => {
    const response = await apiClient.get(`/activities/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `aktivita-${name.replace(/\s+/g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}
