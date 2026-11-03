import { apiClient } from './axios'

export interface TeamGuestDto {
  linkId: number
  userId: string
  email: string
  firstName: string
  lastName: string
}

interface GuestCredentials {
  emailSent: boolean
  password: string | null
}

/** Read-only guest accounts of a team. HeadCoach+ manages them. */
export const teamGuestsApi = {
  list: (teamId: number) =>
    apiClient.get<TeamGuestDto[]>(`/teams/${teamId}/guests`).then((r) => r.data),
  add: (
    teamId: number,
    data: {
      email: string
      firstName: string
      lastName: string
      sendCredentials: boolean
      language: string
      password?: string
    }
  ) => apiClient.post<GuestCredentials>(`/teams/${teamId}/guests`, data).then((r) => r.data),
  remove: (teamId: number, linkId: number) => apiClient.delete(`/teams/${teamId}/guests/${linkId}`),
  resend: (teamId: number, linkId: number) =>
    apiClient
      .post<GuestCredentials>(`/teams/${teamId}/guests/${linkId}/resend`)
      .then((r) => r.data),
}
