import { apiClient } from './axios'
import type { FormationTemplateDto, MatchLineupDto } from '../types/domain.types'

export const lineupsApi = {
  getByTeam: (teamId: number) =>
    apiClient.get<MatchLineupDto[]>('/lineups', { params: { teamId } }).then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<MatchLineupDto>(`/lineups/${id}`).then((r) => r.data),
  getByAppointment: (appointmentId: number) =>
    apiClient.get<MatchLineupDto | ''>(`/appointments/${appointmentId}/lineup`).then((r) => (r.status === 204 ? null : (r.data as MatchLineupDto))),
  create: (data: Partial<MatchLineupDto>) =>
    apiClient.post<MatchLineupDto>('/lineups', data).then((r) => r.data),
  update: (id: number, data: Partial<MatchLineupDto>) =>
    apiClient.put<MatchLineupDto>(`/lineups/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/lineups/${id}`),
}

export const formationTemplatesApi = {
  getAll: () =>
    apiClient.get<FormationTemplateDto[]>('/formationtemplates').then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<FormationTemplateDto>(`/formationtemplates/${id}`).then((r) => r.data),
  create: (data: Partial<FormationTemplateDto>) =>
    apiClient.post<FormationTemplateDto>('/formationtemplates', data).then((r) => r.data),
  update: (id: number, data: Partial<FormationTemplateDto>) =>
    apiClient.put<FormationTemplateDto>(`/formationtemplates/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/formationtemplates/${id}`),
}
