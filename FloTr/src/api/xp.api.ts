import { apiClient } from './axios'
import type {
  BadgeStatusDto,
  ChallengesDto,
  CreateXpAwardDto,
  LeaderboardDto,
  UpdateXpRulesRequest,
  XpAwardDto,
  XpCountFromDto,
  XpRuleCatalogItemDto,
  XpRuleConfigDto,
  XpSummaryDto,
} from '../types/domain.types'

/** XP, career progression, badges and leaderboards (#94/#95/#97/#98). */
export const xpApi = {
  getSummary: (memberId: number) =>
    apiClient.get<XpSummaryDto>(`/xp/member/${memberId}`).then((r) => r.data),

  getBadges: (memberId: number) =>
    apiClient.get<BadgeStatusDto[]>(`/xp/badges/${memberId}`).then((r) => r.data),

  /** Active + recently completed self-completable challenges (#108). */
  getChallenges: (memberId: number) =>
    apiClient.get<ChallengesDto>(`/xp/challenges/${memberId}`).then((r) => r.data),

  /** Club (or team) leaderboard. Non-admins are scoped to their own club server-side;
   *  admins must pass clubId. sort = "season" (default) | "career". */
  getLeaderboard: (params: {
    clubId?: number | null
    teamId?: number | null
    seasonId?: number | null
    sort?: 'season' | 'career'
  }) => apiClient.get<LeaderboardDto>('/xp/leaderboard', { params }).then((r) => r.data),

  /** Admin: manually enqueue the (idempotent) XP + badge recompute. */
  recompute: () => apiClient.post('/xp/recompute').then((r) => r.data),

  /** Member-facing "How to earn XP" catalog (#107): effective club values + layer/trigger metadata.
   *  Any signed-in member; club resolved server-side from the caller. */
  getRules: () => apiClient.get<XpRuleCatalogItemDto[]>('/xp/rules').then((r) => r.data),

  // ── Configurable XP values (#106): HeadCoach+ club-wide, team's Coach+ per team ─────
  /** The 12 point rows for a scope: pass teamId (team view) or clubId (club-wide view). */
  getRulesConfig: (params: { clubId?: number; teamId?: number }) =>
    apiClient.get<XpRuleConfigDto[]>('/xp/rules/config', { params }).then((r) => r.data),

  /** Save a scope's overrides; a value equal to the inherited one clears the override. */
  updateRulesConfig: (req: UpdateXpRulesRequest) =>
    apiClient.put<XpRuleConfigDto[]>('/xp/rules/config', req).then((r) => r.data),

  // ── Layer B: coach 1-click bonuses (#101) ──────────────────────────────
  listAwards: (appointmentId: number) =>
    apiClient.get<XpAwardDto[]>('/xp/awards', { params: { appointmentId } }).then((r) => r.data),

  createAward: (dto: CreateXpAwardDto) =>
    apiClient.post<XpAwardDto>('/xp/awards', dto).then((r) => r.data),

  deleteAward: (id: number) => apiClient.delete(`/xp/awards/${id}`),

  // ── Admin-only XP reset cutoff (per club) ──────────────────────────────
  getXpCountFrom: (clubId: number) =>
    apiClient.get<XpCountFromDto>('/xp/count-from', { params: { clubId } }).then((r) => r.data),

  /** date = null clears the cutoff (all history counts again). */
  setXpCountFrom: (clubId: number, date: string | null) =>
    apiClient
      .put<XpCountFromDto>('/xp/count-from', { clubId, xpCountFromDate: date })
      .then((r) => r.data),
}
