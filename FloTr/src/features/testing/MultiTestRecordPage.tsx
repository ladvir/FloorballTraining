import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
}

const emptyCell = (): CellValue => ({ numericValue: '', gradeOptionId: '' })

export function MultiTestRecordPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeClubId, user, isHeadCoach } = useAuthStore()
  const [searchParams] = useSearchParams()

  const [seasonId, setSeasonId] = useState<number>(Number(searchParams.get('seasonId')) || 0)
  const [teamId, setTeamId] = useState<number>(Number(searchParams.get('teamId')) || 0)
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
  const filteredTeams = (seasonId ? teams?.filter((t) => t.seasonId === seasonId) : teams)?.filter(
    (t) => isHeadCoach || coachTeamIds.includes(t.id)
  )

  const { data: teamDetail } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId),
    enabled: teamId > 0,
  })

  const sortedTests = [...(testDefinitions ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'cs')
  )
  const testById = new Map(sortedTests.map((t) => [t.id, t]))
  const selectedTests = selectedTestIds
    .map((id) => testById.get(id))
    .filter((t): t is NonNullable<typeof t> => !!t)

  const loadTeamMembers = () => {
    if (!teamDetail?.teamMembers) return
    const players = teamDetail.teamMembers
      .filter((tm) => tm.isPlayer)
      .map((tm) => ({
        memberId: tm.memberId,
        memberName: tm.member
          ? `${tm.member.lastName} ${tm.member.firstName}`.trim()
          : `Hráč #${tm.memberId}`,
        firstName: tm.member?.firstName ?? '',
        lastName: tm.member?.lastName ?? '',
        values: {} as Record<number, CellValue>,
      }))
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName, 'cs') || a.firstName.localeCompare(b.firstName, 'cs')
      )
    setRows(players)
    setLoadedTeamId(teamId)
  }

  // Auto-load players when arriving from a scheduled event (team known via URL).
  const initialTeamIdRef = useRef(Number(searchParams.get('teamId')) || 0)
  const autoLoadedRef = useRef(false)
  useEffect(() => {
    if (
      !autoLoadedRef.current &&
      initialTeamIdRef.current > 0 &&
      teamId === initialTeamIdRef.current &&
      teamDetail &&
      rows.length === 0
    ) {
      autoLoadedRef.current = true
      loadTeamMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamDetail, teamId])

  const getCell = (row: GridRow, testId: number): CellValue => row.values[testId] ?? emptyCell()

  const updateCell = (memberId: number, testId: number, field: keyof CellValue, value: string) => {
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
          : `Hráč #${tm.memberId}`,
        firstName: tm.member?.firstName ?? '',
        lastName: tm.member?.lastName ?? '',
        values: {},
      },
    ])
  }

  const toggleTest = (testId: number, checked: boolean) => {
    setSelectedTestIds((prev) => (checked ? [...prev, testId] : prev.filter((id) => id !== testId)))
  }

  const buildResults = (): Partial<TestResultDto>[] => {
    const results: Partial<TestResultDto>[] = []
    for (const row of rows) {
      for (const test of selectedTests) {
        const cell = row.values[test.id]
        if (!cell) continue
        if (test.testType === 1) {
          if (cell.gradeOptionId)
            results.push({
              testDefinitionId: test.id,
              memberId: row.memberId,
              gradeOptionId: Number(cell.gradeOptionId),
              testDate,
            })
        } else if (cell.numericValue.trim() !== '') {
          const v = parseDecimalInput(cell.numericValue)
          if (v !== undefined)
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['testResults'] })
      queryClient.invalidateQueries({ queryKey: ['testDefinitions'] })
      alert(`Uloženo ${result.count} výsledků.`)
      navigate('/testing')
    },
  })

  const availablePlayers = (teamDetail?.teamMembers ?? [])
    .filter((tm) => tm.isPlayer && !rows.some((r) => r.memberId === tm.memberId))
    .map((tm) => ({
      memberId: tm.memberId,
      name: tm.member
        ? `${tm.member.lastName} ${tm.member.firstName}`.trim()
        : `Hráč #${tm.memberId}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))

  if (loadingTests) return <LoadingSpinner />

  const filledCount = buildResults().length
  const canAccessSelectedTeam = teamId === 0 || isHeadCoach || coachTeamIds.includes(teamId)
  const hasNoCoachingRights = !isHeadCoach && coachTeamIds.length === 0

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Hromadné zadání výsledků"
        description="Zadejte výsledky více testů najednou – testy ve sloupcích, hráči v řádcích."
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/testing')}>
            <ArrowLeft className="h-4 w-4" /> Zpět
          </Button>
        }
      />

      {(hasNoCoachingRights || !canAccessSelectedTeam) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">
                {hasNoCoachingRights
                  ? 'Nemáte oprávnění zadávat výsledky testů.'
                  : 'U tohoto týmu nejste uveden jako trenér, výsledky proto nelze zadat.'}
              </p>
              <p className="mt-1 text-amber-800">
                Výsledky smí zadávat administrátor, hlavní trenér klubu nebo trenér daného týmu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selectors */}
      <Card className="mb-4">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Sezóna</label>
              <select
                value={seasonId}
                onChange={(e) => {
                  setSeasonId(Number(e.target.value))
                  setTeamId(0)
                }}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value={0}>Všechny sezóny</option>
                {(seasons ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Tým</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value={0}>Vyberte tým...</option>
                {(filteredTeams ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <Input
                label="Datum testu"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTeamMembers}
              disabled={teamId === 0 || !teamDetail}
            >
              <Users className="h-4 w-4" /> Načíst hráče
            </Button>
          </div>

          {/* Test multi-select */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Testy <span className="text-xs text-gray-400">(sloupce mřížky)</span>
            </label>
            {sortedTests.length === 0 ? (
              <p className="text-xs text-gray-500">Žádné testy k dispozici.</p>
            ) : (
              <div className="mt-1 grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
                {sortedTests.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTestIds.includes(t.id)}
                      onChange={(e) => toggleTest(t.id, e.target.checked)}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-gray-700">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedTestIds.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">Vybráno testů: {selectedTests.length}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {rows.length > 0 && selectedTests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Hráči ({rows.length})</h2>
              <span className="text-xs text-gray-500">Vyplněno buněk: {filledCount}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="sticky left-0 z-10 bg-white pb-2 pr-4">Hráč</th>
                    {selectedTests.map((t) => (
                      <th key={t.id} className="pb-2 pr-3 w-32">
                        {t.name}
                        {t.unit ? <span className="text-gray-400"> ({t.unit})</span> : null}
                      </th>
                    ))}
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.memberId} className="border-b border-gray-50">
                      <td className="sticky left-0 z-10 bg-white py-2 pr-4 font-medium text-gray-900">
                        {row.memberName}
                      </td>
                      {selectedTests.map((t) => {
                        const cell = getCell(row, t.id)
                        return (
                          <td key={t.id} className="py-2 pr-3">
                            {t.testType === 1 ? (
                              <select
                                value={cell.gradeOptionId}
                                onChange={(e) =>
                                  updateCell(row.memberId, t.id, 'gradeOptionId', e.target.value)
                                }
                                className="h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm"
                              >
                                <option value="">—</option>
                                {t.gradeOptions.map((g) => (
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
                                  updateCell(row.memberId, t.id, 'numericValue', e.target.value)
                                }
                                className="h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm"
                                placeholder="—"
                              />
                            )}
                          </td>
                        )
                      })}
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(row.memberId)}
                          title="Odebrat hráče z testování"
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
                  <option value="">Přidat hráče z týmu…</option>
                  {availablePlayers.map((p) => (
                    <option key={p.memberId} value={p.memberId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => batchMutation.mutate()}
                loading={batchMutation.isPending}
                disabled={filledCount === 0}
              >
                <Save className="h-4 w-4" /> Uložit {filledCount} výsledků
              </Button>
              <Button variant="outline" onClick={() => navigate('/testing')}>
                Zrušit
              </Button>
            </div>

            {batchMutation.error && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                Chyba: {(batchMutation.error as Error).message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && selectedTests.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
          Vyberte alespoň jeden test, aby se zobrazila mřížka.
        </div>
      )}

      {rows.length === 0 && teamId > 0 && teamDetail && loadedTeamId === teamId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
          <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-600" />
          Tento tým nemá žádné hráče. Přidejte hráče do týmu v sekci „Týmy", nebo vyberte jiný tým.
        </div>
      )}

      {rows.length === 0 && (loadedTeamId !== teamId || teamId === 0) && (
        <div className="py-8 text-center text-sm text-gray-500">
          Vyberte tým a testy, pak klikněte „Načíst hráče".
        </div>
      )}
    </div>
  )
}
