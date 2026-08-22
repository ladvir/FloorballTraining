import { apiClient } from './axios'
import type { VideoAnnotationDto, VideoOwnerKind } from '../types/domain.types'

export interface SaveVideoAnnotationRequest {
  trimStartMs: number | null
  trimEndMs: number | null
  dataJson: string
}

export const videoAnnotationsApi = {
  /** Null when nothing has been saved for this video yet. */
  get: (ownerKind: VideoOwnerKind, ownerId: number, videoId: number) =>
    apiClient
      .get<VideoAnnotationDto>(`/${ownerKind}/${ownerId}/videos/${videoId}/annotation`, {
        validateStatus: (status) => status === 200 || status === 204,
      })
      .then((r) => (r.status === 204 ? null : r.data)),

  save: (
    ownerKind: VideoOwnerKind,
    ownerId: number,
    videoId: number,
    body: SaveVideoAnnotationRequest
  ) =>
    apiClient
      .put<VideoAnnotationDto>(`/${ownerKind}/${ownerId}/videos/${videoId}/annotation`, body)
      .then((r) => r.data),
}
