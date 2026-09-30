import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { statTrackersApi, teamsApi } from '../../api/index'
import { STANDARD_STAT_METRICS } from '../../types/domain.types'
import { formatFullName } from '../../utils/name'
import { toast } from '../../utils/toast'
import type { AppointmentDto } from '../../types/domain.types'

interface Row {
  memberId: number
  name: string
  lastName: string
  firstName: string
  played: boolean
  goals: string
  assists: string
}

/** Lightweight retroactive stat entry for a past match: opponent, final score, goals/assists and
 * participation per player — no lineup, no live tap-tracking. Posts through the same StatTracker
 * endpoints as the full setup/live flow (create → setup → repeated ±1 entries/score), just driven
 * by typed totals instead of taps, so reports and player summaries stay identical either way. */
export function QuickStatEntryModal({
  appointment,
  teamId,
  onClose,
}: {
  appointment: AppointmentDto
  teamId: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId),
  })

  const opponentLocked = !!appointment.opponentId
  const [opponentName, setOpponentName] = useState(appointment.opponentName ?? '')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)

  // Hydrate the roster once the team loads (render-time state adjustment, same pattern as
  // StatTrackerSetupPage's metric/opponent hydration).
  if (team && rows === null) {
    setRows(
      (team.teamMembers ?? [])
        .filter((tm) => tm.isPlayer)
        .map((tm) => ({
          memberId: tm.memberId,
          name: tm.member
            ? formatFullName(tm.member.firstName, tm.member.lastName)
            : String(tm.memberId),
          lastName: tm.member?.lastName ?? '',
          firstName: tm.member?.firstName ?? '',
          played: true,
          goals: '',
          assists: '',
        }))
        .sort(
          (a, b) =>
            a.lastName.localeCompare(b.lastName, 'cs') ||
            a.firstName.localeCompare(b.firstName, 'cs')
        )
    )
  }

  const updateRow = (memberId: number, field: 'goals' | 'assists', value: string) => {
    setRows((prev) => prev!.map((r) => (r.memberId === memberId ? { ...r, [field]: value } : r)))
  }

  const togglePlayed = (memberId: number) => {
    setRows((prev) =>
      prev!.map((r) =>
        r.memberId === memberId ? { ...r, played: !r.played, goals: '', assists: '' } : r
      )
    )
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const played = (rows ?? []).filter((r) => r.played)
      const created = await statTrackersApi.create({
        eventCategory: 0,
        appointmentId: appointment.id,
        teamId,
      })

      const metrics = STANDARD_STAT_METRICS.filter(
        (m) => m.code === 'goals' || m.code === 'assists'
      )
      const setUp = await statTrackersApi.setup(created.id, {
        participants: played.map((r, i) => ({
          memberId: r.memberId,
          role: 0 as const,
          sortOrder: i,
        })),
        metrics: metrics.map((m, i) => ({ ...m, sortOrder: i })),
        matchLineupId: null,
      })

      if (!opponentLocked) {
        await statTrackersApi.updateMatch(created.id, {
          opponentName: opponentName.trim() || null,
          matchPeriodCount: null,
          matchPartDurationMinutes: null,
          currentPeriod: null,
        })
      }

      const goalsMetricId = setUp.metrics.find((m) => m.code === 'goals')?.id
      const assistsMetricId = setUp.metrics.find((m) => m.code === 'assists')?.id
      for (const row of played) {
        const participantId = setUp.participants.find((p) => p.memberId === row.memberId)?.id
        if (!participantId) continue
        const goals = Math.max(0, Number(row.goals) || 0)
        const assists = Math.max(0, Number(row.assists) || 0)
        for (let i = 0; i < goals && goalsMetricId; i++) {
          await statTrackersApi.addEntry(created.id, { participantId, metricId: goalsMetricId })
        }
        for (let i = 0; i < assists && assistsMetricId; i++) {
          await statTrackersApi.addEntry(created.id, { participantId, metricId: assistsMetricId })
        }
      }

      const home = Math.max(0, Number(homeScore) || 0)
      const away = Math.max(0, Number(awayScore) || 0)
      for (let i = 0; i < home; i++) await statTrackersApi.addScore(created.id, { side: 'home' })
      for (let i = 0; i < away; i++) await statTrackersApi.addScore(created.id, { side: 'away' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stat-tracker', 'appointment', appointment.id, teamId] })
      toast.success(t('matches.quickEntrySuccess'))
      onClose()
    },
  })

  const playedCount = rows?.filter((r) => r.played).length ?? 0

  return (
    <Modal isOpen onClose={onClose} title={t('matches.quickEntryTitle')} maxWidth="lg">
      {isLoading || rows === null ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
              {t('tournaments.matchOpponent')}
            </span>
            {opponentLocked ? (
              <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                {appointment.opponentName}
              </div>
            ) : (
              <input
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder={t('stats.opponentPlaceholder')}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
              {t('matches.quickEntryScoreLabel')}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-24 truncate text-sm text-gray-700">{team?.name}</span>
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="h-9 w-16 rounded-lg border border-gray-300 px-2 text-center text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <span className="text-gray-400">:</span>
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="h-9 w-16 rounded-lg border border-gray-300 px-2 text-center text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <span className="flex-1 truncate text-sm text-gray-700">
                {opponentLocked
                  ? appointment.opponentName
                  : opponentName || t('stats.opponentFallback')}
              </span>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm italic text-gray-400">{t('teams.noMembers')}</p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                  <tr>
                    <th className="w-8 px-3 py-2 text-left">{t('matches.quickEntryPlayedCol')}</th>
                    <th className="px-3 py-2 text-left">{t('common.player')}</th>
                    <th className="w-20 px-3 py-2 text-center">{t('stats.colGoals')}</th>
                    <th className="w-20 px-3 py-2 text-center">{t('stats.colAssists')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.memberId} className={r.played ? '' : 'opacity-50'}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={r.played}
                          onChange={() => togglePlayed(r.memberId)}
                          className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          disabled={!r.played}
                          value={r.goals}
                          onChange={(e) => updateRow(r.memberId, 'goals', e.target.value)}
                          className="h-8 w-14 rounded border border-gray-300 px-2 text-center text-sm disabled:bg-gray-50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          disabled={!r.played}
                          value={r.assists}
                          onChange={(e) => updateRow(r.memberId, 'assists', e.target.value)}
                          className="h-8 w-14 rounded border border-gray-300 px-2 text-center text-sm disabled:bg-gray-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={playedCount === 0}
            >
              {t('common.save')}
            </Button>
          </div>

          {saveMutation.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{t('common.error')}</div>
          )}
        </div>
      )}
    </Modal>
  )
}
