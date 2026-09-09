import { apiClient } from './axios'

/** GET /appointments/{id}/rsvp — status: 0=Pending, 1=Yes ("Jdu"), 2=No ("Nejdu"), 3=Maybe. */
export interface AppointmentRsvpSummaryDto {
  myStatus?: number
  countYes: number
  countNo: number
  countMaybe: number
  countPending: number
}

export const rsvpApi = {
  get: (appointmentId: number) =>
    apiClient
      .get<AppointmentRsvpSummaryDto>(`/appointments/${appointmentId}/rsvp`)
      .then((r) => r.data),
  // Player self-RSVP; the backend resolves the member from the caller's account.
  upsert: (appointmentId: number, status: number) =>
    apiClient.put(`/appointments/${appointmentId}/rsvp`, { status }),
}
