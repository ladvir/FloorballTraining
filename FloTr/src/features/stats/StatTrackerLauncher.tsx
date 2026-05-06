import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Plus, Settings, ChevronRight } from 'lucide-react'
import { statTrackersApi } from '../../api/index'
import type { StatEventCategory } from '../../types/domain.types'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { StatTrackerReportTable } from './StatTrackerReportTable'

interface Props {
  eventCategory: StatEventCategory
  /** Use one of these two */
  tournamentMatchId?: number
  appointmentId?: number
  teamId: number
  canEdit?: boolean
  /** Hide the report table; show only buttons. Default false. */
  compact?: boolean
}

export function StatTrackerLauncher({
  eventCategory,
  tournamentMatchId,
  appointmentId,
  teamId,
  canEdit = true,
  compact = false,
}: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const eventType = tournamentMatchId ? 'tournamentMatch' : 'appointment'
  const eventId = tournamentMatchId ?? appointmentId

  const queryKey = ['stat-tracker', eventType, eventId, teamId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => statTrackersApi.getForEvent({
      type: eventType,
      id: eventId!,
      teamId,
    }),
    enabled: !!eventId,
  })

  const tracker = data?.[0]

  const createMutation = useMutation({
    mutationFn: () => statTrackersApi.create({
      eventCategory,
      tournamentMatchId: tournamentMatchId ?? null,
      appointmentId: appointmentId ?? null,
      teamId,
    }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey })
      navigate(`/stats/${created.id}/setup`)
    },
  })

  if (isLoading) return <LoadingSpinner />

  if (!tracker) {
    if (!canEdit) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <BarChart3 className="h-4 w-4" />
          Žádné statistiky
        </div>
      )
    }
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
      >
        <Plus className="h-4 w-4" />
        Vytvořit statistiku
      </Button>
    )
  }

  const hasParticipants = tracker.participants.length > 0
  const hasMetrics = tracker.metrics.length > 0
  const ready = hasParticipants && hasMetrics

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ready && (
          <Button size="sm" onClick={() => navigate(`/stats/${tracker.id}/live`)}>
            <BarChart3 className="h-4 w-4" />
            Zápis statistik
          </Button>
        )}
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => navigate(`/stats/${tracker.id}/setup`)}>
            <Settings className="h-4 w-4" />
            {ready ? 'Upravit nastavení' : 'Dokončit nastavení'}
          </Button>
        )}
        {!compact && ready && (
          <Button size="sm" variant="ghost" onClick={() => navigate(`/stats/${tracker.id}/live`)}>
            Detail
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!compact && ready && (
        <StatTrackerReportTable tracker={tracker} compact />
      )}
    </div>
  )
}
