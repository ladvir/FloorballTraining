import { apiClient } from './axios'
import type { AiRecommendationsResultDto, PlayerReportDto } from '../types/domain.types'

export const memberReportApi = {
  getReport: (memberId: number) =>
    apiClient.get<PlayerReportDto>(`/members/${memberId}/report`).then((r) => r.data),

  /** 3–5 AI development recommendations grounded in the activity library. */
  getRecommendations: (memberId: number) =>
    apiClient
      .post<AiRecommendationsResultDto>(`/members/${memberId}/report/recommendations`)
      .then((r) => r.data),

  downloadPdf: (memberId: number, options: { anonymized: boolean; includeAi: boolean }) =>
    apiClient
      .get(`/members/${memberId}/report/pdf`, {
        params: options,
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),
}
