import { useTranslation } from 'react-i18next'
import type { StatTrackerDto } from '../../types/domain.types'

interface Props {
  tracker: StatTrackerDto
  compact?: boolean
}

export function StatTrackerReportTable({ tracker, compact = false }: Props) {
  const { t } = useTranslation()
  const sortedParticipants = [...tracker.participants].sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedMetrics = [...tracker.metrics].sort((a, b) => a.sortOrder - b.sortOrder)

  const getAggregate = (participantId: number, metricId: number) =>
    tracker.aggregates.find((a) => a.participantId === participantId && a.metricId === metricId)
  const getTotal = (participantId: number, metricId: number) =>
    getAggregate(participantId, metricId)?.total ?? 0

  // Report only lists players who actually have a recorded stat — not the whole roster.
  const participantsWithRecords = sortedParticipants.filter((p) =>
    tracker.aggregates.some((a) => a.participantId === p.id && a.total !== 0)
  )

  const isMatch = tracker.eventCategory === 0
  const periodCount = tracker.matchPeriodCount ?? 0
  const periods = periodCount > 1 ? Array.from({ length: periodCount }, (_, i) => i + 1) : []
  const partLabel =
    periodCount === 2
      ? t('stats.partLabelHalf')
      : periodCount === 3
        ? t('stats.partLabelThird')
        : periodCount === 4
          ? t('stats.partLabelQuarter')
          : t('stats.partLabelGeneric')

  if (sortedParticipants.length === 0 || sortedMetrics.length === 0) {
    return <p className="text-xs text-gray-500 italic">{t('stats.noStats')}</p>
  }

  return (
    <div className="space-y-3">
      {/* Match scoreboard summary */}
      {isMatch && (tracker.homeScore > 0 || tracker.awayScore > 0 || tracker.opponentName) && (
        <div
          className={`rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 ${compact ? 'text-xs' : 'text-sm'}`}
        >
          <div className="flex items-baseline justify-center gap-2 font-semibold">
            <span>{tracker.teamName ?? 'My'}</span>
            <span className="text-2xl tabular-nums text-sky-700">{tracker.homeScore}</span>
            <span className="text-gray-400">:</span>
            <span className="text-2xl tabular-nums text-rose-700">{tracker.awayScore}</span>
            <span>{tracker.opponentName?.trim() || t('stats.opponentFallback')}</span>
          </div>
          {periods.length > 0 && (
            <div className="mt-1 flex justify-center gap-3 text-xs text-gray-600">
              {periods.map((p) => (
                <span key={p} className="tabular-nums">
                  {p}.{partLabel.slice(0, 1).toUpperCase()}: {tracker.homeScoreByPeriod[p] ?? 0}:
                  {tracker.awayScoreByPeriod[p] ?? 0}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Totals table — players with at least one recorded stat */}
      {participantsWithRecords.length === 0 ? (
        <p className="text-xs text-gray-500 italic">{t('stats.noStats')}</p>
      ) : (
        <div
          className={`overflow-x-auto rounded-lg border border-gray-200 ${compact ? 'text-xs' : 'text-sm'}`}
        >
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className={`${compact ? 'px-2 py-1.5' : 'px-3 py-2'} font-medium`}>
                  {t('common.player')}
                </th>
                {sortedMetrics.map((m) => (
                  <th
                    key={m.id}
                    className={`${compact ? 'px-2 py-1.5' : 'px-3 py-2'} text-right font-medium`}
                    title={m.code}
                  >
                    {m.name}
                    {m.isGoalkeeper && <span className="ml-1 text-[10px] text-amber-600">B</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participantsWithRecords.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className={`${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
                    <span className="text-gray-900">
                      {p.firstName} {p.lastName}
                    </span>
                    {p.role === 1 && (
                      <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700">
                        B
                      </span>
                    )}
                  </td>
                  {sortedMetrics.map((m) => {
                    const dim = m.isGoalkeeper && p.role !== 1
                    const agg = getAggregate(p.id, m.id)
                    const total = getTotal(p.id, m.id)
                    const breakdown =
                      agg && periods.length > 0
                        ? periods.map((pp) => agg.byPeriod[pp] ?? 0).join(' / ')
                        : null
                    return (
                      <td
                        key={m.id}
                        className={`${compact ? 'px-2 py-1.5' : 'px-3 py-2'} text-right tabular-nums ${
                          dim
                            ? 'text-gray-300'
                            : total !== 0
                              ? 'font-semibold text-gray-900'
                              : 'text-gray-500'
                        }`}
                        title={
                          breakdown ? `${partLabel} 1..${periodCount}: ${breakdown}` : undefined
                        }
                      >
                        {dim ? '—' : total}
                        {breakdown && total !== 0 && (
                          <span
                            className={`block text-[10px] font-normal ${compact ? '' : 'mt-0.5'} text-gray-400`}
                          >
                            {breakdown}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {periods.length > 0 && !compact && (
        <p className="text-[10px] text-gray-400">{t('stats.breakdownNote', { partLabel })}</p>
      )}
    </div>
  )
}
