import { apiClient } from './axios'
import type { TeamDto, ClubDto, ClubPublicDto, MemberDto, AppointmentDto, EquipmentDto, PlaceDto, SeasonDto, TagDto, AgeGroupDto, DashboardDto, AuthResponse, UserPreferencesDto, RoleRequestDto, AppointmentRatingDto, RatingStatsDto, TestDefinitionDto, TestResultDto, TestType, TestCategory } from '../types/domain.types'

export interface UpdateProfileDto {
  firstName?: string
  lastName?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export const authApi = {
  getMe: () =>
    apiClient.get<AuthResponse>('/auth/me').then((r) => r.data),
  updatePreferences: (data: UserPreferencesDto) =>
    apiClient.put<AuthResponse>('/auth/preferences', data).then((r) => r.data),
  updateProfile: (data: UpdateProfileDto) =>
    apiClient.put<AuthResponse>('/auth/profile', data).then((r) => r.data),
  setActiveClub: (clubId: number) =>
    apiClient.put<AuthResponse>('/auth/active-club', { clubId }).then((r) => r.data),
}

export interface ICalImportResult {
  imported: number
  skipped: number
  updated: number
  errors: string[]
}

export const teamsApi = {
  getAll: () => apiClient.get<TeamDto[]>('/teams').then((r) => r.data),
  getById: (id: number) => apiClient.get<TeamDto>(`/teams/${id}`).then((r) => r.data),
  create: (data: Partial<TeamDto>) => apiClient.post<TeamDto>('/teams', data).then((r) => r.data),
  // Backend: PUT /teams with full DTO in body (id included in DTO)
  update: (data: Partial<TeamDto>) => apiClient.put<TeamDto>('/teams', data).then((r) => r.data),
  // Backend: DELETE /teams with id as body
  delete: (id: number) => apiClient.delete('/teams', { data: id }),
  importICal: (teamId: number) =>
    apiClient.post<ICalImportResult>(`/teams/${teamId}/import-ical`).then((r) => r.data),
  copyToSeason: (teamId: number, data: { seasonId: number; newName?: string; copyMembers?: boolean }) =>
    apiClient.post<{ newTeamId: number }>(`/teams/${teamId}/copy-to-season`, data).then((r) => r.data),
  addMember: (teamId: number, data: { memberId: number; isCoach?: boolean; isPlayer?: boolean }) =>
    apiClient.post<{ id: number }>(`/teams/${teamId}/members`, { isPlayer: true, ...data }).then((r) => r.data),
  removeMember: (teamId: number, memberId: number) =>
    apiClient.delete(`/teams/${teamId}/members/${memberId}`),
}

export const clubsApi = {
  getAll: () => apiClient.get<ClubDto[]>('/clubs').then((r) => r.data),
  getById: (id: number) => apiClient.get<ClubDto>(`/clubs/${id}`).then((r) => r.data),
  create: (data: Partial<ClubDto>) => apiClient.post<ClubDto>('/clubs', data).then((r) => r.data),
  // Backend: PUT /clubs with full DTO in body
  update: (data: Partial<ClubDto>) => apiClient.put('/clubs', data),
  // Backend: DELETE /clubs with id as body
  delete: (id: number) => apiClient.delete('/clubs', { data: id }),
}

export const membersApi = {
  getAll: () => apiClient.get<MemberDto[]>('/members').then((r) => r.data),
  getById: (id: number) => apiClient.get<MemberDto>(`/members/${id}`).then((r) => r.data),
  create: (data: Partial<MemberDto>) => apiClient.post<MemberDto>('/members', data).then((r) => r.data),
  // Backend: PUT /members with full DTO in body
  update: (data: Partial<MemberDto>) => apiClient.put('/members', data),
  // Backend: DELETE /members with DTO as body
  delete: (data: Partial<MemberDto>) => apiClient.delete('/members', { data }),
  importExcel: (file: File, clubId: number, teamId?: number) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{
      totalRead: number
      imported: number
      skipped: number
      skippedNames: string[]
      errors: string[]
    }>(`/members/import-excel?clubId=${clubId}${teamId ? `&teamId=${teamId}` : ''}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}

export const appointmentsApi = {
  getAll: (params?: { start?: string; end?: string; pageSize?: number }) =>
    apiClient.get('/appointments', { params: { pageSize: 500, ...params } }).then((r) => {
      const body = r.data
      // Backend returns Pagination<AppointmentDto> with Data property (camelCase or PascalCase)
      const items = body?.data ?? body?.Data ?? (Array.isArray(body) ? body : [])
      return items as AppointmentDto[]
    }),
  getById: (id: number) => apiClient.get<AppointmentDto>(`/appointments/${id}`).then((r) => r.data),
  create: (data: Partial<AppointmentDto>) => apiClient.post('/appointments', data),
  update: (id: number, data: Partial<AppointmentDto>, updateWholeChain = false) =>
    apiClient.put('/appointments', { ...data, id }, { params: updateWholeChain ? { updateWholeChain: true } : undefined }),
  delete: (id: number, alsoFutureAppointments = false) =>
    apiClient.delete('/appointments', { data: id, params: alsoFutureAppointments ? { alsoFutureAppointments: true } : undefined }),
  deleteAll: () => apiClient.delete<{ deleted: number }>('/appointments/all').then((r) => r.data),
  importICal: (url: string, teamId: number) =>
    apiClient.post<ICalImportResult>('/appointments/import-ical', { url, teamId }).then((r) => r.data),
}

export const equipmentApi = {
  getAll: () => apiClient.get<EquipmentDto[]>('/equipments/all').then((r) => r.data),
  getById: (id: number) => apiClient.get<EquipmentDto>(`/equipments/${id}`).then((r) => r.data),
  create: (data: Partial<EquipmentDto>) => apiClient.post<EquipmentDto>('/equipments', data).then((r) => r.data),
  update: (id: number, data: Partial<EquipmentDto>) => apiClient.put(`/equipments/${id}`, data),
  delete: (id: number) => apiClient.delete(`/equipments/${id}`),
}

export const placesApi = {
  getAll: () => apiClient.get<PlaceDto[]>('/places/all').then((r) => r.data),
  getById: (id: number) => apiClient.get<PlaceDto>(`/places/${id}`).then((r) => r.data),
  create: (data: Partial<PlaceDto>) => apiClient.post<PlaceDto>('/places', data).then((r) => r.data),
  update: (id: number, data: Partial<PlaceDto>) => apiClient.put(`/places/${id}`, data),
  delete: (id: number) => apiClient.delete(`/places/${id}`),
  deleteUnused: () => apiClient.delete<{ deleted: number }>('/places/unused').then((r) => r.data),
}

export const seasonsApi = {
  getAll: (clubId?: number | null) =>
    apiClient.get<SeasonDto[]>('/seasons/all', { params: clubId ? { clubId } : undefined }).then((r) => r.data),
  getById: (id: number) => apiClient.get<SeasonDto>(`/seasons/${id}`).then((r) => r.data),
  // Backend: POST /seasons/add, PUT /seasons/edit, DELETE /seasons/delete/{id}
  create: (data: Partial<SeasonDto>) => apiClient.post('/seasons/add', data),
  update: (data: Partial<SeasonDto>) => apiClient.put('/seasons/edit', data),
  delete: (id: number) => apiClient.delete(`/seasons/delete/${id}`),
}

export const tagsApi = {
  getAll: () => apiClient.get<TagDto[]>('/tags/all').then((r) => r.data),
  getById: (id: number) => apiClient.get<TagDto>(`/tags/${id}`).then((r) => r.data),
  create: (data: Partial<TagDto>) => apiClient.post<TagDto>('/tags', data).then((r) => r.data),
  update: (id: number, data: Partial<TagDto>) => apiClient.put(`/tags/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tags/${id}`),
}

export const ageGroupsApi = {
  getAll: () => apiClient.get<AgeGroupDto[]>('/agegroups/all').then((r) => r.data),
}

export const dashboardApi = {
  get: () => apiClient.get<DashboardDto>('/dashboard').then((r) => r.data),
}

export const clubsPublicApi = {
  getAll: () => apiClient.get<ClubPublicDto[]>('/clubs/public').then((r) => r.data),
}

export const ratingsApi = {
  getAll: (appointmentId?: number) =>
    apiClient.get<AppointmentRatingDto[]>('/ratings', { params: appointmentId ? { appointmentId } : undefined }).then((r) => r.data),
  getMy: () => apiClient.get<AppointmentRatingDto[]>('/ratings/my').then((r) => r.data),
  getStats: () => apiClient.get<RatingStatsDto>('/ratings/stats').then((r) => r.data),
  getAverages: () => apiClient.get<Record<number, number>>('/ratings/averages').then((r) => r.data),
  getMyGrades: () => apiClient.get<Record<number, number>>('/ratings/my-grades').then((r) => r.data),
  create: (data: Partial<AppointmentRatingDto>) =>
    apiClient.post<AppointmentRatingDto>('/ratings', data).then((r) => r.data),
  update: (id: number, data: Partial<AppointmentRatingDto>) =>
    apiClient.put<AppointmentRatingDto>(`/ratings/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/ratings/${id}`),
}

export const testDefinitionsApi = {
  getAll: (params?: { clubId?: number; category?: TestCategory; testType?: TestType; search?: string }) =>
    apiClient.get<TestDefinitionDto[]>('/testdefinitions', { params }).then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<TestDefinitionDto>(`/testdefinitions/${id}`).then((r) => r.data),
  create: (data: Partial<TestDefinitionDto>) =>
    apiClient.post<TestDefinitionDto>('/testdefinitions', data).then((r) => r.data),
  update: (id: number, data: Partial<TestDefinitionDto>) =>
    apiClient.put<TestDefinitionDto>(`/testdefinitions/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/testdefinitions/${id}`),
  importTemplate: (clubId: number) =>
    apiClient.post<{ imported: number; skipped: number }>(`/testdefinitions/import-template?clubId=${clubId}`).then((r) => r.data),
}

export const testResultsApi = {
  getByMember: (memberId: number) =>
    apiClient.get<TestResultDto[]>(`/testresults/member/${memberId}`).then((r) => r.data),
  getMemberTestHistory: (memberId: number, testDefinitionId: number) =>
    apiClient.get<TestResultDto[]>(`/testresults/member/${memberId}/test/${testDefinitionId}`).then((r) => r.data),
  getByTeam: (teamId: number) =>
    apiClient.get<TestResultDto[]>(`/testresults/team/${teamId}`).then((r) => r.data),
  getTeamTest: (teamId: number, testDefinitionId: number) =>
    apiClient.get<TestResultDto[]>(`/testresults/team/${teamId}/test/${testDefinitionId}`).then((r) => r.data),
  create: (data: Partial<TestResultDto>) =>
    apiClient.post<TestResultDto>('/testresults', data).then((r) => r.data),
  createBatch: (data: Partial<TestResultDto>[]) =>
    apiClient.post<{ count: number }>('/testresults/batch', data).then((r) => r.data),
  update: (id: number, data: Partial<TestResultDto>) =>
    apiClient.put<TestResultDto>(`/testresults/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/testresults/${id}`),
}

export const roleRequestsApi = {
  getPending: () => apiClient.get<RoleRequestDto[]>('/rolerequests').then((r) => r.data),
  approve: (id: number) => apiClient.put(`/rolerequests/${id}/approve`),
  reject: (id: number) => apiClient.put(`/rolerequests/${id}/reject`),
}

export { lineupsApi, formationTemplatesApi } from './lineups.api'
