import { apiClient } from './axios'
import type {
  SeasonGoalDto,
  SeasonGoalInputDto,
  TeamSeasonGoalsDto,
  ClubSeasonGoalRowDto,
} from '../types/domain.types'

export const seasonGoalsApi = {
  // Goals + live progress + derived/overridden verdict for the team's current season
  getTeamGoals: (teamId: number) =>
    apiClient.get<TeamSeasonGoalsDto>(`/seasongoals/team/${teamId}`).then((r) => r.data),

  // One row per team of the season — club-manager rollup
  getClubRollup: (clubId: number, seasonId: number) =>
    apiClient
      .get<ClubSeasonGoalRowDto[]>(`/seasongoals/club/${clubId}`, { params: { seasonId } })
      .then((r) => r.data),

  create: (data: SeasonGoalInputDto) =>
    apiClient.post<SeasonGoalDto>('/seasongoals', data).then((r) => r.data),
  update: (id: number, data: SeasonGoalInputDto) =>
    apiClient.put<SeasonGoalDto>(`/seasongoals/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/seasongoals/${id}`),

  // successful: true = úspěšná, false = neúspěšná, null = zrušit ruční verdikt (zpět na odvozený)
  setVerdict: (
    teamId: number,
    seasonId: number,
    successful: boolean | null,
    note?: string | null
  ) => apiClient.put(`/seasongoals/team/${teamId}/verdict`, { seasonId, successful, note }),
}
