import { apiClient } from './axios'
import type {
  AiCredentialDto,
  AiConsentDto,
  AiKeyCheckResultDto,
  AiProvider,
  AiSettingsDto,
  AiStatusDto,
  AiUsageFilter,
  AiUsageLogsPageDto,
  AiUsageSummaryDto,
  CreateAiCredentialRequest,
  EligibleCredentialDto,
  UpdateAiCredentialRequest,
  UpdateAiSettingsRequest,
} from '../types/domain.types'

export const aiApi = {
  // ── My AI subscriptions (BYOK credentials; the key is never returned) ──────
  getCredentials: () => apiClient.get<AiCredentialDto[]>('/aicredentials').then((r) => r.data),
  createCredential: (data: CreateAiCredentialRequest) =>
    apiClient.post<AiCredentialDto>('/aicredentials', data).then((r) => r.data),
  updateCredential: (id: number, data: UpdateAiCredentialRequest) =>
    apiClient.put<AiCredentialDto>(`/aicredentials/${id}`, data).then((r) => r.data),
  deleteCredential: (id: number) => apiClient.delete(`/aicredentials/${id}`),
  activateCredential: (id: number) =>
    apiClient.post<AiCredentialDto>(`/aicredentials/${id}/activate`).then((r) => r.data),
  validateKey: (provider: AiProvider, apiKey: string) =>
    apiClient
      .post<AiKeyCheckResultDto>('/aicredentials/validate', { provider, apiKey })
      .then((r) => r.data),
  validateCredential: (id: number) =>
    apiClient.post<AiKeyCheckResultDto>(`/aicredentials/${id}/validate`).then((r) => r.data),
  shareWithClub: (id: number, clubId: number) =>
    apiClient.post<AiConsentDto>(`/aicredentials/${id}/share`, { clubId }).then((r) => r.data),
  revokeConsent: (id: number, consentId: number) =>
    apiClient.delete(`/aicredentials/${id}/share/${consentId}`),

  // ── Settings (global kill-switch + per-club enablement/defaults) ──────────
  getGlobalSettings: () => apiClient.get<AiSettingsDto>('/aisettings/global').then((r) => r.data),
  updateGlobalSettings: (data: UpdateAiSettingsRequest) =>
    apiClient.put<AiSettingsDto>('/aisettings/global', data).then((r) => r.data),
  getClubSettings: (clubId: number) =>
    apiClient.get<AiSettingsDto>(`/aisettings/club/${clubId}`).then((r) => r.data),
  updateClubSettings: (clubId: number, data: UpdateAiSettingsRequest) =>
    apiClient.put<AiSettingsDto>(`/aisettings/club/${clubId}`, data).then((r) => r.data),
  getClubEligibleCredentials: (clubId: number) =>
    apiClient
      .get<EligibleCredentialDto[]>(`/aisettings/club/${clubId}/credentials`)
      .then((r) => r.data),
  getAllClubSettings: () => apiClient.get<AiSettingsDto[]>('/aisettings/clubs').then((r) => r.data),

  /** Availability of AI for the current user in a club — drives button visibility. */
  getStatus: (clubId: number | null | undefined) =>
    apiClient
      .get<AiStatusDto>('/aisettings/status', { params: { clubId: clubId ?? undefined } })
      .then((r) => r.data),

  // ── Usage analytics (metadata only) ────────────────────────────────────────
  getUsageSummary: (filter: AiUsageFilter) =>
    apiClient.get<AiUsageSummaryDto>('/aiusage/summary', { params: filter }).then((r) => r.data),
  getUsageLogs: (filter: AiUsageFilter & { page?: number; pageSize?: number }) =>
    apiClient.get<AiUsageLogsPageDto>('/aiusage/logs', { params: filter }).then((r) => r.data),
}
