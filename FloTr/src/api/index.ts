import { apiClient } from './axios'
import type { TeamDto, ClubDto, MemberDto, AppointmentDto, EquipmentDto, PlaceDto, SeasonDto, TagDto, AgeGroupDto, DashboardDto, AuthResponse, UserPreferencesDto } from '../types/domain.types'

export const authApi = {
  updatePreferences: (data: UserPreferencesDto) =>
    apiClient.put<AuthResponse>('/auth/preferences', data).then((r) => r.data),
}

export const teamsApi = {
  getAll: () => apiClient.get<TeamDto[]>('/teams').then((r) => r.data),
  getById: (id: number) => apiClient.get<TeamDto>(`/teams/${id}`).then((r) => r.data),
  create: (data: Partial<TeamDto>) => apiClient.post<TeamDto>('/teams', data).then((r) => r.data),
  // Backend: PUT /teams with full DTO in body (id included in DTO)
  update: (data: Partial<TeamDto>) => apiClient.put('/teams', data),
  // Backend: DELETE /teams with id as body
  delete: (id: number) => apiClient.delete('/teams', { data: id }),
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
}

export const seasonsApi = {
  getAll: () => apiClient.get<SeasonDto[]>('/seasons/all').then((r) => r.data),
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
