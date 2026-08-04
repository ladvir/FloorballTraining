import { apiClient } from './axios'
import type { FanCheckInRequest, FanChildDto } from '../types/domain.types'

export const fanApi = {
  getChildren: () => apiClient.get<FanChildDto[]>('/fan/children').then((r) => r.data),
  checkIn: (body: FanCheckInRequest) => apiClient.post('/fan/checkin', body).then((r) => r.data),
}
