import { apiClient } from './axios'
import type {
  PlayerSkillBatchItemDto,
  PlayerSkillCardDto,
  PlayerSkillHistoryEntryDto,
  PlayerSkillRosterMemberDto,
} from '../types/domain.types'

export const playerSkillsApi = {
  getMyCard: () => apiClient.get<PlayerSkillCardDto>('/playerskills/me').then((r) => r.data),

  getRoster: () => apiClient.get<PlayerSkillRosterMemberDto[]>('/playerskills/roster').then((r) => r.data),

  getCard: (memberId: number) =>
    apiClient.get<PlayerSkillCardDto>(`/playerskills/member/${memberId}`).then((r) => r.data),

  getSkillHistory: (memberId: number, skillId: number) =>
    apiClient
      .get<PlayerSkillHistoryEntryDto[]>(`/playerskills/member/${memberId}/skill/${skillId}/history`)
      .then((r) => r.data),

  saveBatch: (memberId: number, items: PlayerSkillBatchItemDto[]) =>
    apiClient.put<PlayerSkillCardDto>(`/playerskills/member/${memberId}`, { items }).then((r) => r.data),
}
