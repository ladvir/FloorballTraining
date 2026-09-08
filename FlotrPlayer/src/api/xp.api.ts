import { apiClient } from './axios'
import type {
  BadgeStatusDto,
  ChallengesDto,
  CreateXpAwardDto,
  LeaderboardDto,
  SaveTeamChallengeDto,
  TeamChallengeDto,
  TeamChallengeListDto,
  TeamLeaderboardDto,
  XpAwardDto,
  XpRuleCatalogItemDto,
  XpSummaryDto,
} from '../types/domain.types'

export const xpApi = {
  getSummary: (memberId: number) =>
    apiClient.get<XpSummaryDto>(`/xp/member/${memberId}`).then((r) => r.data),
  // "How to earn XP" catalog (#107): effective club values + layer/trigger metadata; club-scoped for the caller.
  getRules: () => apiClient.get<XpRuleCatalogItemDto[]>('/xp/rules').then((r) => r.data),
  getBadges: (memberId: number) =>
    apiClient.get<BadgeStatusDto[]>(`/xp/badges/${memberId}`).then((r) => r.data),
  // Self-completable challenges (#108/#109): current-window progress + recently earned; club-scoped.
  getChallenges: (memberId: number) =>
    apiClient.get<ChallengesDto>(`/xp/challenges/${memberId}`).then((r) => r.data),
  // Club-scoped for the caller by the API; teamId narrows to one team, sort toggles seasonal/career.
  getLeaderboard: (params?: { sort?: 'season' | 'career'; teamId?: number; seasonId?: number }) =>
    apiClient.get<LeaderboardDto>('/xp/leaderboard', { params }).then((r) => r.data),
  // Team-vs-team leaderboard within the caller's club (#156). sort = "avg" | "total" | "challenges".
  getTeamLeaderboard: (params?: { sort?: 'avg' | 'total' | 'challenges'; seasonId?: number }) =>
    apiClient.get<TeamLeaderboardDto>('/xp/leaderboard/teams', { params }).then((r) => r.data),

  // ── Team challenges (#156) ─────────────────────────────────────────────
  // Read-only board for the player/guardian view (active challenges only).
  getTeamChallenges: (teamId: number) =>
    apiClient.get<TeamChallengeListDto>(`/team-challenges/team/${teamId}`).then((r) => r.data),
  // Coach board (all challenges + CanManage).
  listTeamChallenges: (teamId: number) =>
    apiClient
      .get<TeamChallengeListDto>('/team-challenges', { params: { teamId } })
      .then((r) => r.data),
  createTeamChallenge: (dto: SaveTeamChallengeDto) =>
    apiClient.post<TeamChallengeDto>('/team-challenges', dto).then((r) => r.data),
  updateTeamChallenge: (id: number, dto: SaveTeamChallengeDto) =>
    apiClient.put<TeamChallengeDto>(`/team-challenges/${id}`, dto).then((r) => r.data),
  deleteTeamChallenge: (id: number) => apiClient.delete(`/team-challenges/${id}`),
  completeTeamChallenge: (id: number) =>
    apiClient.post(`/team-challenges/${id}/complete`).then((r) => r.data),
  uncompleteTeamChallenge: (id: number) => apiClient.delete(`/team-challenges/${id}/complete`),

  // ── Layer B: coach 1-click bonuses (#100/#110) ──────────────────────────
  listAwards: (appointmentId: number) =>
    apiClient.get<XpAwardDto[]>('/xp/awards', { params: { appointmentId } }).then((r) => r.data),
  createAward: (dto: CreateXpAwardDto) =>
    apiClient.post<XpAwardDto>('/xp/awards', dto).then((r) => r.data),
  deleteAward: (id: number) => apiClient.delete(`/xp/awards/${id}`),
}
