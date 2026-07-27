import { apiClient } from './axios'
import type { BadgeStatusDto, LeaderboardDto, XpSummaryDto } from '../types/domain.types'

/** XP, career progression, badges and leaderboards (#94/#95/#97/#98). */
export const xpApi = {
  getSummary: (memberId: number) =>
    apiClient.get<XpSummaryDto>(`/xp/member/${memberId}`).then((r) => r.data),

  getBadges: (memberId: number) =>
    apiClient.get<BadgeStatusDto[]>(`/xp/badges/${memberId}`).then((r) => r.data),

  /** Club (or team) leaderboard. Non-admins are scoped to their own club server-side;
   *  admins must pass clubId. sort = "season" (default) | "career". */
  getLeaderboard: (params: {
    clubId?: number | null
    teamId?: number | null
    seasonId?: number | null
    sort?: 'season' | 'career'
  }) => apiClient.get<LeaderboardDto>('/xp/leaderboard', { params }).then((r) => r.data),
}
