import { apiClient } from './axios'
import type { TrainingDto } from '../types/domain.types'

export const trainingsApi = {
  getById: (id: number) => apiClient.get<TrainingDto>(`/trainings/${id}`).then((r) => r.data),
}
