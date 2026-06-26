import { apiClient } from './axios'
import type {
  AppointmentAttendanceDto,
  AttendanceUpsertDto,
  MemberAttendanceSummaryDto,
  TeamAttendanceSummaryDto,
} from '../types/domain.types'

export const attendanceApi = {
  getByAppointment: (appointmentId: number) =>
    apiClient
      .get<AppointmentAttendanceDto[]>(`/appointments/${appointmentId}/attendance`)
      .then((r) => r.data),

  upsert: (appointmentId: number, records: AttendanceUpsertDto[]) =>
    apiClient.put(`/appointments/${appointmentId}/attendance`, records),

  getByMember: (memberId: number) =>
    apiClient
      .get<MemberAttendanceSummaryDto>(`/members/${memberId}/attendance`)
      .then((r) => r.data),

  getByTeam: (teamId: number) =>
    apiClient.get<TeamAttendanceSummaryDto>(`/teams/${teamId}/attendance`).then((r) => r.data),
}
