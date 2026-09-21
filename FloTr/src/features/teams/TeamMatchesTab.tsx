import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, MapPin, Swords, ChevronDown, ChevronUp } from 'lucide-react'
import { dfLocale } from '../../utils/dateLocale'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { appointmentsApi, statTrackersApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { StatTrackerReportTable } from '../stats/StatTrackerReportTable'
import { StatTrackerLauncher } from '../stats/StatTrackerLauncher'
import { AppointmentLineupSection } from '../appointments/AppointmentLineupSection'
import { RatingSection } from '../appointments/AppointmentDetailModal'
import type { AppointmentDto } from '../../types/domain.types'

const MATCH_TYPE = 3

/** All calendar events of type Match for this team, newest first. Past matches expand to their
 * recorded result, rating and stats (when any were entered); upcoming ones expand to the lineup
 * and stat-sheet setup. `focusAppointmentId` (deep link from the dashboard) auto-expands and
 * scrolls to that one match. */
export function TeamMatchesTab({
  teamId,
  focusAppointmentId,
}: {
  teamId: number
  focusAppointmentId?: number | null
}) {
  const { t } = useTranslation()
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
  })

  const matches = (appointments ?? [])
    .filter((a) => a.teamId === teamId && Number(a.appointmentType) === MATCH_TYPE)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())

  if (isLoading) return <LoadingSpinner />

  if (matches.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-400">{t('matches.noMatches')}</p>
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <MatchCard
          key={m.id}
          appointment={m}
          teamId={teamId}
          autoExpand={!!focusAppointmentId && m.id === focusAppointmentId}
        />
      ))}
    </div>
  )
}

function MatchCard({
  appointment,
  teamId,
  autoExpand,
}: {
  appointment: AppointmentDto
  teamId: number
  autoExpand?: boolean
}) {
  const { t } = useTranslation()
  const { effectiveRole, user } = useAuthStore()
  const canEdit =
    effectiveRole === 'Admin' ||
    effectiveRole === 'ClubAdmin' ||
    effectiveRole === 'HeadCoach' ||
    (effectiveRole === 'Coach' && (user?.coachTeamIds ?? []).includes(teamId))
  const [expanded, setExpanded] = useState(!!autoExpand)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isPast = new Date(appointment.end) < new Date()

  useEffect(() => {
    if (autoExpand) wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [autoExpand])

  // Fetched regardless of past/future — a coach can (accidentally or intentionally) record stats
  // ahead of the actual event date, and those must still show up here rather than being hidden.
  // An appointment can host more than one StatTracker (e.g. two matches back-to-back under one
  // calendar event), so every tracker found is rendered — not just the first.
  const { data: trackersData } = useQuery({
    queryKey: ['stat-tracker', 'appointment', appointment.id, teamId],
    queryFn: () => statTrackersApi.getForEvent({ type: 'appointment', id: appointment.id, teamId }),
  })
  const trackers = trackersData ?? []
  const hasStats = trackers.some((tr) => tr.participants.length > 0 && tr.metrics.length > 0)
  const trackerLabel = (tr: (typeof trackers)[number], idx: number) =>
    trackers.length > 1 ? tr.opponentName?.trim() || t('stats.matchLabel', { n: idx + 1 }) : null

  return (
    <div ref={wrapperRef}>
      <Card>
        <CardContent className="py-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Swords className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate font-medium text-gray-900">
                  {appointment.opponentName?.trim() || t('stats.opponentFallback')}
                </span>
                {trackers.length === 1 &&
                  (trackers[0].homeScore > 0 || trackers[0].awayScore > 0) && (
                    <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-sky-700">
                      {trackers[0].homeScore} : {trackers[0].awayScore}
                    </span>
                  )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                <span>
                  {format(parseISO(appointment.start), 'd. M. yyyy HH:mm', { locale: dfLocale() })}
                </span>
                {appointment.locationName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {appointment.locationName}
                  </span>
                )}
                {!isPast && (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                    {t('matches.upcoming')}
                  </span>
                )}
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              {isPast ? (
                <>
                  {hasStats ? (
                    <div className="space-y-3">
                      {trackers.map((tr, idx) => (
                        <div key={tr.id} className="space-y-1.5">
                          {trackerLabel(tr, idx) && (
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {trackerLabel(tr, idx)}
                            </p>
                          )}
                          {tr.participants.length > 0 && tr.metrics.length > 0 ? (
                            <StatTrackerReportTable tracker={tr} compact />
                          ) : (
                            <p className="text-xs italic text-gray-400">
                              {t('matches.noStatsForMatch')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-gray-400">{t('matches.noStatsForMatch')}</p>
                  )}
                  <RatingSection appointmentId={appointment.id} />
                </>
              ) : (
                <>
                  {hasStats && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{t('matches.statsEnteredEarlyWarning')}</span>
                      </div>
                      {trackers.map((tr, idx) =>
                        tr.participants.length > 0 && tr.metrics.length > 0 ? (
                          <div key={tr.id} className="space-y-1.5">
                            {trackerLabel(tr, idx) && (
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {trackerLabel(tr, idx)}
                              </p>
                            )}
                            <StatTrackerReportTable tracker={tr} compact />
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                  <AppointmentLineupSection appointmentId={appointment.id} teamId={teamId} />
                  <StatTrackerLauncher
                    eventCategory={0}
                    appointmentId={appointment.id}
                    teamId={teamId}
                    canEdit={canEdit}
                    compact
                  />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
