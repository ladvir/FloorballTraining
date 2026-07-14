import { apiClient } from './axios'
import type {
  SeasonPlanDto,
  MesocycleDto,
  MicrocycleDto,
  CycleCalendarDto,
} from '../types/domain.types'

export const planningApi = {
  getPlan: (teamId: number) =>
    apiClient.get<SeasonPlanDto>(`/seasonplan/team/${teamId}`).then((r) => r.data),

  // Flat cycle rows overlapping [from, to] ('yyyy-MM-dd'), for the calendar overlay
  getCalendarCycles: (teamId: number, from: string, to: string) =>
    apiClient
      .get<CycleCalendarDto[]>('/seasonplan/calendar', { params: { teamId, from, to } })
      .then((r) => r.data),

  createMesocycle: (data: Partial<MesocycleDto>) =>
    apiClient.post<MesocycleDto>('/seasonplan/mesocycles', data).then((r) => r.data),
  updateMesocycle: (data: Partial<MesocycleDto>) =>
    apiClient.put<MesocycleDto>(`/seasonplan/mesocycles/${data.id}`, data).then((r) => r.data),
  deleteMesocycle: (id: number) => apiClient.delete(`/seasonplan/mesocycles/${id}`),

  createMicrocycle: (data: Partial<MicrocycleDto>) =>
    apiClient.post<MicrocycleDto>('/seasonplan/microcycles', data).then((r) => r.data),
  updateMicrocycle: (data: Partial<MicrocycleDto>) =>
    apiClient.put<MicrocycleDto>(`/seasonplan/microcycles/${data.id}`, data).then((r) => r.data),
  deleteMicrocycle: (id: number) => apiClient.delete(`/seasonplan/microcycles/${id}`),

  // Replace-set of a microcycle's recommended trainings
  setMicrocycleTrainings: (
    id: number,
    items: { trainingId: number; note?: string | null; sortOrder: number }[]
  ) =>
    apiClient
      .put<MicrocycleDto>(`/seasonplan/microcycles/${id}/trainings`, { items })
      .then((r) => r.data),
}
