import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import type { AppointmentDto, UserClubMembership } from '../../types/domain.types'
import type { TeamDto } from '../../types/domain.types'

/** Pure logic extracted from the hook — testable without React context. */
export function canEditAppointment(
  apt: AppointmentDto,
  isAdmin: boolean,
  userId: string | undefined,
  clubMemberships: UserClubMembership[],
  teams: TeamDto[] | undefined
): boolean {
  if (isAdmin) return true
  if (userId && apt.ownerUserId === userId) return true

  if (apt.teamId != null) {
    const team = teams?.find((t) => t.id === apt.teamId)
    if (!team?.clubId) return false
    return clubMemberships.some((m) => {
      if (m.clubId !== team.clubId) return false
      if (
        m.effectiveRole === 'Admin' ||
        m.effectiveRole === 'ClubAdmin' ||
        m.effectiveRole === 'HeadCoach'
      )
        return true
      if (m.effectiveRole === 'Coach' && m.coachTeamIds.includes(apt.teamId!)) return true
      return false
    })
  }

  // Personal event: only owner or Admin (both handled above).
  return false
}

export function useCanEditAppointment(apt: AppointmentDto | undefined): boolean {
  const { isAdmin, user, clubMemberships } = useAuthStore()

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
    enabled: apt?.teamId != null,
  })

  if (!apt) return false
  return canEditAppointment(apt, isAdmin, user?.id, clubMemberships, teams)
}
