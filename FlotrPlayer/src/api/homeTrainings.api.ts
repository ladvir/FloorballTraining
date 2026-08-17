import { apiClient } from './axios'
import type {
  CreateHomeTrainingLogDto,
  HomeTrainingLogDto,
  IndividualTrainingDto,
} from '../types/domain.types'

/** Self-reported home trainings (#104): the player logs, a guardian/coach counter-signs. */
export const homeTrainingsApi = {
  /** Catalog of individual/home trainings to pick from (seeded set, #104). */
  catalog: () =>
    apiClient.get<IndividualTrainingDto[]>('/trainings/individual').then((r) => r.data),

  getByMember: (memberId: number) =>
    apiClient
      .get<HomeTrainingLogDto[]>(`/members/${memberId}/home-trainings`)
      .then((r) => r.data),

  create: (memberId: number, data: CreateHomeTrainingLogDto) =>
    apiClient
      .post<HomeTrainingLogDto>(`/members/${memberId}/home-trainings`, data)
      .then((r) => r.data),

  // Counter-sign queue (guardian/coach): pending logs to confirm or reject.
  confirmations: () =>
    apiClient.get<HomeTrainingLogDto[]>('/home-trainings/confirmations').then((r) => r.data),
  confirm: (id: number) => apiClient.put(`/home-trainings/${id}/confirm`),
  reject: (id: number) => apiClient.put(`/home-trainings/${id}/reject`),
}
