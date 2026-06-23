import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Save,
  Users,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Printer,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { PageHeader } from '../../components/shared/PageHeader'
import { testDefinitionsApi, testResultsApi, teamsApi, seasonsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { parseDecimalInput } from '../../utils/number'
import { toast } from '../../utils/toast'

interface ResultRow {
  memberId: number
  memberName: string
  firstName: string
  lastName: string
  numericValue: string
  gradeOptionId: string
}

type SortKey = 'name' | 'value'
type SortDir = 'asc' | 'desc'

export function RecordResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { activeClubId, user, isHeadCoach } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [seasonId, setSeasonId] = useState<number>(Number(searchParams.get('seasonId')) || 0)
  const [teamId, setTeamId] = useState<number>(Number(searchParams.get('teamId')) || 0)
  const [testDate, setTestDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [rows, setRows] = useState<ResultRow[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  // Team id whose players have been loaded; lets us tell "not loaded yet" from "loaded but empty"
  const [loadedTeamId, setLoadedTeamId] = useState<number>(0)

  const { data: test, isLoading: loadingTest } = useQuery({
    queryKey: ['testDefinition', id],
    queryFn: () => testDefinitionsApi.getById(Number(id)),
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

  // When team loads, populate rows with players
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
        numericValue: '',
        gradeOptionId: '',
      }))
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName, 'cs') || a.firstName.localeCompare(b.firstName, 'cs')
      )
    setSortKey('name')
    setSortDir('asc')
    setRows(players)
    setLoadedTeamId(teamId)
  }

  // When arriving from a scheduled team event, the team is already known via the URL —
  // load its players automatically so the user doesn't have to click "Načíst hráče".
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

  const batchMutation = useMutation({
    mutationFn: () => {
      const results = rows
        .filter((r) => r.numericValue !== '' || r.gradeOptionId !== '')
        .map((r) => ({
          testDefinitionId: Number(id),
          memberId: r.memberId,
          numericValue: r.numericValue ? parseDecimalInput(r.numericValue) : undefined,
          gradeOptionId: r.gradeOptionId ? Number(r.gradeOptionId) : undefined,
          testDate,
        }))
      return testResultsApi.createBatch(results)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['testResults'] })
      queryClient.invalidateQueries({ queryKey: ['testDefinitions'] })
      toast.success(`Uloženo ${result.count} výsledků.`)
      navigate(`/testing/${id}`)
    },
  })

  const updateRow = (memberId: number, field: keyof ResultRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.memberId === memberId ? { ...r, [field]: value } : r)))
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
        numericValue: '',
        gradeOptionId: '',
      },
    ])
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (loadingTest) return <LoadingSpinner />
  if (!test) return <div className="text-sm text-gray-500">Test nenalezen.</div>

  const isGrade = test.testType === 1
  const filledCount = rows.filter((r) => r.numericValue !== '' || r.gradeOptionId !== '').length

  const availablePlayers = (teamDetail?.teamMembers ?? [])
    .filter((tm) => tm.isPlayer && !rows.some((r) => r.memberId === tm.memberId))
    .map((tm) => ({
      memberId: tm.memberId,
      name: tm.member
        ? `${tm.member.lastName} ${tm.member.firstName}`.trim()
        : `Hráč #${tm.memberId}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))

  // Map grade option id -> numeric value so the grade column sorts meaningfully
  const gradeValueById = new Map(test.gradeOptions.map((g) => [String(g.id), g.numericValue]))

  const sortedRows = [...rows].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'name') {
      cmp =
        a.lastName.localeCompare(b.lastName, 'cs') || a.firstName.localeCompare(b.firstName, 'cs')
    } else {
      const aEmpty = isGrade ? a.gradeOptionId === '' : a.numericValue === ''
      const bEmpty = isGrade ? b.gradeOptionId === '' : b.numericValue === ''
      // Unfilled rows always sink to the bottom regardless of direction
      if (aEmpty && bEmpty) cmp = 0
      else if (aEmpty) return 1
      else if (bEmpty) return -1
      else {
        const av = isGrade ? (gradeValueById.get(a.gradeOptionId) ?? 0) : Number(a.numericValue)
        const bv = isGrade ? (gradeValueById.get(b.gradeOptionId) ?? 0) : Number(b.numericValue)
        cmp = av - bv
      }
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 text-gray-400" />
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-sky-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-sky-600" />
    )
  }

  const valueColumnLabel = isGrade ? 'Hodnocení' : `Hodnota (${test.unit ?? ''})`

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const slug = test.name.replace(/\s+/g, '-')
      await testDefinitionsApi.downloadFormPdf(Number(id), `test-${slug}`, {
        teamId: teamId || undefined,
        testDate,
      })
    } catch {
      toast.error('Nepodařilo se vygenerovat PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const canAccessSelectedTeam = teamId === 0 || isHeadCoach || coachTeamIds.includes(teamId)
  const hasNoCoachingRights = !isHeadCoach && coachTeamIds.length === 0
  const teamCoachNames = (teamDetail?.teamMembers ?? [])
    .filter((tm) => tm.isCoach && tm.member)
    .map((tm) => `${tm.member!.firstName} ${tm.member!.lastName}`.trim())
    .filter(Boolean)

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Zadat výsledky: ${test.name}`}
        description={test.unit ? `Jednotka: ${test.unit}` : undefined}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(`/testing/${id}`)}>
            <ArrowLeft className="h-4 w-4" /> Zpět
          </Button>
        }
      />

      {/* Permission notice */}
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
              {!canAccessSelectedTeam && teamCoachNames.length > 0 && (
                <p className="mt-1 text-amber-800">Trenéři týmu: {teamCoachNames.join(', ')}.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team & date selector */}
      <Card className="mb-4">
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Results table */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Hráči ({rows.length})</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Vyplněno: {filledCount}/{rows.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  loading={downloadingPdf}
                >
                  <Printer className="h-4 w-4" /> Stáhnout PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Hráč {sortIcon('name')}
                      </button>
                    </th>
                    <th className="pb-2 pr-4 w-40">
                      <button
                        type="button"
                        onClick={() => toggleSort('value')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        {valueColumnLabel} {sortIcon('value')}
                      </button>
                    </th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.memberId} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-900">{row.memberName}</td>
                      <td className="py-2 pr-4">
                        {isGrade ? (
                          <select
                            value={row.gradeOptionId}
                            onChange={(e) =>
                              updateRow(row.memberId, 'gradeOptionId', e.target.value)
                            }
                            className="h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm"
                          >
                            <option value="">—</option>
                            {test.gradeOptions.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={row.numericValue}
                            onChange={(e) =>
                              updateRow(row.memberId, 'numericValue', e.target.value)
                            }
                            className="h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm"
                            placeholder="—"
                          />
                        )}
                      </td>
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
              <Button variant="outline" onClick={() => navigate(`/testing/${id}`)}>
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

      {rows.length === 0 && teamId > 0 && teamDetail && loadedTeamId === teamId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
          <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-600" />
          Tento tým nemá žádné hráče. Přidejte hráče do týmu v sekci „Týmy", nebo vyberte jiný tým.
        </div>
      )}

      {rows.length === 0 && teamId > 0 && teamDetail && loadedTeamId !== teamId && (
        <div className="text-center py-8 text-sm text-gray-500">
          Klikněte "Načíst hráče" pro zobrazení tabulky výsledků.
        </div>
      )}
    </div>
  )
}
