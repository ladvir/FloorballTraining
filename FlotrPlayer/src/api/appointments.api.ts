import { apiClient } from './axios'
import type { AppointmentDto } from '../types/domain.types'

const startOfTodayIso = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Events visible to the player: their team(s)' planned events + their own personal/home-training ones. */
export const appointmentsApi = {
  getUpcoming: () =>
    apiClient
      .get('/appointments', { params: { start: startOfTodayIso(), pageSize: 100 } })
      .then((r) => (r.data?.data ?? r.data?.Data ?? []) as AppointmentDto[]),
}
