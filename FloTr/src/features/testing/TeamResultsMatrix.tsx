import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowUpDown, Trophy } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { testResultsApi, testDefinitionsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TestResultDto } from '../../types/domain.types'

const colourClasses = {
  green: 'text-green-600',
  orange: 'text-orange-600',
}

type SortKey = 'name' | number // 'name' or a testDefinitionId
type SortDir = 'asc' | 'desc'

interface TestStats {
  avg: number
  count: number
  // memberId -> rank within team (1 = best). from/to differ on shared places.
  rank: Map<number, { from: number; to: number }>
}

/** Read-only overview: latest result + trend + team rank per player (rows) × test (columns). */
export function TeamResultsMatrix({ teamId }: { teamId: number }) {
  const { t } = useTranslation()
  const { activeClubId } = useAuthStore()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { data: results, isLoading } = useQuery({
    queryKey: ['testResults', 'team', teamId, 'history'],
    queryFn: () => testResultsApi.getTeamHistory(teamId),
    enabled: teamId > 0,
  })

  const { data: testDefinitions } = useQuery({
    queryKey: ['testDefinitions', activeClubId],
    queryFn: () => testDefinitionsApi.getAll({ clubId: activeClubId || undefined }),
  })

  const higherIsBetterById = new Map(
    (testDefinitions ?? []).map((td) => [td.id, td.higherIsBetter])
  )
  // Map a grade option to its numeric value so grade tests are comparable/rankable too.
  const gradeValueByOptionId = new Map<number, number>()
  for (const td of testDefinitions ?? [])
    for (const g of td.gradeOptions ?? [])
      if (g.id != null) gradeValueByOptionId.set(g.id, g.numericValue)

  if (isLoading) return <LoadingSpinner />

  // Build matrix: member → test → full history (ascending by date, as returned)
  const memberMap = new Map<number, { name: string; tests: Map<number, TestResultDto[]> }>()
  const testCols = new Map<number, string>()
  for (const r of results ?? []) {
    testCols.set(r.testDefinitionId, r.testName ?? `#${r.testDefinitionId}`)
    if (!memberMap.has(r.memberId)) {
      memberMap.set(r.memberId, { name: r.memberName ?? `#${r.memberId}`, tests: new Map() })
    }
    const tests = memberMap.get(r.memberId)!.tests
    if (!tests.has(r.testDefinitionId)) tests.set(r.testDefinitionId, [])
    tests.get(r.testDefinitionId)!.push(r)
  }

  const sortedTestIds = [...testCols.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'cs'))
    .map(([id]) => id)

  // Latest comparable (numeric) value for a member on a test, or undefined.
  const valueOf = (memberId: number, testId: number): number | undefined => {
    const hist = memberMap.get(memberId)?.tests.get(testId)
    if (!hist || hist.length === 0) return undefined
    const latest = hist[hist.length - 1]
    if (latest.numericValue != null) return latest.numericValue
    if (latest.gradeOptionId != null) return gradeValueByOptionId.get(latest.gradeOptionId)
    return undefined
  }

  // Per-test team stats: average + rank per member (rank respects higher/lower-is-better).
  const testStats = new Map<number, TestStats>()
  for (const tid of sortedTestIds) {
    const higher = higherIsBetterById.get(tid) ?? true
    const entries = [...memberMap.keys()]
      .map((mid) => ({ mid, v: valueOf(mid, tid) }))
      .filter((e): e is { mid: number; v: number } => e.v != null)
    if (entries.length === 0) continue
    const values = entries.map((e) => e.v)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const sorted = [...values].sort((a, b) => (higher ? b - a : a - b))
    // Tied players share a place: report the full range (first..last position).
    const rank = new Map<number, { from: number; to: number }>()
    for (const e of entries)
      rank.set(e.mid, { from: sorted.indexOf(e.v) + 1, to: sorted.lastIndexOf(e.v) + 1 })
    testStats.set(tid, { avg, count: entries.length, rank })
  }

  const members = [...memberMap.entries()].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'name') {
      cmp = a[1].name.localeCompare(b[1].name, 'cs')
    } else {
      const av = valueOf(a[0], sortKey)
      const bv = valueOf(b[0], sortKey)
      // Players without a value always sink to the bottom, regardless of direction.
      if (av == null && bv == null) cmp = 0
      else if (av == null) return 1
      else if (bv == null) return -1
      else cmp = av - bv
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (memberMap.size === 0) {
    return <EmptyState title={t('testing.noResults')} description={t('testing.teamNoResults')} />
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 text-gray-300" />
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-sky-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-sky-600" />
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    {t('testing.colPlayer')} {sortIcon('name')}
                  </button>
                </th>
                {sortedTestIds.map((tid) => (
                  <th
                    key={tid}
                    className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-gray-500"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(tid)}
                      className="mx-auto flex items-center gap-1 hover:text-gray-900"
                    >
                      {testCols.get(tid)} {sortIcon(tid)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(([memberId, { name, tests }]) => (
                <tr key={memberId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2 font-medium text-gray-900">
                    <Link
                      to={`/testing/player/${memberId}?teamId=${teamId}`}
                      className="hover:text-sky-600 hover:underline"
                    >
                      {name}
                    </Link>
                  </td>
                  {sortedTestIds.map((tid) => {
                    const history = tests.get(tid)
                    if (!history || history.length === 0)
                      return (
                        <td key={tid} className="px-3 py-2 text-center text-gray-300">
                          —
                        </td>
                      )
                    const latest = history[history.length - 1]
                    const previous = history.length > 1 ? history[history.length - 2] : null
                    const display =
                      latest.numericValue != null ? latest.numericValue : (latest.gradeLabel ?? '—')
                    const higherIsBetter = higherIsBetterById.get(tid) ?? true
                    const stats = testStats.get(tid)
                    const rank = stats?.rank.get(memberId)
                    const value = valueOf(memberId, tid)
                    const isBest = rank?.from === 1 && stats != null && stats.count > 1

                    // Colour the result by how it compares to the team average:
                    // better than average → green, below average → orange.
                    let colourClass = ''
                    if (value != null && stats != null && stats.count > 1) {
                      const aboveAvg = higherIsBetter ? value > stats.avg : value < stats.avg
                      const belowAvg = higherIsBetter ? value < stats.avg : value > stats.avg
                      if (aboveAvg) colourClass = colourClasses.green
                      else if (belowAvg) colourClass = colourClasses.orange
                    }

                    // Same performance trend as the single-player view: arrow up = improvement.
                    let trend: 'up' | 'down' | null = null
                    if (
                      previous &&
                      latest.numericValue != null &&
                      previous.numericValue != null &&
                      latest.numericValue !== previous.numericValue
                    ) {
                      const wentHigher = latest.numericValue > previous.numericValue
                      trend = wentHigher === higherIsBetter ? 'up' : 'down'
                    }

                    return (
                      <td key={tid} className="px-3 py-2">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="grid grid-cols-[2rem_auto_2rem] items-center">
                            <span className="flex items-center justify-end gap-0.5">
                              {trend === 'up' && (
                                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                              )}
                              {trend === 'down' && (
                                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                              )}
                              {isBest && (
                                <span title={t('testing.bestInTeam')} className="inline-flex">
                                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                </span>
                              )}
                            </span>
                            <span
                              className={`text-center text-xs font-medium ${colourClass || 'text-gray-700'}`}
                            >
                              {display}
                            </span>
                            <span aria-hidden />
                          </div>
                          {rank != null && stats && stats.count > 1 && (
                            <span
                              className="text-[10px] text-gray-300"
                              title={t('testing.teamRank')}
                            >
                              {rank.from === rank.to
                                ? `${rank.from}.`
                                : `${rank.from}.-${rank.to}.`}
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-gray-50/60">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-gray-50/60 px-4 py-2 text-xs font-medium text-gray-500">
                  {t('testing.teamAvg')}
                </td>
                {sortedTestIds.map((tid) => {
                  const stats = testStats.get(tid)
                  return (
                    <td key={tid} className="px-3 py-2 text-center text-xs text-gray-600">
                      {stats ? stats.avg.toFixed(1) : '—'}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
