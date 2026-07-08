import type { AppointmentDto } from '../../types/domain.types'

export type EventScope = 'team' | 'personal' | 'assigned' | 'assigned-done' | 'has-assignments'

export function getEventScope(apt: AppointmentDto, isCoach: boolean): EventScope {
  if (apt.isAssignedToMe) {
    return apt.myAssignmentCompleted ? 'assigned-done' : 'assigned'
  }
  if (!apt.teamId) return 'personal'
  if (isCoach && apt.memberAssignments && apt.memberAssignments.length > 0) return 'has-assignments'
  return 'team'
}

export function scopeDateBg(scope: EventScope): string {
  if (scope === 'assigned') return 'bg-purple-50 text-purple-600'
  if (scope === 'assigned-done') return 'bg-green-50 text-green-600'
  if (scope === 'personal') return 'bg-amber-50 text-amber-600'
  if (scope === 'has-assignments') return 'bg-orange-50 text-orange-600'
  return 'bg-sky-50 text-sky-600'
}
