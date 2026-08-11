import { apiClient } from './axios'
import type { AppointmentDto, VideoDto } from '../types/domain.types'

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

  // #131: videos attached to an event, shown inline in EventsScreen.
  getVideos: (id: number) => apiClient.get<VideoDto[]>(`/appointments/${id}/videos`).then((r) => r.data),
}
