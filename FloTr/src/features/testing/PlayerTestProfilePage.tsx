import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ArrowLeft, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { PageHeader } from '../../components/shared/PageHeader'
import { testResultsApi, membersApi, teamsApi } from '../../api/index'
import type { TestResultDto } from '../../types/domain.types'

const colourBadgeVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  green: 'success', yellow: 'warning', red: 'danger',
}

interface TeamTestStats {
  avg: number
  min: number
  max: number
  rank: number
  total: number
  values: number[]
}

export function PlayerTestProfilePage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('teamId') ? Number(searchParams.get('teamId')) : null

  const { data: member } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => membersApi.getById(Number(memberId)),
  })

  const { data: results, isLoading } = useQuery({
    queryKey: ['testResults', 'member', memberId],
    queryFn: () => testResultsApi.getByMember(Number(memberId)),
  })

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId!),
    enabled: teamId != null && teamId > 0,
  })

  const { data: teamResults } = useQuery({
    queryKey: ['testResults', 'team', teamId],
    queryFn: () => testResultsApi.getByTeam(teamId!),
    enabled: teamId != null && teamId > 0,
  })

  if (isLoading) return <LoadingSpinner />

  const memberName = member ? `${member.firstName} ${member.lastName}` : `Hráč #${memberId}`

  // Build team stats per test (only for numeric tests)
  const teamStatsMap = new Map<number, TeamTestStats>()
  if (teamResults && memberId) {
    const byTest = new Map<number, { memberId: number; value: number }[]>()
    for (const r of teamResults) {
      if (r.numericValue == null) continue
      if (!byTest.has(r.testDefinitionId)) byTest.set(r.testDefinitionId, [])
      byTest.get(r.testDefinitionId)!.push({ memberId: r.memberId, value: r.numericValue })
    }
    for (const [testId, entries] of byTest) {
      if (entries.length < 2) continue // no comparison with less than 2 players
      const values = entries.map((e) => e.value)
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      // Find player's value
      const playerEntry = entries.find((e) => e.memberId === Number(memberId))
      if (!playerEntry) continue
      // Rank: sort descending by default, but we don't know higherIsBetter here
      // We'll sort descending (higher = better rank) - the visual bar still shows position correctly
      const sorted = [...values].sort((a, b) => b - a)
      const rank = sorted.indexOf(playerEntry.value) + 1
      teamStatsMap.set(testId, { avg, min, max, rank, total: entries.length, values })
    }
  }

  // Group results by test, then pick latest per test
  const byTest = (results ?? []).reduce<Record<number, TestResultDto[]>>((acc, r) => {
    if (!acc[r.testDefinitionId]) acc[r.testDefinitionId] = []
    acc[r.testDefinitionId].push(r)
    return acc
  }, {})

  const testLatest = Object.entries(byTest).map(([, testResults]) => {
    const sorted = [...testResults].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
    const latest = sorted[0]
    const previous = sorted.length > 1 ? sorted[1] : null
    return { latest, previous, history: sorted.reverse() }
  })

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Testový profil: ${memberName}`}
        description={[
          member?.birthYear ? `Ročník: ${member.birthYear}` : '',
          team ? `Tým: ${team.name}` : '',
        ].filter(Boolean).join(' · ') || undefined}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Zpět
          </Button>
        }
      />

      {testLatest.length === 0 ? (
        <EmptyState title="Žádné výsledky" description="Tento hráč zatím nemá žádné zaznamenané testy." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {testLatest.map(({ latest, previous, history }) => (
            <TestResultCard
              key={latest.testDefinitionId}
              latest={latest}
              previous={previous}
              historyCount={history.length}
              teamStats={teamStatsMap.get(latest.testDefinitionId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TestResultCard({
  latest, previous, historyCount, teamStats,
}: {
  latest: TestResultDto
  previous: TestResultDto | null
  historyCount: number
  teamStats?: TeamTestStats
}) {
  const value = latest.numericValue != null
    ? `${latest.numericValue}`
    : latest.gradeLabel ?? '—'

  const colourVariant = latest.colourCode
    ? colourBadgeVariant[latest.colourCode]
    : undefined

  // Trend
  let trend: 'up' | 'down' | null = null
  if (previous && latest.numericValue != null && previous.numericValue != null) {
    trend = latest.numericValue > previous.numericValue ? 'up' : latest.numericValue < previous.numericValue ? 'down' : null
  }

  // Position bar percentage (where the player falls between min and max)
  let positionPct: number | null = null
  if (teamStats && latest.numericValue != null && teamStats.max !== teamStats.min) {
    positionPct = ((latest.numericValue - teamStats.min) / (teamStats.max - teamStats.min)) * 100
  }

  return (
    <Card className="hover:border-sky-200 transition-all">
      <CardContent className="py-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">{latest.testName ?? `Test #${latest.testDefinitionId}`}</h3>
            <p className="text-xs text-gray-400">
              {format(parseISO(latest.testDate), 'd. M. yyyy', { locale: cs })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            {colourVariant ? (
              <Badge variant={colourVariant} size="md">{value}</Badge>
            ) : (
              <span className="text-lg font-semibold text-gray-900">{value}</span>
            )}
          </div>
        </div>
        {latest.note && <p className="mt-1 text-xs text-gray-500 italic">{latest.note}</p>}
        <div className="mt-2 flex items-center justify-between">
          {historyCount > 1 && (
            <span className="text-xs text-gray-400">{historyCount} měření</span>
          )}
        </div>

        {/* Team comparison */}
        {teamStats && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1 mb-2">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500">Porovnání s týmem</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
              <span>{teamStats.rank}. z {teamStats.total} hráčů</span>
              <span>průměr: {teamStats.avg.toFixed(1)}</span>
            </div>
            {/* Position bar */}
            <div className="relative h-2 rounded-full bg-gray-100">
              {/* Average marker */}
              {teamStats.max !== teamStats.min && (
                <div
                  className="absolute top-0 h-2 w-px bg-gray-400"
                  style={{ left: `${((teamStats.avg - teamStats.min) / (teamStats.max - teamStats.min)) * 100}%` }}
                />
              )}
              {/* Player marker */}
              {positionPct != null && (
                <div
                  className="absolute top-[-1px] h-2.5 w-2.5 rounded-full bg-sky-500 border-2 border-white shadow-sm"
                  style={{ left: `${positionPct}%`, transform: 'translateX(-50%)' }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>{teamStats.min}</span>
              <span>{teamStats.max}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
