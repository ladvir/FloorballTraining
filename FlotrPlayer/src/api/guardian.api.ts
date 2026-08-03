import { apiClient } from './axios'
import type { GuardianChildDto } from '../types/domain.types'

export const guardianApi = {
  getChildren: () => apiClient.get<GuardianChildDto[]>('/guardian/children').then((r) => r.data),
}
