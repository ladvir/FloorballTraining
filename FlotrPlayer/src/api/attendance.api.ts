import { apiClient } from './axios'
import type { MemberAttendanceSummaryDto } from '../types/domain.types'

export const attendanceApi = {
  // A player may call this for their own memberId (MembersController allows owner / coach / admin).
  // Used on the home screen to only offer rating for team events the player was marked present at.
  getByMember: (memberId: number) =>
    apiClient
      .get<MemberAttendanceSummaryDto>(`/members/${memberId}/attendance`)
      .then((r) => r.data),
}
