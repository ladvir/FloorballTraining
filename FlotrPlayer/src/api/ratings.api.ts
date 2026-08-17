import { apiClient } from './axios'
import type { AppointmentRatingDto, RateAppointmentRequest } from '../types/domain.types'

/** Player self-rating of a past event. The backend scopes GET /ratings to the caller's own
 * rating for non-coach roles, so this always returns 0 or 1 items for a Hráč account. */
export const ratingsApi = {
  getForAppointment: (appointmentId: number) =>
    apiClient.get<AppointmentRatingDto[]>('/ratings', { params: { appointmentId } }).then((r) => r.data),
  create: (data: RateAppointmentRequest) =>
    apiClient.post<AppointmentRatingDto>('/ratings', data).then((r) => r.data),
  update: (id: number, data: RateAppointmentRequest) =>
    apiClient.put<AppointmentRatingDto>(`/ratings/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/ratings/${id}`),
}
