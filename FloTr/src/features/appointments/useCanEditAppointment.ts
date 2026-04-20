import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import type { AppointmentDto } from '../../types/domain.types'

export function useCanEditAppointment(apt: AppointmentDto | undefined): boolean {
  const { isAdmin, user, clubMemberships } = useAuthStore()

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
    enabled: apt?.teamId != null,
  })

  if (!apt) return false
  if (isAdmin) return true
  if (user && apt.ownerUserId === user.id) return true

  if (apt.teamId != null) {
    const team = teams?.find((t) => t.id === apt.teamId)
    if (!team?.clubId) return false
    return clubMemberships.some((m) => {
      if (m.clubId !== team.clubId) return false
      if (m.effectiveRole === 'Admin' || m.effectiveRole === 'ClubAdmin' || m.effectiveRole === 'HeadCoach')
        return true
      if (m.effectiveRole === 'Coach' && m.coachTeamIds.includes(apt.teamId!))
        return true
      return false
    })
  }

  // Personal event: only owner or Admin (both handled above).
  return false
}
