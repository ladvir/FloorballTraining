import { apiClient } from './axios'
import type { TrainingTemplateDto } from '../types/domain.types'

export const trainingTemplatesApi = {
  getAll: () => apiClient.get<TrainingTemplateDto[]>('/trainingtemplates').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<TrainingTemplateDto>(`/trainingtemplates/${id}`).then((r) => r.data),

  create: (data: Partial<TrainingTemplateDto>) =>
    apiClient.post<TrainingTemplateDto>('/trainingtemplates', data).then((r) => r.data),

  update: (id: number, data: Partial<TrainingTemplateDto>) =>
    apiClient.put<TrainingTemplateDto>(`/trainingtemplates/${id}`, data).then((r) => r.data),

  delete: (id: number) => apiClient.delete(`/trainingtemplates/${id}`),
}
