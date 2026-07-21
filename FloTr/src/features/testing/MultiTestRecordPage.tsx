import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowLeft, Save, Users, AlertTriangle, Trash2, UserPlus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { PageHeader } from '../../components/shared/PageHeader'
import { testDefinitionsApi, testResultsApi, teamsApi, seasonsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { parseDecimalInput } from '../../utils/number'
import type { TestResultDto } from '../../types/domain.types'

interface CellValue {
  numericValue: string
  gradeOptionId: string
}

interface GridRow {
  memberId: number
  memberName: string
  firstName: string
  lastName: string
  values: Record<number, CellValue>
  // Snapshot of the values as loaded from the server; used to save only changed cells.
  original: Record<number, CellValue>
}

const emptyCell = (): CellValue => ({ numericValue: '', gradeOptionId: '' })

// Solid colour dots reflecting the last saved result.
const colourDotClasses: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

function ColourDot({ colour }: { colour?: string | null }) {
  if (!colour) return <span className="inline-block h-2.5 w-2.5 shrink-0" />
  const cls = colourDotClasses[colour]
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls ?? ''}`}
      style={cls ? undefined : { backgroundColor: colour }}
    />
  )
}

export function MultiTestRecordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeClubId, user, isHeadCoach } = useAuthStore()
  const [searchParams] = useSearchParams()
  const { teamId: teamIdParam } = useParams()

  const [seasonId, setSeasonId] = useState<number>(Number(searchParams.get('seasonId')) || 0)
  const [teamId, setTeamId] = useState<number>(
    Number(teamIdParam ?? searchParams.get('teamId')) || 0
  )
  const [testDate, setTestDate] = useState(
    searchParams.get('testDate') || format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>(
    (searchParams.get('testIds') ?? '')
      .split(',')
      .map((s) => Number(s))
      .filter((n) => n > 0)
  )
  const [rows, setRows] = useState<GridRow[]>([])
  const [loadedTeamId, setLoadedTeamId] = useState<number>(0)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const { data: testDefinitions, isLoading: loadingTests } = useQuery({
    queryKey: ['testDefinitions', activeClubId],
    queryFn: () => testDefinitionsApi.getAll({ clubId: activeClubId || undefined }),
  })

  const { data: seasons } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  })

  const coachTeamIds = user?.coachTeamIds ?? []
  const filteredTeams = (
    seasonId ? teams?.filter((tm) => tm.seasonId === seasonId) : teams
  )?.filter((tm) => isHeadCoach || coachTeamIds.includes(tm.id))

  const { data: teamDetail } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId),
    enabled: teamId > 0,
  })

  const { data: teamResults, refetch: refetchResults } = useQuery({
    queryKey: ['testResults', 'team', teamId],
    queryFn: () => testResultsApi.getByTeam(teamId),
    enabled: teamId > 0,
  })

  const testById = new Map((testDefinitions ?? []).map((td) => [td.id, td]))
  const selectedTests = selectedTestIds
    .map((id) => testById.get(id))
    .filter((td): td is NonNullable<typeof td> => !!td)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'cs'))

  const sortedTests = [...(testDefinitions ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'cs')
  )

  // Latest result per member+test, for pre-fill and colour indicators.
  const existingByMemberTest = new Map<string, TestResultDto>()
  for (const r of teamResults ?? [])
    existingByMemberTest.set(`${r.memberId}-${r.testDefinitionId}`, r)

  const loadTeamMembers = (resultsData: TestResultDto[] = teamResults ?? []) => {
    if (!teamDetail?.teamMembers) return
    const byMember = new Map<number, TestResultDto[]>()
    for (const r of resultsData) {
      if (!byMember.has(r.memberId)) byMember.set(r.memberId, [])
      byMember.get(r.memberId)!.push(r)
    }
    const players = teamDetail.teamMembers
      .filter((tm) => tm.isPlayer)
      .map((tm) => {
        const values: Record<number, CellValue> = {}
        for (const r of byMember.get(tm.memberId) ?? []) {
          values[r.testDefinitionId] = {
            numericValue: r.numericValue != null ? String(r.numericValue) : '',
            gradeOptionId: r.gradeOptionId != null ? String(r.gradeOptionId) : '',
          }
        }
        return {
          memberId: tm.memberId,
          memberName: tm.member
            ? `${tm.member.lastName} ${tm.member.firstName}`.trim()
            : t('testing.playerFallback', { id: tm.memberId }),
          firstName: tm.member?.firstName ?? '',
          lastName: tm.member?.lastName ?? '',
          values,
          original: structuredClone(values),
        }
      })
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName, 'cs') || a.firstName.localeCompare(b.firstName, 'cs')
      )
    setRows(players)
    setLoadedTeamId(teamId)
  }

  // Auto-load players + pre-fill once per team, as soon as team detail and results are ready.
  // Covers both arrival via /testing/team/:teamId and selecting a team in the dropdown.
  const autoLoadedTeamRef = useRef<number>(0)
  useEffect(() => {
    if (teamId > 0 && teamDetail && teamResults && autoLoadedTeamRef.current !== teamId) {
      autoLoadedTeamRef.current = teamId
      loadTeamMembers(teamResults)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamDetail, teamResults, teamId])

  // Auto-select columns once per team: union of query-provided tests and tests that already
  // have results, ordered by sortOrder. User can still toggle columns afterwards.
  const autoSelectedTeamRef = useRef<number>(0)
  useEffect(() => {
    if (teamId > 0 && teamResults && autoSelectedTeamRef.current !== teamId) {
      autoSelectedTeamRef.current = teamId
      const resultTestIds = [...new Set(teamResults.map((r) => r.testDefinitionId))]
      setSelectedTestIds((prev) => [...new Set([...prev, ...resultTestIds])])
    }
  }, [teamResults, teamId])

  const getCell = (row: GridRow, testId: number): CellValue => row.values[testId] ?? emptyCell()

  const updateCell = (memberId: number, testId: number, field: keyof CellValue, value: string) => {
    setSaveMessage(null)
    setRows((prev) =>
      prev.map((r) =>
        r.memberId === memberId
          ? {
              ...r,
              values: {
                ...r.values,
                [testId]: { ...(r.values[testId] ?? emptyCell()), [field]: value },
              },
            }
          : r
      )
    )
  }

  const removeRow = (memberId: number) => {
    setRows((prev) => prev.filter((r) => r.memberId !== memberId))
  }

  const addPlayer = (memberId: number) => {
    const tm = teamDetail?.teamMembers?.find((m) => m.memberId === memberId)
    if (!tm || rows.some((r) => r.memberId === memberId)) return
    setRows((prev) => [
      ...prev,
      {
        memberId: tm.memberId,
        memberName: tm.member
          ? `${tm.member.lastName} ${tm.member.firstName}`.trim()
          : t('testing.playerFallback', { id: tm.memberId }),
        firstName: tm.member?.firstName ?? '',
        lastName: tm.member?.lastName ?? '',
        values: {},
        original: {},
      },
    ])
  }

  const toggleTest = (testId: number, checked: boolean) => {
    setSelectedTestIds((prev) => (checked ? [...prev, testId] : prev.filter((id) => id !== testId)))
  }

  // Build only CHANGED/new cells so re-saving an unedited grid doesn't duplicate results.
  const buildResults = (): Partial<TestResultDto>[] => {
    const results: Partial<TestResultDto>[] = []
    for (const row of rows) {
      for (const test of selectedTests) {
        const cell = row.values[test.id] ?? emptyCell()
        const orig = row.original[test.id] ?? emptyCell()
        if (test.testType === 1) {
          if (cell.gradeOptionId && cell.gradeOptionId !== orig.gradeOptionId)
            results.push({
              testDefinitionId: test.id,
              memberId: row.memberId,
              gradeOptionId: Number(cell.gradeOptionId),
              testDate,
            })
        } else if (cell.numericValue.trim() !== '') {
          const v = parseDecimalInput(cell.numericValue)
          const origV = parseDecimalInput(orig.numericValue)
          if (v !== undefined && v !== origV)
            results.push({
              testDefinitionId: test.id,
              memberId: row.memberId,
              numericValue: v,
              testDate,
            })
        }
      }
    }
    return results
  }

  const batchMutation = useMutation({
    mutationFn: () => testResultsApi.createBatch(buildResults()),
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['testResults'] })
      queryClient.invalidateQueries({ queryKey: ['testDefinitions'] })
      queryClient.invalidateQueries({ queryKey: ['player-skill-card'] })
      const message =
        result.skillGradesUpdated > 0
          ? `${t('testing.savedResults', { count: result.count })} ${t('testing.skillGradesUpdated', { count: result.skillGradesUpdated })}`
          : t('testing.savedResults', { count: result.count })
      setSaveMessage(message)
      const refreshed = await refetchResults()
      if (refreshed.data) loadTeamMembers(refreshed.data)
    },
  })

  const availablePlayers = (teamDetail?.teamMembers ?? [])
    .filter((tm) => tm.isPlayer && !rows.some((r) => r.memberId === tm.memberId))
    .map((tm) => ({
      memberId: tm.memberId,
      name: tm.member
        ? `${tm.member.lastName} ${tm.member.firstName}`.trim()
        : t('testing.playerFallback', { id: tm.memberId }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))

  if (loadingTests) return <LoadingSpinner />

  const changedCount = buildResults().length
  const canAccessSelectedTeam = teamId === 0 || isHeadCoach || coachTeamIds.includes(teamId)
  const hasNoCoachingRights = !isHeadCoach && coachTeamIds.length === 0

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={
          teamDetail?.name
            ? t('testing.teamTestingTitle', { name: teamDetail.name })
            : t('testing.bulkRecordTitle')
        }
        description={t('testing.bulkRecordDesc')}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/testing')}>
            <ArrowLeft className="h-4 w-4" /> {t('common.back')}
          </Button>
        }
      />

      {(hasNoCoachingRights || !canAccessSelectedTeam) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">
                {hasNoCoachingRights ? t('testing.noPermission') : t('testing.notTeamCoach')}
              </p>
              <p className="mt-1 text-amber-800">{t('testing.whoCanRecord')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Selectors */}
      <Card className="mb-4">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">{t('common.season')}</label>
              <select
                value={seasonId}
                onChange={(e) => {
                  setSeasonId(Number(e.target.value))
                  setTeamId(0)
                }}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value={0}>{t('appointments.allSeasons')}</option>
                {(seasons ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">{t('common.team')}</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value={0}>{t('testing.selectTeamPlaceholder')}</option>
                {(filteredTeams ?? []).map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <Input
                label={t('testing.testDate')}
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTeamMembers()}
              disabled={teamId === 0 || !teamDetail}
            >
              <Users className="h-4 w-4" /> {t('testing.loadPlayers')}
            </Button>
          </div>

          {/* Test multi-select */}
          <div>
            <label className="text-sm font-medium text-gray-700">{t('testing.testsColumns')}</label>
            {sortedTests.length === 0 ? (
              <p className="text-xs text-gray-500">{t('testing.noTestsAvailable')}</p>
            ) : (
              <div className="mt-1 grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
                {sortedTests.map((td) => (
                  <label
                    key={td.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTestIds.includes(td.id)}
                      onChange={(e) => toggleTest(td.id, e.target.checked)}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-gray-700">{td.name}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedTestIds.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {t('testing.selectedTests', { count: selectedTests.length })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {rows.length > 0 && selectedTests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {t('testing.playersCount', { count: rows.length })}
              </h2>
              <span className="text-xs text-gray-500">
                {t('testing.changesToSave', { count: changedCount })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="sticky left-0 z-10 bg-white pb-2 pr-4">{t('common.player')}</th>
                    {selectedTests.map((td) => (
                      <th key={td.id} className="pb-2 pr-3 w-32">
                        {td.name}
                        {td.unit ? <span className="text-gray-400"> ({td.unit})</span> : null}
                      </th>
                    ))}
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.memberId} className="border-b border-gray-50">
                      <td className="sticky left-0 z-10 bg-white py-2 pr-4 font-medium text-gray-900">
                        {teamId > 0 ? (
                          <Link
                            to={`/testing/player/${row.memberId}?teamId=${teamId}`}
                            className="hover:text-sky-600 hover:underline"
                          >
                            {row.memberName}
                          </Link>
                        ) : (
                          row.memberName
                        )}
                      </td>
                      {selectedTests.map((td) => {
                        const cell = getCell(row, td.id)
                        const existing = existingByMemberTest.get(`${row.memberId}-${td.id}`)
                        return (
                          <td key={td.id} className="py-2 pr-3">
                            <div className="flex items-center gap-1.5">
                              <ColourDot colour={existing?.colourCode} />
                              {td.testType === 1 ? (
                                <select
                                  value={cell.gradeOptionId}
                                  onChange={(e) =>
                                    updateCell(row.memberId, td.id, 'gradeOptionId', e.target.value)
                                  }
                                  className="h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm"
                                >
                                  <option value="">—</option>
                                  {td.gradeOptions.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={cell.numericValue}
                                  onChange={(e) =>
                                    updateCell(row.memberId, td.id, 'numericValue', e.target.value)
                                  }
                                  className="h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm"
                                  placeholder="—"
                                />
                              )}
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(row.memberId)}
                          title={t('testing.removeFromTesting')}
                          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {availablePlayers.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-gray-400" />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addPlayer(Number(e.target.value))
                  }}
                  className="h-8 rounded border border-gray-300 bg-white px-2 text-sm"
                >
                  <option value="">{t('testing.addPlayerFromTeam')}</option>
                  {availablePlayers.map((p) => (
                    <option key={p.memberId} value={p.memberId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => batchMutation.mutate()}
                loading={batchMutation.isPending}
                disabled={changedCount === 0}
              >
                <Save className="h-4 w-4" />{' '}
                {t('testing.saveChangesCount', { count: changedCount })}
              </Button>
              {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
            </div>

            {batchMutation.error && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {t('testing.errorPrefix', { msg: (batchMutation.error as Error).message })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && selectedTests.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
          {t('testing.selectTestForGrid')}
        </div>
      )}

      {rows.length === 0 && teamId > 0 && teamDetail && loadedTeamId === teamId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
          <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-600" />
          {t('testing.noTeamPlayers')}
        </div>
      )}

      {rows.length === 0 && (loadedTeamId !== teamId || teamId === 0) && (
        <div className="py-8 text-center text-sm text-gray-500">
          {t('testing.selectTeamAndTests')}
        </div>
      )}
    </div>
  )
}
