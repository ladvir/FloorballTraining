import { apiClient } from './axios'
import type {
  SaveTeamChallengeDto,
  TeamChallengeDto,
  TeamChallengeListDto,
} from '../types/domain.types'

/** Coach-authored team challenges (#156). Team-scoped; the list carries a CanManage flag. */
export const teamChallengesApi = {
  /** Board + progress for a team; CanManage tells the UI whether to show editing. */
  list: (teamId: number) =>
    apiClient
      .get<TeamChallengeListDto>('/team-challenges', { params: { teamId } })
      .then((r) => r.data),

  /** Read-only board for players/guardians of the same club (active challenges only). */
  forTeam: (teamId: number) =>
    apiClient.get<TeamChallengeListDto>(`/team-challenges/team/${teamId}`).then((r) => r.data),

  create: (dto: SaveTeamChallengeDto) =>
    apiClient.post<TeamChallengeDto>('/team-challenges', dto).then((r) => r.data),

  update: (id: number, dto: SaveTeamChallengeDto) =>
    apiClient.put<TeamChallengeDto>(`/team-challenges/${id}`, dto).then((r) => r.data),

  remove: (id: number) => apiClient.delete(`/team-challenges/${id}`),

  /** Mark a MANUAL challenge done for the whole active roster. */
  complete: (id: number) => apiClient.post(`/team-challenges/${id}/complete`).then((r) => r.data),

  /** Undo a manual completion. */
  uncomplete: (id: number) => apiClient.delete(`/team-challenges/${id}/complete`),
}
