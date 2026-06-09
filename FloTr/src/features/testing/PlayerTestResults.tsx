import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Users } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { testResultsApi, testDefinitionsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TestResultDto } from '../../types/domain.types'

const colourBadgeVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
}

interface TeamTestStats {
  avg: number
  min: number
  max: number
  rank: number
  total: number
}

export function PlayerTestResults({
  memberId,
  teamId,
}: {
  memberId: number
  teamId?: number | null
}) {
  const { activeClubId } = useAuthStore()

  const { data: results, isLoading } = useQuery({
    queryKey: ['testResults', 'member', memberId],
    queryFn: () => testResultsApi.getByMember(memberId),
    enabled: memberId > 0,
  })

  const { data: teamResults } = useQuery({
    queryKey: ['testResults', 'team', teamId],
    queryFn: () => testResultsApi.getByTeam(teamId!),
    enabled: teamId != null && teamId > 0,
  })

  const { data: testDefinitions } = useQuery({
    queryKey: ['testDefinitions', activeClubId],
    queryFn: () => testDefinitionsApi.getAll({ clubId: activeClubId || undefined }),
  })

  // Per-test "higher is better" flag; defaults to true when the definition is unknown.
  const higherIsBetterById = new Map((testDefinitions ?? []).map((t) => [t.id, t.higherIsBetter]))

  if (isLoading) return <LoadingSpinner />

  // Team stats per test (numeric only), for comparison
  const teamStatsMap = new Map<number, TeamTestStats>()
  if (teamResults) {
    const byTest = new Map<number, { memberId: number; value: number }[]>()
    for (const r of teamResults) {
      if (r.numericValue == null) continue
      if (!byTest.has(r.testDefinitionId)) byTest.set(r.testDefinitionId, [])
      byTest.get(r.testDefinitionId)!.push({ memberId: r.memberId, value: r.numericValue })
    }
    for (const [testId, entries] of byTest) {
      if (entries.length < 2) continue
      const values = entries.map((e) => e.value)
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      const playerEntry = entries.find((e) => e.memberId === memberId)
      if (!playerEntry) continue
      // Rank respects the test setting: for "lower is better" the smallest value is 1st.
      const higher = higherIsBetterById.get(testId) ?? true
      const sorted = [...values].sort((a, b) => (higher ? b - a : a - b))
      const rank = sorted.indexOf(playerEntry.value) + 1
      teamStatsMap.set(testId, { avg, min, max, rank, total: entries.length })
    }
  }

  // Group results by test, sort history ascending by date
  const byTest = (results ?? []).reduce<Record<number, TestResultDto[]>>((acc, r) => {
    if (!acc[r.testDefinitionId]) acc[r.testDefinitionId] = []
    acc[r.testDefinitionId].push(r)
    return acc
  }, {})

  const tests = Object.values(byTest).map((testResults) => {
    const history = [...testResults].sort(
      (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
    )
    const latest = history[history.length - 1]
    const previous = history.length > 1 ? history[history.length - 2] : null
    return { latest, previous, history }
  })

  tests.sort((a, b) => (a.latest.testName ?? '').localeCompare(b.latest.testName ?? '', 'cs'))

  if (tests.length === 0) {
    return (
      <EmptyState
        title="Žádné výsledky"
        description="Tento hráč zatím nemá žádné zaznamenané testy."
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tests.map(({ latest, previous, history }) => (
        <TestResultCard
          key={latest.testDefinitionId}
          latest={latest}
          previous={previous}
          history={history}
          teamStats={teamStatsMap.get(latest.testDefinitionId)}
          higherIsBetter={higherIsBetterById.get(latest.testDefinitionId) ?? true}
        />
      ))}
    </div>
  )
}

function TestResultCard({
  latest,
  previous,
  history,
  teamStats,
  higherIsBetter,
}: {
  latest: TestResultDto
  previous: TestResultDto | null
  history: TestResultDto[]
  teamStats?: TeamTestStats
  higherIsBetter: boolean
}) {
  const value = latest.numericValue != null ? `${latest.numericValue}` : (latest.gradeLabel ?? '—')
  const colourVariant = latest.colourCode ? colourBadgeVariant[latest.colourCode] : undefined

  // Trend reflects IMPROVEMENT, not raw direction: for "lower is better" tests a smaller
  // value is an improvement (arrow up / green).
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

  // Trend chart data (numeric measurements only)
  const chartData = history
    .filter((r) => r.numericValue != null)
    .map((r) => ({
      date: format(parseISO(r.testDate), 'd.M.yy', { locale: cs }),
      value: r.numericValue as number,
    }))
  const showChart = chartData.length >= 2

  // Position bar percentage within team min/max
  let positionPct: number | null = null
  if (teamStats && latest.numericValue != null && teamStats.max !== teamStats.min) {
    positionPct = ((latest.numericValue - teamStats.min) / (teamStats.max - teamStats.min)) * 100
  }

  return (
    <Card className="hover:border-sky-200 transition-all">
      <CardContent className="py-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {latest.testName ?? `Test #${latest.testDefinitionId}`}
            </h3>
            <p className="text-xs text-gray-400">
              {format(parseISO(latest.testDate), 'd. M. yyyy', { locale: cs })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            {colourVariant ? (
              <Badge variant={colourVariant} size="md">
                {value}
              </Badge>
            ) : (
              <span className="text-lg font-semibold text-gray-900">{value}</span>
            )}
          </div>
        </div>
        {latest.note && <p className="mt-1 text-xs text-gray-500 italic">{latest.note}</p>}

        {/* Trend chart */}
        {showChart && !higherIsBetter && (
          <p className="mt-2 text-[10px] text-gray-400">
            Nižší hodnota = lepší výkon (osa je obrácená, nahoru = zlepšení)
          </p>
        )}
        {showChart && (
          <div className="mt-2 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickMargin={4} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  width={40}
                  domain={['auto', 'auto']}
                  reversed={!higherIsBetter}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelStyle={{ color: '#64748b' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Hodnota"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Measurements list: value + small date */}
        {history.length > 1 && (
          <div className="mt-3 border-t border-gray-100 pt-2">
            <p className="mb-1 text-[11px] font-medium text-gray-500">Měření ({history.length})</p>
            <ul className="space-y-0.5">
              {[...history].reverse().map((r) => (
                <li key={r.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-800">
                    {r.numericValue != null ? r.numericValue : (r.gradeLabel ?? '—')}
                  </span>
                  <span className="text-gray-400">
                    {format(parseISO(r.testDate), 'd. M. yyyy', { locale: cs })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Team comparison */}
        {teamStats && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1 mb-2">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500">Porovnání s týmem</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
              <span>
                {teamStats.rank}. z {teamStats.total} hráčů
              </span>
              <span>průměr: {teamStats.avg.toFixed(1)}</span>
            </div>
            <div className="relative h-2 rounded-full bg-gray-100">
              {teamStats.max !== teamStats.min && (
                <div
                  className="absolute top-0 h-2 w-px bg-gray-400"
                  style={{
                    left: `${((teamStats.avg - teamStats.min) / (teamStats.max - teamStats.min)) * 100}%`,
                  }}
                />
              )}
              {positionPct != null && (
                <div
                  className="absolute top-[-1px] h-2.5 w-2.5 rounded-full border-2 border-white bg-sky-500 shadow-sm"
                  style={{ left: `${positionPct}%`, transform: 'translateX(-50%)' }}
                />
              )}
            </div>
            <div className="mt-0.5 flex justify-between text-[10px] text-gray-400">
              <span>{teamStats.min}</span>
              <span>{teamStats.max}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
