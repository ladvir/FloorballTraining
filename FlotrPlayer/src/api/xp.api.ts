import { apiClient } from './axios'
import type { XpSummaryDto } from '../types/domain.types'

export const xpApi = {
  getSummary: (memberId: number) =>
    apiClient.get<XpSummaryDto>(`/xp/member/${memberId}`).then((r) => r.data),
}
