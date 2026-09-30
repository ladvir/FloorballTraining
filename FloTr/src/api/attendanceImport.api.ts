import { apiClient } from './axios'
import type {
  AttendanceImportAnalyzeResultDto,
  AttendanceImportCommitRequestDto,
  AttendanceImportCommitResultDto,
} from '../types/domain.types'

export const attendanceImportApi = {
  analyze: (teamId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<AttendanceImportAnalyzeResultDto>(
        `/teams/${teamId}/attendance/import-analyze`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      .then((r) => r.data)
  },

  commit: (teamId: number, payload: AttendanceImportCommitRequestDto) =>
    apiClient
      .post<AttendanceImportCommitResultDto>(`/teams/${teamId}/attendance/import-commit`, payload)
      .then((r) => r.data),
}
