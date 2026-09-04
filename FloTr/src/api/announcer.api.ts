import { apiClient } from './axios'
import type { AnnouncerLibraryItemDto } from '../types/domain.types'

/** Per-user Hlasatel library — saved announcements, server-persisted. */
export const announcerApi = {
  list: () => apiClient.get<AnnouncerLibraryItemDto[]>('/announcerlibrary').then((r) => r.data),
  create: (name: string, text: string) =>
    apiClient
      .post<AnnouncerLibraryItemDto>('/announcerlibrary', { name, text })
      .then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/announcerlibrary/${id}`),
}
