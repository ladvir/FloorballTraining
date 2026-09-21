import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Plus, Settings, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { statTrackersApi } from '../../api/index'
import type { StatEventCategory, StatTrackerDto } from '../../types/domain.types'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { StatTrackerReportTable } from './StatTrackerReportTable'
import { withReturnTo } from './statsReturnTo'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = `${location.pathname}${location.search}`
  const qc = useQueryClient()

  const eventType = tournamentMatchId ? 'tournamentMatch' : 'appointment'
  const eventId = tournamentMatchId ?? appointmentId

  const queryKey = ['stat-tracker', eventType, eventId, teamId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      statTrackersApi.getForEvent({
        type: eventType,
        id: eventId!,
        teamId,
      }),
    enabled: !!eventId,
  })

  // A single event (appointment/tournament match) can legitimately host more than one
  // StatTracker — e.g. two matches played back-to-back under one calendar appointment.
  // Show every tracker found instead of only the first one, so a coach entering stats
  // for the second match doesn't land back on the first match's data.
  const trackers = data ?? []

  const createMutation = useMutation({
    mutationFn: () =>
      statTrackersApi.create({
        eventCategory,
        tournamentMatchId: tournamentMatchId ?? null,
        appointmentId: appointmentId ?? null,
        teamId,
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey })
      navigate(withReturnTo(`/stats/${created.id}/setup`, fromPath))
    },
  })

  if (isLoading) return <LoadingSpinner />

  if (trackers.length === 0) {
    if (!canEdit) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <BarChart3 className="h-4 w-4" />
          {t('stats.noStats')}
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
        {t('common.create')}
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      {trackers.map((tracker, idx) => (
        <TrackerBlock
          key={tracker.id}
          tracker={tracker}
          label={
            trackers.length > 1
              ? tracker.opponentName?.trim() || t('stats.matchLabel', { n: idx + 1 })
              : null
          }
          canEdit={canEdit}
          compact={compact}
          navigate={navigate}
          fromPath={fromPath}
          t={t}
        />
      ))}
      {canEdit && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Plus className="h-4 w-4" />
          {t('stats.addAnother')}
        </Button>
      )}
    </div>
  )
}

function TrackerBlock({
  tracker,
  label,
  canEdit,
  compact,
  navigate,
  fromPath,
  t,
}: {
  tracker: StatTrackerDto
  label: string | null
  canEdit: boolean
  compact: boolean
  navigate: NavigateFunction
  fromPath: string
  t: TFunction
}) {
  const hasParticipants = tracker.participants.length > 0
  const hasMetrics = tracker.metrics.length > 0
  const ready = hasParticipants && hasMetrics

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {ready && (
          <Button
            size="sm"
            onClick={() => navigate(withReturnTo(`/stats/${tracker.id}/live`, fromPath))}
          >
            <BarChart3 className="h-4 w-4" />
            {t('stats.trackerLive')}
          </Button>
        )}
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(withReturnTo(`/stats/${tracker.id}/setup`, fromPath))}
          >
            <Settings className="h-4 w-4" />
            {ready ? t('common.edit') : t('stats.trackerSetup')}
          </Button>
        )}
        {!compact && ready && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(withReturnTo(`/stats/${tracker.id}/live`, fromPath))}
          >
            {t('common.detail')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!compact && ready && <StatTrackerReportTable tracker={tracker} compact />}
    </div>
  )
}
