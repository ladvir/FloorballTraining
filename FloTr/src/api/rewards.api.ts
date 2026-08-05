import { apiClient } from './axios'
import type {
  ClubRewardDto,
  MemberRewardClaimDto,
  RewardListDto,
  SaveClubRewardDto,
} from '../types/domain.types'

/** Real-world rewards (#105): club-wide + team extensions, grant audit and fulfillment. */
export const rewardsApi = {
  /** Reward definitions for a scope: pass teamId (club-wide + team) or clubId (club-wide only). */
  list: (params: { clubId?: number; teamId?: number }) =>
    apiClient.get<RewardListDto>('/rewards', { params }).then((r) => r.data),

  create: (dto: SaveClubRewardDto) =>
    apiClient.post<ClubRewardDto>('/rewards', dto).then((r) => r.data),

  update: (id: number, dto: SaveClubRewardDto) =>
    apiClient.put<ClubRewardDto>(`/rewards/${id}`, dto).then((r) => r.data),

  remove: (id: number) => apiClient.delete(`/rewards/${id}`),

  /** Grant audit (who / when / what / handed over by). Same scope params as list. */
  claims: (params: { clubId?: number; teamId?: number }) =>
    apiClient.get<MemberRewardClaimDto[]>('/rewards/claims', { params }).then((r) => r.data),

  fulfill: (id: number) =>
    apiClient.post<MemberRewardClaimDto>(`/rewards/claims/${id}/fulfill`).then((r) => r.data),

  unfulfill: (id: number) =>
    apiClient.post<MemberRewardClaimDto>(`/rewards/claims/${id}/unfulfill`).then((r) => r.data),

  /** A single player's earned rewards ("my rewards"). */
  memberClaims: (memberId: number) =>
    apiClient.get<MemberRewardClaimDto[]>(`/rewards/member/${memberId}`).then((r) => r.data),
}
