import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { PageHeader } from '../../components/shared/PageHeader'
import { testResultsApi, teamsApi, testDefinitionsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TestResultDto, TestDefinitionDto } from '../../types/domain.types'

const colourClasses: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
}

export function TeamMonitoringPage() {
  const { teamId: teamIdParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const teamId = Number(teamIdParam) || 0

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId),
    enabled: teamId > 0,
  })

  const { data: results, isLoading: loadingResults } = useQuery({
    queryKey: ['testResults', 'team', teamId],
    queryFn: () => testResultsApi.getByTeam(teamId),
    enabled: teamId > 0,
  })

  const { data: testDefs } = useQuery({
    queryKey: ['testDefinitions', user?.clubId],
    queryFn: () => testDefinitionsApi.getAll({ clubId: user?.clubId ?? undefined }),
  })

  // Build matrix: rows = members, columns = tests
  const memberMap = new Map<number, { name: string; results: Map<number, TestResultDto> }>()
  const testIds = new Set<number>()

  for (const r of results ?? []) {
    testIds.add(r.testDefinitionId)
    if (!memberMap.has(r.memberId)) {
      memberMap.set(r.memberId, { name: r.memberName ?? `#${r.memberId}`, results: new Map() })
    }
    memberMap.get(r.memberId)!.results.set(r.testDefinitionId, r)
  }

  const testDefMap = new Map<number, TestDefinitionDto>()
  for (const td of testDefs ?? []) testDefMap.set(td.id, td)

  const sortedTestIds = [...testIds].sort((a, b) => {
    const da = testDefMap.get(a)
    const db = testDefMap.get(b)
    return (da?.sortOrder ?? 0) - (db?.sortOrder ?? 0)
  })

  const members = [...memberMap.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name))

  return (
    <div>
      <PageHeader
        title={`Team Monitoring${team ? `: ${team.name}` : ''}`}
        description="Přehled posledních testových výsledků celého týmu"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Zpět
          </Button>
        }
      />

      {teamId > 0 && loadingResults && <LoadingSpinner />}

      {teamId > 0 && !loadingResults && members.length === 0 && (
        <EmptyState title="Žádné výsledky" description="Pro tento tým zatím nebyly zaznamenány žádné testy." />
      )}

      {members.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 z-10">
                      Hráč
                    </th>
                    {sortedTestIds.map((tid) => {
                      const td = testDefMap.get(tid)
                      return (
                        <th key={tid} className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
                          <div>{td?.name ?? `#${tid}`}</div>
                          {td?.unit && <div className="text-[10px] text-gray-400">({td.unit})</div>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {members.map(([memberId, { name, results: memberResults }]) => (
                    <tr key={memberId} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="sticky left-0 bg-white px-4 py-2 font-medium text-gray-900 whitespace-nowrap z-10">
                        <Link to={`/testing/player/${memberId}?teamId=${teamId}`} className="hover:text-sky-600 hover:underline">
                          {name}
                        </Link>
                      </td>
                      {sortedTestIds.map((tid) => {
                        const r = memberResults.get(tid)
                        if (!r) return <td key={tid} className="px-3 py-2 text-center text-gray-300">—</td>

                        const display = r.numericValue != null ? r.numericValue : r.gradeLabel ?? '—'
                        const colourClass = r.colourCode ? colourClasses[r.colourCode] : ''

                        return (
                          <td key={tid} className="px-3 py-2 text-center">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colourClass || 'text-gray-700'}`}>
                              {display}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
