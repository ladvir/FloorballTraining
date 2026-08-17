import { apiClient } from './axios'
import type { AppointmentDto, VideoDto } from '../types/domain.types'

const startOfTodayIso = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Mirrors RatingsController's RatingWindowDays - events past this age can no longer be rated,
 * so there's no point fetching them into the "to rate" list. */
const RATING_WINDOW_DAYS = 3

const daysAgoIso = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/** Events visible to the player: their team(s)' planned events + their own personal/home-training ones. */
export const appointmentsApi = {
  getUpcoming: () =>
    apiClient
      .get('/appointments', { params: { start: startOfTodayIso(), pageSize: 100 } })
      .then((r) => (r.data?.data ?? r.data?.Data ?? []) as AppointmentDto[]),

  // Already-ended events still inside the rating window, newest first.
  getRateable: () =>
    apiClient
      .get('/appointments', {
        params: {
          start: daysAgoIso(RATING_WINDOW_DAYS),
          end: new Date().toISOString(),
          sort: 'startdesc',
          pageSize: 100,
        },
      })
      .then((r) => (r.data?.data ?? r.data?.Data ?? []) as AppointmentDto[]),

  // #131: videos attached to an event, shown inline in EventsScreen.
  getVideos: (id: number) => apiClient.get<VideoDto[]>(`/appointments/${id}/videos`).then((r) => r.data),
}
