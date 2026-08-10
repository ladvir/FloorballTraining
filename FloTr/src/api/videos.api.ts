import { apiClient } from './axios'
import type { VideoDto, VideoOwnerKind } from '../types/domain.types'

export const videosApi = {
  list: (ownerKind: VideoOwnerKind, ownerId: number) =>
    apiClient.get<VideoDto[]>(`/${ownerKind}/${ownerId}/videos`).then((r) => r.data),

  addFile: (
    ownerKind: VideoOwnerKind,
    ownerId: number,
    file: File,
    title: string | undefined,
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    return apiClient
      .post<VideoDto>(`/${ownerKind}/${ownerId}/videos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      .then((r) => r.data)
  },

  addLink: (ownerKind: VideoOwnerKind, ownerId: number, url: string, title?: string) =>
    apiClient
      .post<VideoDto>(`/${ownerKind}/${ownerId}/videos/link`, { url, title })
      .then((r) => r.data),

  delete: (ownerKind: VideoOwnerKind, ownerId: number, videoId: number) =>
    apiClient.delete(`/${ownerKind}/${ownerId}/videos/${videoId}`),
}
