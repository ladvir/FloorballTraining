import { apiClient } from './axios'
import type {
  StatTrackerDto,
  StatParticipantRole,
  TeamStatMetricTemplateDto,
  PlayerStatsBySeasonDto,
  TeamStatsBySeasonDto,
} from '../types/domain.types'

export interface CreateStatTrackerRequest {
  eventCategory: 0 | 1
  tournamentMatchId?: number | null
  appointmentId?: number | null
  teamId: number
}

export interface SetupStatTrackerRequest {
  participants: { memberId: number; role: StatParticipantRole; sortOrder: number }[]
  metrics: { code: string; name: string; isGoalkeeper: boolean; sortOrder: number }[]
  matchLineupId?: number | null
}

export interface AddEntryRequest {
  participantId: number
  metricId: number
  delta?: number
  period?: number | null
}

export interface BulkEntryRequest {
  participantIds: number[]
  metricId: number
  delta?: number
  period?: number | null
}

export interface MatchInfoRequest {
  opponentName?: string | null
  matchPeriodCount?: number | null
  matchPartDurationMinutes?: number | null
  currentPeriod?: number | null
}

export interface ScoreRequest {
  side: 'home' | 'away'
  delta?: number
  period?: number | null
}

export const statTrackersApi = {
  getForEvent: (params: { type: 'tournamentMatch' | 'appointment'; id: number; teamId?: number }) =>
    apiClient
      .get<StatTrackerDto[]>('/stattrackers/event', { params })
      .then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<StatTrackerDto>(`/stattrackers/${id}`).then((r) => r.data),

  create: (data: CreateStatTrackerRequest) =>
    apiClient.post<StatTrackerDto>('/stattrackers', data).then((r) => r.data),

  setup: (id: number, data: SetupStatTrackerRequest) =>
    apiClient.put<StatTrackerDto>(`/stattrackers/${id}/setup`, data).then((r) => r.data),

  delete: (id: number) => apiClient.delete(`/stattrackers/${id}`),

  addEntry: (id: number, data: AddEntryRequest) =>
    apiClient.post<StatTrackerDto>(`/stattrackers/${id}/entries`, data).then((r) => r.data),

  addBulkEntries: (id: number, data: BulkEntryRequest) =>
    apiClient.post<StatTrackerDto>(`/stattrackers/${id}/entries/bulk`, data).then((r) => r.data),

  undoLast: (id: number) =>
    apiClient.delete<StatTrackerDto>(`/stattrackers/${id}/entries/last`).then((r) => r.data),

  updateMatch: (id: number, data: MatchInfoRequest) =>
    apiClient.put<StatTrackerDto>(`/stattrackers/${id}/match`, data).then((r) => r.data),

  addScore: (id: number, data: ScoreRequest) =>
    apiClient.post<StatTrackerDto>(`/stattrackers/${id}/score`, data).then((r) => r.data),

  // Templates
  getTemplates: (teamId: number) =>
    apiClient
      .get<TeamStatMetricTemplateDto[]>('/stattrackers/team-templates', { params: { teamId } })
      .then((r) => r.data),

  createTemplate: (data: Partial<TeamStatMetricTemplateDto>) =>
    apiClient
      .post<TeamStatMetricTemplateDto>('/stattrackers/team-templates', data)
      .then((r) => r.data),

  deleteTemplate: (id: number) =>
    apiClient.delete(`/stattrackers/team-templates/${id}`),

  // Reports
  memberSummary: (memberId: number, eventCategory?: 0 | 1) =>
    apiClient
      .get<PlayerStatsBySeasonDto[]>(`/stattrackers/member/${memberId}/summary`, {
        params: eventCategory !== undefined ? { eventCategory } : undefined,
      })
      .then((r) => r.data),

  teamSummary: (teamId: number, eventCategory?: 0 | 1) =>
    apiClient
      .get<TeamStatsBySeasonDto[]>(`/stattrackers/team/${teamId}/summary`, {
        params: eventCategory !== undefined ? { eventCategory } : undefined,
      })
      .then((r) => r.data),
}
