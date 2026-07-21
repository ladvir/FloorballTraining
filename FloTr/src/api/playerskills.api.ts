import { apiClient } from './axios'
import type {
  PlayerSkillBatchUpdateDto,
  PlayerSkillCardDto,
  PlayerSkillHistoryEntryDto,
  PlayerSkillPosition,
  PlayerSkillRosterMemberDto,
  SkillCatalogEntryDto,
} from '../types/domain.types'

export const playerSkillsApi = {
  getRoster: () =>
    apiClient.get<PlayerSkillRosterMemberDto[]>('/playerskills/roster').then((r) => r.data),

  getCatalog: () =>
    apiClient.get<SkillCatalogEntryDto[]>('/playerskills/catalog').then((r) => r.data),

  getCard: (memberId: number) =>
    apiClient.get<PlayerSkillCardDto>(`/playerskills/member/${memberId}`).then((r) => r.data),

  getHistory: (memberId: number, skillId: number) =>
    apiClient
      .get<
        PlayerSkillHistoryEntryDto[]
      >(`/playerskills/member/${memberId}/skill/${skillId}/history`)
      .then((r) => r.data),

  saveBatch: (memberId: number, data: PlayerSkillBatchUpdateDto) =>
    apiClient.put<PlayerSkillCardDto>(`/playerskills/member/${memberId}`, data).then((r) => r.data),

  updateRole: (memberId: number, position: PlayerSkillPosition) =>
    apiClient
      .put<PlayerSkillCardDto>(`/playerskills/member/${memberId}/role`, { position })
      .then((r) => r.data),
}
