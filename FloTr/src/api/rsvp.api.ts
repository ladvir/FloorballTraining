import { apiClient } from './axios'

export interface EventRsvpDto {
  appointmentId: number
  memberId: number
  memberFirstName?: string
  memberLastName?: string
  status: number // 0=Pending, 1=Yes, 2=No, 3=Maybe
  confirmedAt?: string
  note?: string
}

export interface AppointmentRsvpSummaryDto {
  myStatus?: number
  all: EventRsvpDto[]
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
  upsert: (appointmentId: number, status: number, note?: string) =>
    apiClient.put(`/appointments/${appointmentId}/rsvp`, { status, note }),
}
