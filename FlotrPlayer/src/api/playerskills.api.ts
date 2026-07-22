import { apiClient } from './axios'
import type { PlayerSkillCardDto, PlayerSkillRosterMemberDto } from '../types/domain.types'

export const playerSkillsApi = {
  getMyCard: () => apiClient.get<PlayerSkillCardDto>('/playerskills/me').then((r) => r.data),

  getRoster: () => apiClient.get<PlayerSkillRosterMemberDto[]>('/playerskills/roster').then((r) => r.data),
}
