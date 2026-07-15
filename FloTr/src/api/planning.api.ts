import { apiClient } from './axios'
import type {
  SeasonPlanDto,
  MesocycleDto,
  MicrocycleDto,
  CycleCalendarDto,
  MesocycleEvaluationDto,
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
  // shiftFollowing ripples the end-date change to all later cycles of the team;
  // shiftChildren moves the mesocycle's own microcycles by the start-date change (drag-move)
  updateMesocycle: (
    data: Partial<MesocycleDto>,
    opts?: { shiftFollowing?: boolean; shiftChildren?: boolean }
  ) => {
    const params: Record<string, boolean> = {}
    if (opts?.shiftFollowing) params.shiftFollowing = true
    if (opts?.shiftChildren) params.shiftChildren = true
    return apiClient
      .put<MesocycleDto>(`/seasonplan/mesocycles/${data.id}`, data, {
        params: Object.keys(params).length ? params : undefined,
      })
      .then((r) => r.data)
  },
  deleteMesocycle: (id: number) => apiClient.delete(`/seasonplan/mesocycles/${id}`),

  // Splits a mesocycle into Monday-aligned week microcycles; 409 when weeks exist and !overwrite
  generateWeeks: (
    mesocycleId: number,
    body: { type: number; namePrefix: string; overwrite: boolean }
  ) =>
    apiClient
      .post<MesocycleDto>(`/seasonplan/mesocycles/${mesocycleId}/generate-weeks`, body)
      .then((r) => r.data),

  createMicrocycle: (data: Partial<MicrocycleDto>) =>
    apiClient.post<MicrocycleDto>('/seasonplan/microcycles', data).then((r) => r.data),
  updateMicrocycle: (data: Partial<MicrocycleDto>, shiftFollowing = false) =>
    apiClient
      .put<MicrocycleDto>(`/seasonplan/microcycles/${data.id}`, data, {
        params: shiftFollowing ? { shiftFollowing: true } : undefined,
      })
      .then((r) => r.data),
  deleteMicrocycle: (id: number) => apiClient.delete(`/seasonplan/microcycles/${id}`),

  // Evaluation summary: goal coverage, attendance + ratings, milestone test progression
  getEvaluation: (mesocycleId: number) =>
    apiClient
      .get<MesocycleEvaluationDto>(`/seasonplan/mesocycles/${mesocycleId}/evaluation`)
      .then((r) => r.data),

  // Replace-set of a microcycle's recommended trainings
  setMicrocycleTrainings: (
    id: number,
    items: { trainingId: number; note?: string | null; sortOrder: number }[]
  ) =>
    apiClient
      .put<MicrocycleDto>(`/seasonplan/microcycles/${id}/trainings`, { items })
      .then((r) => r.data),
}
