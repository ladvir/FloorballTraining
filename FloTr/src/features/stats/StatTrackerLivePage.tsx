import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Settings, Undo2 } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { statTrackersApi } from '../../api/index'
import { lineupsApi } from '../../api/lineups.api'
import type {
  StatTrackerDto,
  StatTrackerMetricDto,
  StatTrackerParticipantDto,
} from '../../types/domain.types'
import { groupLineup, type LineupGrouping } from './lineupGrouping'
import { colorClasses } from '../lineups/lineupUtils'

interface SectionRow {
  kind: 'header' | 'player'
  // header
  title?: string
  accent?: string
  bulkParticipants?: StatTrackerParticipantDto[]
  showBulk?: boolean
  // player
  participant?: StatTrackerParticipantDto
  rowAccent?: string
  forceGoalie?: boolean
}

export function StatTrackerLivePage() {
  const { trackerId } = useParams<{ trackerId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const id = Number(trackerId)

  const { data: tracker, isLoading } = useQuery({
    queryKey: ['stat-tracker', id],
    queryFn: () => statTrackersApi.getById(id),
    enabled: !!id,
  })

  const { data: teamLineups } = useQuery({
    queryKey: ['lineups', 'team', tracker?.teamId],
    queryFn: () => lineupsApi.getByTeam(tracker!.teamId),
    enabled: !!tracker?.teamId,
  })

  const lineup = useMemo(() => {
    if (!tracker || !teamLineups || teamLineups.length === 0) return null
    // Prefer the lineup explicitly chosen on the tracker
    if (tracker.matchLineupId) {
      const explicit = teamLineups.find((l) => l.id === tracker.matchLineupId)
      if (explicit) return explicit
    }
    if (tracker.appointmentId) {
      const linked = teamLineups.find((l) => l.appointmentId === tracker.appointmentId)
      if (linked) return linked
    }
    if (tracker.participants.length === 0) return null
    const memberIds = new Set(tracker.participants.map((p) => p.memberId))
    let best = null as null | (typeof teamLineups)[number]
    let bestScore = 0
    for (const l of teamLineups) {
      let score = 0
      for (const r of l.roster) if (r.memberId && memberIds.has(r.memberId)) score++
      if (score > bestScore) {
        best = l
        bestScore = score
      }
    }
    return best
  }, [tracker, teamLineups])

  const grouping = useMemo<LineupGrouping | null>(
    () => (lineup ? groupLineup(lineup) : null),
    [lineup]
  )

  const currentPeriod = tracker?.currentPeriod ?? null

  const addEntryMutation = useMutation({
    mutationFn: (data: { participantId: number; metricId: number; delta: number }) =>
      statTrackersApi.addEntry(id, { ...data, period: currentPeriod }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['stat-tracker', id] })
      const prev = qc.getQueryData<StatTrackerDto>(['stat-tracker', id])
      if (prev) {
        const aggregates = [...prev.aggregates]
        const idx = aggregates.findIndex(
          (a) => a.participantId === vars.participantId && a.metricId === vars.metricId
        )
        if (idx >= 0)
          aggregates[idx] = { ...aggregates[idx], total: aggregates[idx].total + vars.delta }
        else
          aggregates.push({
            participantId: vars.participantId,
            metricId: vars.metricId,
            total: vars.delta,
            byPeriod: {},
          })
        qc.setQueryData<StatTrackerDto>(['stat-tracker', id], { ...prev, aggregates })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['stat-tracker', id], ctx.prev)
    },
    onSuccess: (data) => qc.setQueryData(['stat-tracker', id], data),
  })

  const bulkEntryMutation = useMutation({
    mutationFn: (data: { participantIds: number[]; metricId: number; delta: number }) =>
      statTrackersApi.addBulkEntries(id, { ...data, period: currentPeriod }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['stat-tracker', id] })
      const prev = qc.getQueryData<StatTrackerDto>(['stat-tracker', id])
      if (prev) {
        const aggregates = [...prev.aggregates]
        for (const pid of vars.participantIds) {
          const idx = aggregates.findIndex(
            (a) => a.participantId === pid && a.metricId === vars.metricId
          )
          if (idx >= 0)
            aggregates[idx] = { ...aggregates[idx], total: aggregates[idx].total + vars.delta }
          else
            aggregates.push({
              participantId: pid,
              metricId: vars.metricId,
              total: vars.delta,
              byPeriod: {},
            })
        }
        qc.setQueryData<StatTrackerDto>(['stat-tracker', id], { ...prev, aggregates })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['stat-tracker', id], ctx.prev)
    },
    onSuccess: (data) => qc.setQueryData(['stat-tracker', id], data),
  })

  const undoMutation = useMutation({
    mutationFn: () => statTrackersApi.undoLast(id),
    onSuccess: (data) => qc.setQueryData(['stat-tracker', id], data),
  })

  const scoreMutation = useMutation({
    mutationFn: (side: 'home' | 'away') =>
      statTrackersApi.addScore(id, { side, period: currentPeriod }),
    onMutate: async (side) => {
      await qc.cancelQueries({ queryKey: ['stat-tracker', id] })
      const prev = qc.getQueryData<StatTrackerDto>(['stat-tracker', id])
      if (prev) {
        const next = { ...prev }
        if (side === 'home') next.homeScore = (prev.homeScore ?? 0) + 1
        else next.awayScore = (prev.awayScore ?? 0) + 1
        qc.setQueryData<StatTrackerDto>(['stat-tracker', id], next)
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['stat-tracker', id], ctx.prev)
    },
    onSuccess: (data) => qc.setQueryData(['stat-tracker', id], data),
  })

  const matchMutation = useMutation({
    mutationFn: (data: { currentPeriod?: number | null }) =>
      statTrackersApi.updateMatch(id, {
        opponentName: tracker?.opponentName ?? null,
        matchPeriodCount: tracker?.matchPeriodCount ?? null,
        matchPartDurationMinutes: tracker?.matchPartDurationMinutes ?? null,
        currentPeriod: data.currentPeriod ?? null,
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['stat-tracker', id] })
      const prev = qc.getQueryData<StatTrackerDto>(['stat-tracker', id])
      if (prev)
        qc.setQueryData<StatTrackerDto>(['stat-tracker', id], {
          ...prev,
          currentPeriod: vars.currentPeriod ?? null,
        })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['stat-tracker', id], ctx.prev)
    },
    onSuccess: (data) => qc.setQueryData(['stat-tracker', id], data),
  })

  const lastEntry = useMemo(() => tracker?.recentEntries[0] ?? null, [tracker])

  const lastActionLabel = useMemo(() => {
    if (!tracker || !lastEntry) return null
    const sign = lastEntry.delta < 0 ? '−' : '+'
    if (lastEntry.kind === 1) return `${sign}1 skóre ${tracker.teamName ?? 'My'}`
    if (lastEntry.kind === 2) return `${sign}1 skóre ${tracker.opponentName ?? 'soupeř'}`
    const m =
      lastEntry.metricId != null ? tracker.metrics.find((x) => x.id === lastEntry.metricId) : null
    if (!m) return null
    const batch = tracker.recentEntries.filter(
      (e) =>
        e.createdAt === lastEntry.createdAt && e.metricId === lastEntry.metricId && e.kind === 0
    )
    if (batch.length > 1) return `${sign}${batch.length}× ${m.name} (formace)`
    const p =
      lastEntry.participantId != null
        ? tracker.participants.find((x) => x.id === lastEntry.participantId)
        : null
    if (!p) return null
    return `${sign}1 ${m.name} – ${p.firstName} ${p.lastName}`.trim()
  }, [tracker, lastEntry])

  if (isLoading) return <LoadingSpinner />
  if (!tracker) return <p className="text-center text-gray-500 mt-12">Statistika nenalezena.</p>

  const sortedMetrics = [...tracker.metrics].sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedParticipants = [...tracker.participants].sort((a, b) => a.sortOrder - b.sortOrder)
  const participantByMember = new Map(sortedParticipants.map((p) => [p.memberId, p]))

  if (sortedParticipants.length === 0 || sortedMetrics.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Statistika"
          description="Pro zápis je potřeba mít vybrané hráče a sledované údaje."
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Zavřít
            </Button>
          }
        />
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-sm text-gray-500 mb-4">Nejprve dokonči nastavení.</p>
            <Button onClick={() => navigate(`/stats/${id}/setup`)}>
              <Settings className="h-4 w-4" />
              Nastavení
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const eventLabel = tracker.eventName ?? (tracker.eventCategory === 1 ? 'Trénink' : 'Zápas')
  const isMatch = tracker.eventCategory === 0
  const periodCount = tracker.matchPeriodCount ?? null

  const getTotal = (pid: number, mid: number) =>
    tracker.aggregates.find((a) => a.participantId === pid && a.metricId === mid)?.total ?? 0

  // Build sections (Brankáři / formace 1..N / Lavička / fallback)
  const goalieParticipants: StatTrackerParticipantDto[] = []
  const formationGroups: {
    id: number
    title: string
    colorKey: string
    participants: StatTrackerParticipantDto[]
  }[] = []
  const benchParticipants: StatTrackerParticipantDto[] = []
  const flatFallback: StatTrackerParticipantDto[] = []

  if (grouping && grouping.formations.length > 0) {
    const usedIds = new Set<number>()
    for (const g of grouping.goalies) {
      const p = participantByMember.get(g.memberId)
      if (p) {
        goalieParticipants.push(p)
        usedIds.add(p.id)
      }
    }
    for (const p of sortedParticipants) {
      if (p.role === 1 && !usedIds.has(p.id)) {
        goalieParticipants.push(p)
        usedIds.add(p.id)
      }
    }
    for (const f of grouping.formations) {
      const list: StatTrackerParticipantDto[] = []
      for (const m of f.members) {
        const p = participantByMember.get(m.memberId)
        if (p && !usedIds.has(p.id)) {
          list.push(p)
          usedIds.add(p.id)
        }
      }
      formationGroups.push({
        id: f.id,
        title: f.label || `Formace ${f.index + 1}`,
        colorKey: f.colorKey,
        participants: list,
      })
    }
    for (const m of grouping.bench) {
      const p = participantByMember.get(m.memberId)
      if (p && !usedIds.has(p.id)) {
        benchParticipants.push(p)
        usedIds.add(p.id)
      }
    }
    for (const p of sortedParticipants) {
      if (!usedIds.has(p.id)) benchParticipants.push(p)
    }
  } else {
    for (const p of sortedParticipants) {
      if (p.role === 1) goalieParticipants.push(p)
      else flatFallback.push(p)
    }
  }

  const rows: SectionRow[] = []
  if (goalieParticipants.length > 0) {
    rows.push({
      kind: 'header',
      title: 'Brankáři',
      accent: 'amber',
      bulkParticipants: goalieParticipants,
      showBulk: false,
    })
    for (const p of goalieParticipants)
      rows.push({ kind: 'player', participant: p, rowAccent: 'amber', forceGoalie: true })
  }
  for (const g of formationGroups) {
    if (g.participants.length === 0) continue
    rows.push({
      kind: 'header',
      title: g.title,
      accent: g.colorKey,
      bulkParticipants: g.participants,
      showBulk: true,
    })
    for (const p of g.participants)
      rows.push({ kind: 'player', participant: p, rowAccent: g.colorKey })
  }
  if (benchParticipants.length > 0) {
    rows.push({
      kind: 'header',
      title: 'Lavička',
      accent: 'gray',
      bulkParticipants: benchParticipants,
      showBulk: false,
    })
    for (const p of benchParticipants)
      rows.push({ kind: 'player', participant: p, rowAccent: 'gray' })
  }
  if (flatFallback.length > 0) {
    rows.push({
      kind: 'header',
      title: 'Hráči v poli',
      accent: 'sky',
      bulkParticipants: flatFallback,
      showBulk: true,
    })
    for (const p of flatFallback) rows.push({ kind: 'player', participant: p, rowAccent: 'sky' })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Zápis statistik"
        description={`${tracker.teamName ?? ''} • ${eventLabel}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/stats/${id}/setup`)}>
              <Settings className="h-4 w-4" />
              Nastavení
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Ukončit zápis
            </Button>
          </div>
        }
      />

      {/* Match scoreboard */}
      {isMatch && (
        <Card className="mb-3 border-2 border-sky-200">
          <CardContent className="px-4 py-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="text-center">
                <p className="truncate text-sm font-semibold text-gray-700">
                  {tracker.teamName ?? 'My'}
                </p>
                <button
                  type="button"
                  onClick={() => scoreMutation.mutate('home')}
                  disabled={scoreMutation.isPending}
                  className="mt-1 inline-flex h-14 w-20 items-center justify-center rounded-xl border-2 border-sky-200 bg-white text-3xl font-bold tabular-nums text-sky-700 transition active:scale-[0.96] hover:border-sky-400 hover:bg-sky-50"
                  title="Klikem +1; vrátit přes tlačítko Zpět"
                >
                  {tracker.homeScore}
                </button>
              </div>
              <div className="text-2xl font-light text-gray-400">:</div>
              <div className="text-center">
                <p className="truncate text-sm font-semibold text-gray-700">
                  {tracker.opponentName?.trim() ? tracker.opponentName : 'Soupeř'}
                </p>
                <button
                  type="button"
                  onClick={() => scoreMutation.mutate('away')}
                  disabled={scoreMutation.isPending}
                  className="mt-1 inline-flex h-14 w-20 items-center justify-center rounded-xl border-2 border-rose-200 bg-white text-3xl font-bold tabular-nums text-rose-700 transition active:scale-[0.96] hover:border-rose-400 hover:bg-rose-50"
                  title="Klikem +1; vrátit přes tlačítko Zpět"
                >
                  {tracker.awayScore}
                </button>
              </div>
            </div>

            {/* Period selector */}
            {periodCount !== null && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 text-xs text-gray-600">
                <span className="font-medium uppercase tracking-wide text-gray-500">Část:</span>
                {periodCount === 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      matchMutation.mutate({ currentPeriod: currentPeriod === 1 ? null : 1 })
                    }
                    className={`rounded-md px-2 py-1 ${
                      currentPeriod === 1
                        ? 'bg-sky-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Hraje se
                  </button>
                ) : (
                  Array.from({ length: periodCount }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        matchMutation.mutate({ currentPeriod: currentPeriod === p ? null : p })
                      }
                      className={`rounded-md px-2 py-1 ${
                        currentPeriod === p
                          ? 'bg-sky-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p}.
                      {periodCount === 2
                        ? ' poločas'
                        : periodCount === 3
                          ? ' třetina'
                          : ' čtvrtina'}
                    </button>
                  ))
                )}
                {tracker.matchPartDurationMinutes && (
                  <span className="ml-auto text-gray-500">
                    {tracker.matchPartDurationMinutes} min{periodCount > 1 ? '/část' : ''}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sticky undo bar */}
      <div className="sticky top-0 z-10 mb-3 -mx-1 flex items-center justify-end rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <Button
          variant="outline"
          size="sm"
          onClick={() => undoMutation.mutate()}
          disabled={!lastEntry || undoMutation.isPending}
        >
          <Undo2 className="h-4 w-4" />
          {lastActionLabel ? `Zpět: ${lastActionLabel}` : 'Zpět'}
        </Button>
      </div>

      {/* Unified table */}
      <Card>
        <CardContent className="px-2 py-2 sm:px-3 sm:py-3">
          <div className="overflow-x-auto">
            <table className="w-full">
              <colgroup>
                <col className="w-[180px]" />
                {sortedMetrics.map((m) => (
                  <col key={m.id} className="w-[72px]" />
                ))}
              </colgroup>
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-2 py-1.5">Hráč / Formace</th>
                  {sortedMetrics.map((m) => (
                    <th key={m.id} className="px-1 py-1.5 text-center">
                      {m.name}
                      {m.isGoalkeeper && (
                        <span className="ml-1 text-[9px] text-amber-600">(B)</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) =>
                  row.kind === 'header' ? (
                    <SectionHeaderRow
                      key={`h-${idx}`}
                      title={row.title!}
                      accent={row.accent!}
                      metrics={sortedMetrics}
                      bulkParticipants={row.bulkParticipants ?? []}
                      showBulk={row.showBulk ?? false}
                      onBulk={(ids, mid, delta) =>
                        bulkEntryMutation.mutate({ participantIds: ids, metricId: mid, delta })
                      }
                      disabled={bulkEntryMutation.isPending}
                    />
                  ) : (
                    <PlayerDataRow
                      key={`p-${row.participant!.id}`}
                      participant={row.participant!}
                      metrics={sortedMetrics}
                      forceGoalie={!!row.forceGoalie}
                      getTotal={getTotal}
                      onChange={(pid, mid, delta) =>
                        addEntryMutation.mutate({ participantId: pid, metricId: mid, delta })
                      }
                      disabled={addEntryMutation.isPending}
                      accent={row.rowAccent ?? 'gray'}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function accentClasses(accent: string, forceGoalie?: boolean) {
  const isGray = accent === 'gray'
  const isAmber = accent === 'amber' || forceGoalie
  if (isGray) return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' }
  if (isAmber) return { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' }
  const c = colorClasses(accent)
  return { bg: c.bgSoft, border: c.border, text: c.text }
}

function SectionHeaderRow({
  title,
  accent,
  metrics,
  bulkParticipants,
  showBulk,
  onBulk,
  disabled,
}: {
  title: string
  accent: string
  metrics: StatTrackerMetricDto[]
  bulkParticipants: StatTrackerParticipantDto[]
  showBulk: boolean
  onBulk: (participantIds: number[], metricId: number, delta: number) => void
  disabled: boolean
}) {
  const c = accentClasses(accent)
  return (
    <tr className={`${c.bg} border-y-2 ${c.border}`}>
      <td className={`px-2 py-1.5 text-[12px] font-semibold uppercase tracking-wide ${c.text}`}>
        {title}
        <span className="ml-2 text-[10px] font-normal normal-case opacity-70">
          {bulkParticipants.length} hráč
          {bulkParticipants.length === 1 ? '' : bulkParticipants.length < 5 ? 'i' : 'ů'}
        </span>
      </td>
      {metrics.map((m) => {
        if (!showBulk) return <td key={m.id} className="px-1 py-1" />
        const applicable = bulkParticipants.filter((p) => !m.isGoalkeeper || p.role === 1)
        const ids = applicable.map((p) => p.id)
        return (
          <td key={m.id} className="px-1 py-1 text-center">
            {ids.length > 0 ? (
              <BulkButtons
                isGoalie={m.isGoalkeeper}
                onPlus={() => onBulk(ids, m.id, 1)}
                onMinus={() => onBulk(ids, m.id, -1)}
                disabled={disabled}
              />
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}

function PlayerDataRow({
  participant,
  metrics,
  forceGoalie,
  getTotal,
  onChange,
  disabled,
  accent,
}: {
  participant: StatTrackerParticipantDto
  metrics: StatTrackerMetricDto[]
  forceGoalie: boolean
  getTotal: (pid: number, mid: number) => number
  onChange: (pid: number, mid: number, delta: number) => void
  disabled: boolean
  accent: string
}) {
  const c = accentClasses(accent, forceGoalie)
  return (
    <tr className="border-b border-gray-100">
      <td className="whitespace-nowrap px-2 py-1.5">
        <span
          className={`inline-block h-2 w-2 rounded-full ${c.bg.replace('bg-', 'bg-').replace('-100', '-400')} mr-2 align-middle`}
        />
        <span className="align-middle text-sm text-gray-900">
          {participant.firstName} {participant.lastName}
        </span>
        {participant.role === 1 && (
          <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium text-amber-700 align-middle">
            B
          </span>
        )}
      </td>
      {metrics.map((m) => {
        const applicable = !m.isGoalkeeper || participant.role === 1 || forceGoalie
        return (
          <td key={m.id} className="px-1 py-1 text-center">
            {applicable ? (
              <Cell
                count={getTotal(participant.id, m.id)}
                isGoalie={m.isGoalkeeper}
                onPlus={() => onChange(participant.id, m.id, 1)}
                onMinus={() => onChange(participant.id, m.id, -1)}
                disabled={disabled}
              />
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}

function Cell({
  count,
  isGoalie,
  onPlus,
  onMinus,
  disabled,
}: {
  count: number
  isGoalie?: boolean
  onPlus: () => void
  onMinus: () => void
  disabled?: boolean
}) {
  const tone = isGoalie
    ? 'border-amber-300 hover:border-amber-400 hover:bg-amber-50'
    : 'border-gray-200 hover:border-sky-400 hover:bg-sky-50'
  const accentText = isGoalie ? 'text-amber-700' : 'text-sky-700'
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onPlus}
        disabled={disabled}
        className={`flex aspect-square w-12 flex-col items-center justify-center rounded-xl border-2 bg-white text-center transition active:scale-[0.95] disabled:opacity-60 sm:w-14 ${tone}`}
      >
        <span className={`text-base font-bold leading-none ${accentText}`}>+</span>
        <span className="mt-0.5 text-[11px] tabular-nums text-gray-600">({count})</span>
      </button>
      {count > 0 && (
        <button
          type="button"
          onClick={onMinus}
          disabled={disabled}
          title="Vrátit −1"
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-500 shadow-sm hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
        >
          −
        </button>
      )}
    </div>
  )
}

function BulkButtons({
  isGoalie,
  onPlus,
  onMinus,
  disabled,
}: {
  isGoalie?: boolean
  onPlus: () => void
  onMinus: () => void
  disabled?: boolean
}) {
  const plusTone = isGoalie ? 'text-amber-700 hover:bg-amber-50' : 'text-sky-700 hover:bg-sky-50'
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onMinus}
        disabled={disabled}
        title="Odebrat 1 každému"
        className="flex aspect-square w-7 items-center justify-center rounded-md border-2 border-gray-200 bg-white text-sm font-bold text-gray-500 transition active:scale-[0.95] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      >
        −
      </button>
      <button
        type="button"
        onClick={onPlus}
        disabled={disabled}
        title="Přidat 1 každému"
        className={`flex aspect-square w-7 items-center justify-center rounded-md border-2 border-gray-200 bg-white text-sm font-bold transition active:scale-[0.95] disabled:opacity-50 ${plusTone}`}
      >
        +
      </button>
    </div>
  )
}
