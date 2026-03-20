import { apiClient } from './axios'
import type { TrainingDto } from '../types/domain.types'

export const trainingsApi = {
  getAll: () =>
    apiClient.get<TrainingDto[]>('/trainings/all').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<TrainingDto>(`/trainings/${id}`).then((r) => r.data),

  create: (data: Partial<TrainingDto>) =>
    apiClient.post<TrainingDto>('/trainings', data).then((r) => r.data),

  update: (id: number, data: Partial<TrainingDto>) =>
    apiClient.put<TrainingDto>(`/trainings/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/trainings/${id}`),

  validate: (id: number, minPartsDurationPercent = 95) =>
    apiClient.post<{ isDraft: boolean; errors: string[] }>(`/trainings/${id}/validate`, null, { params: { minPartsDurationPercent } }).then((r) => r.data),

  validateAll: () =>
    apiClient.post<{ total: number; validCount: number; draftCount: number }>('/trainings/validate-all').then((r) => r.data),

  downloadPdf: async (id: number, name: string, options?: Partial<Record<'includeTrainingParameters' | 'includeTrainingDetails' | 'includeTrainingDescription' | 'includeComments' | 'includePartDescriptions' | 'includeActivityDescriptions' | 'includeImages', boolean>>) => {
    const params = new URLSearchParams()
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        if (value === false) params.set(key, 'false')
      }
    }
    const query = params.toString()
    const response = await apiClient.get(`/trainings/${id}/pdf${query ? `?${query}` : ''}`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `trening-${name.replace(/\s+/g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}
