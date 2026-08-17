import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { statTrackersApi } from '../../api/index'
import type { PlayerStatsBySeasonDto, StatTrackerEventSummaryDto } from '../../types/domain.types'
import { calculateScoringRate } from './statsAggregation'

type Period = 'season' | 'year' | 'all'

interface ScoringRow {
  key: string
  seasonName: string
  teamName: string
  games: number
  goals: number
  assists: number
  points: number
  plusMinus: number
}

interface Props {
  memberId: number
}

/** Canadian scoring table (match events only) with a season / last-year / all period filter. */
export function CanadianScoringCard({ memberId }: Props) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<Period>('season')

  // eventCategory 0 = match events only (Canadian scoring is match-based)
  const { data, isLoading } = useQuery({
    queryKey: ['stats-member-scoring', memberId],
    queryFn: () => statTrackersApi.memberSummary(memberId, 0),
  })

  const events = useMemo(() => flattenEvents(data ?? []), [data])

  const latestSeasonId = useMemo(() => {
    const ids = (data ?? []).map((g) => g.seasonId).filter((id): id is number => id != null)
    return ids.length ? Math.max(...ids) : null
  }, [data])

  const rows = useMemo(
    () => buildRows(events, period, latestSeasonId, t('stats.noSeason')),
    [events, period, latestSeasonId, t]
  )

  const totals = useMemo(() => sumRows(rows), [rows])

  if (isLoading) return <LoadingSpinner />

  return (
    <Card>
      <CardContent className="py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Trophy className="h-4 w-4 text-sky-500" />
            {t('stats.canadianScoring')}
          </h3>
          <select
            aria-label={t('stats.periodLabel')}
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-sky-400 focus:outline-none"
          >
            <option value="season">{t('stats.periodSeason')}</option>
            <option value="year">{t('stats.periodYear')}</option>
            <option value="all">{t('stats.periodAll')}</option>
          </select>
        </div>

        {rows.length === 0 ? (
          <p className="py-3 text-center text-sm text-gray-500">{t('stats.noScoring')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">{t('stats.colSeason')}</th>
                  <th className="px-2 py-2 font-medium">{t('stats.colTeam')}</th>
                  <th className="px-2 py-2 text-right font-medium" title={t('stats.colGames')}>
                    {t('stats.colGamesShort')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium" title={t('stats.colGoals')}>
                    {t('stats.colGoalsShort')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium" title={t('stats.colAssists')}>
                    {t('stats.colAssistsShort')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium" title={t('stats.colPoints')}>
                    {t('stats.colPointsShort')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium" title={t('stats.colPlusMinus')}>
                    +/−
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-gray-100">
                    <td className="px-2 py-1.5 text-gray-700">{r.seasonName}</td>
                    <td className="px-2 py-1.5 text-gray-500">{r.teamName}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">{r.games}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">{r.goals}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">
                      {r.assists}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-gray-900">
                      {r.points}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">
                      {r.plusMinus > 0 ? `+${r.plusMinus}` : r.plusMinus}
                    </td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold text-gray-900">
                    <td className="px-2 py-1.5" colSpan={2}>
                      {t('stats.total')}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{totals.games}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{totals.goals}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{totals.assists}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{totals.points}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {totals.plusMinus > 0 ? `+${totals.plusMinus}` : totals.plusMinus}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            {totals.games > 0 && (
              <p className="mt-2 text-[11px] text-gray-400">
                {t('stats.pointsPerGame', {
                  value: calculateScoringRate(totals.points, totals.games).toFixed(2),
                })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function flattenEvents(groups: PlayerStatsBySeasonDto[]): StatTrackerEventSummaryDto[] {
  return groups.flatMap((g) => g.events).filter((e) => e.eventCategory === 0)
}

function buildRows(
  events: StatTrackerEventSummaryDto[],
  period: Period,
  latestSeasonId: number | null,
  noSeasonLabel: string
): ScoringRow[] {
  const now = Date.now()
  const yearAgo = now - 365 * 24 * 60 * 60 * 1000

  const filtered = events.filter((e) => {
    if (period === 'season') return latestSeasonId != null && e.seasonId === latestSeasonId
    if (period === 'year') return new Date(e.eventDate).getTime() >= yearAgo
    return true
  })

  const byKey = new Map<string, ScoringRow>()
  for (const e of filtered) {
    const key = `${e.seasonId ?? 0}|${e.teamId}`
    let row = byKey.get(key)
    if (!row) {
      row = {
        key,
        seasonName: e.seasonName ?? noSeasonLabel,
        teamName: e.teamName ?? '—',
        games: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plusMinus: 0,
      }
      byKey.set(key, row)
    }
    row.games += 1
    if (e.scoring) {
      row.goals += e.scoring.goals
      row.assists += e.scoring.assists
      row.points += e.scoring.points
      row.plusMinus += e.scoring.plusMinus
    }
  }

  return [...byKey.values()].sort(
    (a, b) => b.points - a.points || b.games - a.games || a.seasonName.localeCompare(b.seasonName)
  )
}

function sumRows(rows: ScoringRow[]): Omit<ScoringRow, 'key' | 'seasonName' | 'teamName'> {
  return rows.reduce(
    (acc, r) => ({
      games: acc.games + r.games,
      goals: acc.goals + r.goals,
      assists: acc.assists + r.assists,
      points: acc.points + r.points,
      plusMinus: acc.plusMinus + r.plusMinus,
    }),
    { games: 0, goals: 0, assists: 0, points: 0, plusMinus: 0 }
  )
}
