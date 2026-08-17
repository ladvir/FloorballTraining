import { apiClient } from './axios'
import type { TournamentDto, TournamentSummary } from '../types/domain.types'

export const tournamentsApi = {
  list: () => apiClient.get<TournamentSummary[]>('/tournaments').then((r) => r.data),
  getById: (id: number) => apiClient.get<TournamentDto>(`/tournaments/${id}`).then((r) => r.data),
  create: (data: Partial<TournamentDto>) =>
    apiClient.post<TournamentDto>('/tournaments', data).then((r) => r.data),
  update: (id: number, data: Partial<TournamentDto>) =>
    apiClient.put<TournamentDto>(`/tournaments/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/tournaments/${id}`),
}
