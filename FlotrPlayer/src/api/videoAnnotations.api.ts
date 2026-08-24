import { apiClient } from './axios'
import type { VideoAnnotationDto } from '../types/domain.types'

// FlotrPlayer only ever shows appointment-owned videos (#131), unlike FloTr's web editor which
// also supports Trainings/Activities - so the owner kind is hardcoded here (#142).
export const videoAnnotationsApi = {
  /** Null when nothing has been saved for this video's analysis yet (#137). */
  get: (appointmentId: number, videoId: number) =>
    apiClient
      .get<VideoAnnotationDto>(`/appointments/${appointmentId}/videos/${videoId}/annotation`, {
        validateStatus: (status) => status === 200 || status === 204,
      })
      .then((r) => (r.status === 204 ? null : r.data)),
}
