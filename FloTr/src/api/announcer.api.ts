import { apiClient } from './axios'
import type {
  AnnouncerLibraryItemDto,
  AnnouncerTtsStatusDto,
  AzureVoiceDto,
} from '../types/domain.types'

/** Per-user Hlasatel library — saved announcements, server-persisted. */
export const announcerApi = {
  list: () => apiClient.get<AnnouncerLibraryItemDto[]>('/announcerlibrary').then((r) => r.data),
  create: (name: string, text: string) =>
    apiClient
      .post<AnnouncerLibraryItemDto>('/announcerlibrary', { name, text })
      .then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/announcerlibrary/${id}`),
}

/** Azure AI Speech proxy — the user's region+key stays on the server; we send SSML, get MP3. */
export const announcerTtsApi = {
  getStatus: () =>
    apiClient.get<AnnouncerTtsStatusDto>('/announcer/tts/status').then((r) => r.data),
  saveKey: (region: string, apiKey: string) =>
    apiClient
      .put<AnnouncerTtsStatusDto>('/announcer/tts/key', { region, apiKey })
      .then((r) => r.data),
  deleteKey: () => apiClient.delete('/announcer/tts/key'),
  getVoices: () => apiClient.get<AzureVoiceDto[]>('/announcer/tts/voices').then((r) => r.data),
  speak: async (ssml: string): Promise<Blob> => {
    try {
      const r = await apiClient.post('/announcer/tts/speak', { ssml }, { responseType: 'blob' })
      return r.data as Blob
    } catch (e) {
      // With responseType 'blob' the error body is a Blob too — surface its text.
      const data = (e as { response?: { data?: unknown } })?.response?.data
      if (data instanceof Blob) {
        const txt = await data.text().catch(() => '')
        if (txt) throw new Error(txt)
      }
      throw e
    }
  },
}
