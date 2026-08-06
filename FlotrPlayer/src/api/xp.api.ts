import { apiClient } from './axios'
import type {
  BadgeStatusDto,
  LeaderboardDto,
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
  // Club-scoped for the caller by the API; teamId narrows to one team, sort toggles seasonal/career.
  getLeaderboard: (params?: { sort?: 'season' | 'career'; teamId?: number; seasonId?: number }) =>
    apiClient.get<LeaderboardDto>('/xp/leaderboard', { params }).then((r) => r.data),
}
