import { apiClient } from './axios'

export const assignmentsApi = {
  markComplete: (appointmentId: number, isCompleted: boolean) =>
    apiClient
      .put(`/appointments/${appointmentId}/assignments/complete`, null, { params: { isCompleted } })
      .then((r) => r.data),
}
