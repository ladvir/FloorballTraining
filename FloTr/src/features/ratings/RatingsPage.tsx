import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { cs } from 'date-fns/locale'
import {
  Star, BarChart3, Users, UserCheck, Trash2, Edit, Filter,
  TrendingUp, TrendingDown, Target, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { ratingsApi, seasonsApi, teamsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { AppointmentRatingDto } from '../../types/domain.types'

// ── Constants ────────────────────────────────────────────────────────────────

const typeLabels: Record<number, string> = {
  0: 'Trénink', 1: 'Soustředění', 2: 'Propagace',
  3: 'Zápas', 4: 'Ostatní', 5: 'Školení', 6: 'Pořádání akce',
}

const typeBadgeVariant: Record<number, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  0: 'info', 1: 'success', 2: 'warning', 3: 'danger', 4: 'default', 5: 'info', 6: 'success',
}

const gradeColors = ['bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
const gradeLabels = ['Výborná', 'Chvalitebná', 'Dobrá', 'Dostatečná', 'Nedostatečná']
const raterTypeLabels: Record<number, string> = { 0: 'Hráč', 1: 'Trenér' }

type CoachTab = 'overview' | 'byType' | 'byPerson' | 'all'

// ── Helpers ──────────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: number }) {
  const color = gradeColors[grade - 1] ?? 'bg-gray-400'
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
      {grade}
    </span>
  )
}

function GradeBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const color =
    value <= 1.5 ? 'bg-green-500' :
    value <= 2.5 ? 'bg-lime-500' :
    value <= 3.5 ? 'bg-yellow-500' :
    value <= 4.5 ? 'bg-orange-500' : 'bg-red-500'
  const pct = max > 0 ? ((5 - value) / 4) * 100 : 0 // invert: 1=100%, 5=0%

  return (
    <div className="flex items-center gap-2">
      {label && <span className="w-8 text-right text-sm font-bold text-gray-700">{label}</span>}
      <div className="flex-1 h-4 rounded-full bg-gray-100">
        <div className={`h-4 rounded-full ${color} transition-all`} style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
    </div>
  )
}

function avg(nums: number[]): number {
  return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function RatingsPage() {
  const { user, isAdmin, isCoach } = useAuthStore()
  const queryClient = useQueryClient()

  // ── Filters state ──
  const [tab, setTab] = useState<CoachTab>('overview')
  const [seasonId, setSeasonId] = useState<number>(0)
  const [teamId, setTeamId] = useState<number>(0)
  const [typeFilter, setTypeFilter] = useState<number>(-1) // -1 = all
  const [raterFilter, setRaterFilter] = useState<'all' | 'coach' | 'player'>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editGrade, setEditGrade] = useState(1)
  const [editComment, setEditComment] = useState('')

  // ── Data fetching ──
  const { data: allRatings, isLoading: loadingAll } = useQuery({
    queryKey: ['ratings', 'all'],
    queryFn: () => ratingsApi.getAll(),
    enabled: isCoach,
  })
  const { data: myRatings, isLoading: loadingMy } = useQuery({
    queryKey: ['ratings', 'my'],
    queryFn: () => ratingsApi.getMy(),
  })
  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
    enabled: isCoach,
  })
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
    enabled: isCoach,
  })

  // ── Mutations ──
  const deleteMutation = useMutation({
    mutationFn: ratingsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ratings'] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AppointmentRatingDto> }) =>
      ratingsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ratings'] }); setEditingId(null) },
  })

  // ── Filtered data (coach) ──
  const filtered = useMemo(() => {
    let items = allRatings ?? []
    // Season filter (date range)
    if (seasonId && seasons) {
      const season = seasons.find((s) => s.id === seasonId)
      if (season) {
        const start = new Date(season.startDate)
        const end = new Date(season.endDate)
        items = items.filter((r) => r.appointmentStart && isWithinInterval(parseISO(r.appointmentStart), { start, end }))
      }
    }
    // Team
    if (teamId) items = items.filter((r) => r.teamId === teamId)
    // Appointment type
    if (typeFilter >= 0) items = items.filter((r) => r.appointmentType === typeFilter)
    // Rater type
    if (raterFilter === 'coach') items = items.filter((r) => r.raterType === 1)
    if (raterFilter === 'player') items = items.filter((r) => r.raterType === 0)
    return items
  }, [allRatings, seasonId, seasons, teamId, typeFilter, raterFilter])

  // ── Player-only view ──
  if (!isCoach) {
    return <PlayerRatingsView ratings={myRatings ?? []} isLoading={loadingMy} />
  }

  // ── Coach analytics data ──
  const stats = useMemo(() => computeStats(filtered), [filtered])

  const startEdit = (r: AppointmentRatingDto) => {
    setEditingId(r.id)
    setEditGrade(r.grade)
    setEditComment(r.comment ?? '')
  }
  const saveEdit = () => {
    if (editingId == null) return
    updateMutation.mutate({ id: editingId, data: { grade: editGrade, comment: editComment } })
  }

  const tabs: { key: CoachTab; label: string }[] = [
    { key: 'overview', label: 'Přehled' },
    { key: 'byType', label: 'Podle typu' },
    { key: 'byPerson', label: 'Podle osob' },
    { key: 'all', label: 'Všechna hodnocení' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hodnocení</h1>
          <p className="mt-1 text-sm text-gray-500">Analytický přehled hodnocení událostí</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5">
        <Filter className="h-4 w-4 text-gray-400" />

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500">Sezóna:</label>
          <select value={seasonId} onChange={(e) => { setSeasonId(Number(e.target.value)); setTeamId(0) }}
            className="h-7 rounded border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none">
            <option value={0}>Všechny</option>
            {seasons?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <span className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500">Tým:</label>
          <select value={teamId} onChange={(e) => setTeamId(Number(e.target.value))}
            className="h-7 rounded border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none">
            <option value={0}>Všechny</option>
            {(seasonId
              ? teams?.filter((t) => t.seasonId === seasonId)
              : teams
            )?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <span className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500">Typ:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(Number(e.target.value))}
            className="h-7 rounded border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none">
            <option value={-1}>Všechny</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <span className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500">Hodnotitel:</label>
          <select value={raterFilter} onChange={(e) => setRaterFilter(e.target.value as 'all' | 'coach' | 'player')}
            className="h-7 rounded border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none">
            <option value="all">Všichni</option>
            <option value="coach">Trenéři</option>
            <option value="player">Hráči</option>
          </select>
        </div>

        {(seasonId || teamId || typeFilter >= 0 || raterFilter !== 'all') && (
          <>
            <span className="h-4 w-px bg-gray-200" />
            <button
              onClick={() => { setSeasonId(0); setTeamId(0); setTypeFilter(-1); setRaterFilter('all') }}
              className="text-xs text-sky-600 hover:text-sky-800"
            >
              Zrušit filtry
            </button>
          </>
        )}

        <span className="ml-auto text-xs text-gray-400">{filtered.length} hodnocení</span>
      </div>

      {loadingAll ? <LoadingSpinner /> : (
        <>
          {tab === 'overview' && <OverviewTab stats={stats} ratings={filtered} />}
          {tab === 'byType' && <ByTypeTab ratings={filtered} />}
          {tab === 'byPerson' && <ByPersonTab ratings={filtered} />}
          {tab === 'all' && (
            <AllRatingsTab
              ratings={filtered}
              user={user}
              isAdmin={isAdmin}
              editingId={editingId}
              editGrade={editGrade}
              editComment={editComment}
              setEditGrade={setEditGrade}
              setEditComment={setEditComment}
              startEdit={startEdit}
              saveEdit={saveEdit}
              cancelEdit={() => setEditingId(null)}
              deleteMutation={deleteMutation}
              updateMutation={updateMutation}
            />
          )}
        </>
      )}
    </div>
  )
}

// ── Stats computation ────────────────────────────────────────────────────────

interface ComputedStats {
  totalRatings: number
  averageGrade: number
  gradeDistribution: number[]
  ratedAppointments: number
  coachRatings: number
  playerRatings: number
  uniqueRaters: number
}

function computeStats(ratings: AppointmentRatingDto[]): ComputedStats {
  const s: ComputedStats = {
    totalRatings: ratings.length,
    averageGrade: avg(ratings.map((r) => r.grade)),
    gradeDistribution: [0, 0, 0, 0, 0],
    ratedAppointments: new Set(ratings.map((r) => r.appointmentId)).size,
    coachRatings: ratings.filter((r) => r.raterType === 1).length,
    playerRatings: ratings.filter((r) => r.raterType === 0).length,
    uniqueRaters: new Set(ratings.map((r) => r.userId)).size,
  }
  for (const r of ratings) {
    if (r.grade >= 1 && r.grade <= 5) s.gradeDistribution[r.grade - 1]++
  }
  return s
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ stats, ratings }: { stats: ComputedStats; ratings: AppointmentRatingDto[] }) {
  if (stats.totalRatings === 0) return <EmptyState title="Žádná hodnocení" description="Pro zvolené filtry neexistují žádná hodnocení." />

  const maxDist = Math.max(...stats.gradeDistribution, 1)

  // Best & worst rated appointments
  const byAppointment = groupBy(ratings, (r) => r.appointmentId)
  const appointmentAvgs = Object.entries(byAppointment).map(([aptId, items]) => ({
    appointmentId: Number(aptId),
    name: items[0].appointmentName || items[0].trainingName || `Událost #${aptId}`,
    start: items[0].appointmentStart,
    type: items[0].appointmentType,
    teamName: items[0].teamName,
    avg: avg(items.map((r) => r.grade)),
    count: items.length,
  })).filter((a) => a.count >= 1)
  appointmentAvgs.sort((a, b) => a.avg - b.avg)

  const best5 = appointmentAvgs.slice(0, 5)
  const worst5 = [...appointmentAvgs].sort((a, b) => b.avg - a.avg).slice(0, 5)

  // Monthly trend
  const byMonth = groupBy(ratings, (r) => r.appointmentStart ? format(parseISO(r.appointmentStart), 'yyyy-MM') : 'unknown')
  const monthlyTrend = Object.entries(byMonth)
    .filter(([k]) => k !== 'unknown')
    .map(([month, items]) => ({ month, avg: avg(items.map((r) => r.grade)), count: items.length }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard icon={Star} color="sky" value={stats.totalRatings} label="Celkem hodnocení" />
        <SummaryCard icon={BarChart3} color="amber" value={stats.averageGrade || '—'} label="Průměrná známka" />
        <SummaryCard icon={Target} color="indigo" value={stats.ratedAppointments} label="Hodnocených událostí" />
        <SummaryCard icon={UserCheck} color="green" value={stats.coachRatings} label="Hodnocení trenérů" />
        <SummaryCard icon={Users} color="purple" value={stats.playerRatings} label="Hodnocení hráčů" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Grade distribution */}
        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Rozložení známek</h3>
            <div className="space-y-2">
              {stats.gradeDistribution.map((count, i) => (
                <div key={i} className="flex items-center gap-3">
                  <GradeBadge grade={i + 1} />
                  <span className="w-24 text-xs text-gray-500">{gradeLabels[i]}</span>
                  <div className="flex-1">
                    <div className="h-5 rounded-full bg-gray-100">
                      <div
                        className={`h-5 rounded-full ${gradeColors[i]} transition-all`}
                        style={{ width: `${(count / maxDist) * 100}%`, minWidth: count > 0 ? '8px' : '0' }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly trend */}
        {monthlyTrend.length > 1 && (
          <Card>
            <CardContent className="py-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Trend po měsících</h3>
              <div className="space-y-2">
                {monthlyTrend.map((m) => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-medium text-gray-600">
                      {format(parseISO(m.month + '-01'), 'LLL yyyy', { locale: cs })}
                    </span>
                    <GradeBar value={m.avg} max={5} label={String(m.avg)} />
                    <span className="w-12 text-right text-[10px] text-gray-400">{m.count}x</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Best rated */}
        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <TrendingUp className="h-4 w-4 text-green-500" /> Nejlépe hodnocené události
            </h3>
            <RankedList items={best5} />
          </CardContent>
        </Card>

        {/* Worst rated */}
        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <TrendingDown className="h-4 w-4 text-red-500" /> Nejhůře hodnocené události
            </h3>
            <RankedList items={worst5} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── By Type Tab ──────────────────────────────────────────────────────────────

function ByTypeTab({ ratings }: { ratings: AppointmentRatingDto[] }) {
  if (!ratings.length) return <EmptyState title="Žádná data" description="Pro zvolené filtry neexistují žádná hodnocení." />

  const byType = groupBy(ratings, (r) => r.appointmentType ?? 4)
  const typeStats = Object.entries(byType)
    .map(([type, items]) => {
      const t = Number(type)
      const coachItems = items.filter((r) => r.raterType === 1)
      const playerItems = items.filter((r) => r.raterType === 0)
      return {
        type: t,
        label: typeLabels[t] ?? 'Neznámý',
        total: items.length,
        avg: avg(items.map((r) => r.grade)),
        coachAvg: coachItems.length ? avg(coachItems.map((r) => r.grade)) : null,
        playerAvg: playerItems.length ? avg(playerItems.map((r) => r.grade)) : null,
        coachCount: coachItems.length,
        playerCount: playerItems.length,
        events: new Set(items.map((r) => r.appointmentId)).size,
      }
    })
    .sort((a, b) => a.avg - b.avg)

  return (
    <div className="space-y-4">
      {/* Summary comparison */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {typeStats.map((ts) => (
          <Card key={ts.type}>
            <CardContent className="py-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant={typeBadgeVariant[ts.type]}>{ts.label}</Badge>
                <span className="text-lg font-bold text-gray-900">{ts.avg}</span>
              </div>
              <GradeBar value={ts.avg} max={5} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <span className="font-medium text-gray-700">{ts.total}</span> hodnocení
                </div>
                <div>
                  <span className="font-medium text-gray-700">{ts.events}</span> událostí
                </div>
                {ts.coachAvg != null && (
                  <div>Trenéři: <span className="font-medium text-gray-700">{ts.coachAvg}</span> ({ts.coachCount})</div>
                )}
                {ts.playerAvg != null && (
                  <div>Hráči: <span className="font-medium text-gray-700">{ts.playerAvg}</span> ({ts.playerCount})</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-type event detail */}
      {typeStats.map((ts) => {
        const items = byType[ts.type] ?? []
        const byApt = groupBy(items, (r) => r.appointmentId)
        const aptList = Object.entries(byApt)
          .map(([aptId, rs]) => ({
            id: Number(aptId),
            name: rs[0].appointmentName || rs[0].trainingName || `#${aptId}`,
            start: rs[0].appointmentStart,
            teamName: rs[0].teamName,
            avg: avg(rs.map((r) => r.grade)),
            count: rs.length,
          }))
          .sort((a, b) => a.avg - b.avg)

        return (
          <CollapsibleSection key={ts.type} title={`${ts.label} — ${aptList.length} událostí`} defaultOpen={false}>
            <div className="space-y-1">
              {aptList.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                  <GradeBadge grade={Math.round(a.avg)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate block">{a.name}</span>
                    <span className="text-xs text-gray-400">
                      {a.start && format(parseISO(a.start), 'd. M. yyyy', { locale: cs })}
                      {a.teamName && ` · ${a.teamName}`}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{a.avg}</span>
                  <span className="text-xs text-gray-400">{a.count}x</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )
      })}
    </div>
  )
}

// ── By Person Tab ────────────────────────────────────────────────────────────

function ByPersonTab({ ratings }: { ratings: AppointmentRatingDto[] }) {
  if (!ratings.length) return <EmptyState title="Žádná data" description="Pro zvolené filtry neexistují žádná hodnocení." />

  const [sortBy, setSortBy] = useState<'name' | 'avg' | 'count'>('name')

  const byPerson = groupBy(ratings, (r) => r.userId)
  let personStats = Object.entries(byPerson).map(([userId, items]) => ({
    userId,
    name: items[0].userName || 'Neznámý',
    raterType: items[0].raterType,
    avg: avg(items.map((r) => r.grade)),
    count: items.length,
    grades: items.map((r) => r.grade),
    events: new Set(items.map((r) => r.appointmentId)).size,
    // per appointment type averages
    byType: Object.entries(groupBy(items, (r) => r.appointmentType ?? 4)).map(([type, rs]) => ({
      type: Number(type),
      avg: avg(rs.map((r) => r.grade)),
      count: rs.length,
    })),
  }))

  if (sortBy === 'name') personStats.sort((a, b) => a.name.localeCompare(b.name, 'cs'))
  else if (sortBy === 'avg') personStats.sort((a, b) => a.avg - b.avg)
  else personStats.sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Řadit:</span>
        <button onClick={() => setSortBy('name')} className={`rounded px-2 py-0.5 ${sortBy === 'name' ? 'bg-sky-100 text-sky-700 font-medium' : 'hover:bg-gray-100'}`}>Jméno</button>
        <button onClick={() => setSortBy('avg')} className={`rounded px-2 py-0.5 ${sortBy === 'avg' ? 'bg-sky-100 text-sky-700 font-medium' : 'hover:bg-gray-100'}`}>Průměr</button>
        <button onClick={() => setSortBy('count')} className={`rounded px-2 py-0.5 ${sortBy === 'count' ? 'bg-sky-100 text-sky-700 font-medium' : 'hover:bg-gray-100'}`}>Počet</button>
        <span className="ml-auto text-gray-400">{personStats.length} osob</span>
      </div>

      <div className="space-y-3">
        {personStats.map((p) => (
          <Card key={p.userId}>
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                  {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    <Badge variant={p.raterType === 1 ? 'warning' : 'default'} size="sm">
                      {raterTypeLabels[p.raterType]}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>{p.count} hodnocení</span>
                    <span>{p.events} událostí</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{p.avg}</span>
                  <p className="text-[10px] text-gray-400">průměr</p>
                </div>
              </div>

              {/* Mini grade distribution */}
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((g) => {
                  const count = p.grades.filter((gr) => gr === g).length
                  return (
                    <div key={g} className="flex-1">
                      <div className="flex items-center justify-center gap-0.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${gradeColors[g - 1]}`} />
                        <span className="text-[10px] text-gray-500">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Per-type breakdown */}
              {p.byType.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.byType.sort((a, b) => a.type - b.type).map((bt) => (
                    <span key={bt.type} className="inline-flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600">
                      {typeLabels[bt.type]}: <strong>{bt.avg}</strong> ({bt.count}x)
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── All Ratings Tab ──────────────────────────────────────────────────────────

function AllRatingsTab({
  ratings, user, isAdmin, editingId, editGrade, editComment,
  setEditGrade, setEditComment, startEdit, saveEdit, cancelEdit,
  deleteMutation, updateMutation,
}: {
  ratings: AppointmentRatingDto[]
  user: { id: string } | null
  isAdmin: boolean
  editingId: number | null
  editGrade: number
  editComment: string
  setEditGrade: (g: number) => void
  setEditComment: (c: string) => void
  startEdit: (r: AppointmentRatingDto) => void
  saveEdit: () => void
  cancelEdit: () => void
  deleteMutation: { mutate: (id: number) => void }
  updateMutation: { isPending: boolean }
}) {
  if (!ratings.length) return <EmptyState title="Žádná hodnocení" description="Pro zvolené filtry neexistují žádná hodnocení." />

  return (
    <div className="space-y-2">
      {ratings.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex items-start gap-4 py-3">
            <GradeBadge grade={r.grade} />
            <div className="flex-1 min-w-0">
              {editingId === r.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Známka:</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((g) => (
                        <button key={g} onClick={() => setEditGrade(g)}
                          className={`h-8 w-8 rounded-full text-sm font-bold text-white ${gradeColors[g - 1]} ${editGrade === g ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-50'}`}
                        >{g}</button>
                      ))}
                    </div>
                  </div>
                  <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm" rows={2} placeholder="Komentář..." />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} loading={updateMutation.isPending}>Uložit</Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>Zrušit</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {r.appointmentName || r.trainingName || (r.appointmentStart ? format(parseISO(r.appointmentStart), 'EEEE d. M. yyyy', { locale: cs }) : `Událost #${r.appointmentId}`)}
                    </span>
                    {r.appointmentType != null && (
                      <Badge variant={typeBadgeVariant[r.appointmentType ?? 4]} size="sm">
                        {typeLabels[r.appointmentType ?? 4]}
                      </Badge>
                    )}
                    <Badge variant={r.raterType === 1 ? 'warning' : 'default'} size="sm">
                      {raterTypeLabels[r.raterType]}
                    </Badge>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    {r.userName && <span>{r.userName}</span>}
                    {r.teamName && <span>{r.teamName}</span>}
                    {r.appointmentStart && <span>{format(parseISO(r.appointmentStart), 'd. M. yyyy', { locale: cs })}</span>}
                    <span>{format(parseISO(r.createdAt), 'd. M. yyyy HH:mm', { locale: cs })}</span>
                  </div>
                </>
              )}
            </div>
            {editingId !== r.id && (user?.id === r.userId || isAdmin) && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(r)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Upravit">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => { if (confirm('Smazat hodnocení?')) deleteMutation.mutate(r.id) }}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Smazat">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Player View ──────────────────────────────────────────────────────────────

function PlayerRatingsView({ ratings, isLoading }: { ratings: AppointmentRatingDto[]; isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Moje hodnocení</h1>
        <p className="mt-1 text-sm text-gray-500">Přehled vašich hodnocení událostí</p>
      </div>
      {!ratings.length ? (
        <EmptyState title="Žádná hodnocení" description="Zatím jste nehodnotili žádnou událost." />
      ) : (
        <div className="space-y-2">
          {ratings.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <GradeBadge grade={r.grade} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {r.appointmentName || (r.appointmentStart ? format(parseISO(r.appointmentStart), 'EEEE d. M. yyyy', { locale: cs }) : `Událost #${r.appointmentId}`)}
                    </span>
                    {r.appointmentType != null && (
                      <Badge variant={typeBadgeVariant[r.appointmentType ?? 4]} size="sm">
                        {typeLabels[r.appointmentType ?? 4]}
                      </Badge>
                    )}
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                  <div className="mt-1 text-xs text-gray-400">
                    {r.appointmentStart && format(parseISO(r.appointmentStart), 'd. M. yyyy', { locale: cs })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Shared components ────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
}

function SummaryCard({ icon: Icon, color, value, label }: { icon: React.ElementType; color: string; value: string | number; label: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RankedItem {
  name: string
  start?: string
  type?: number
  teamName?: string
  avg: number
  count: number
}

function RankedList({ items }: { items: RankedItem[] }) {
  if (!items.length) return <p className="text-xs text-gray-400">Nedostatek dat</p>
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">{item.name}</p>
            <p className="text-[10px] text-gray-400">
              {item.start && format(parseISO(item.start), 'd. M. yyyy', { locale: cs })}
              {item.teamName && ` · ${item.teamName}`}
              {item.type != null && ` · ${typeLabels[item.type]}`}
              {` · ${item.count} hodnocení`}
            </p>
          </div>
          <GradeBadge grade={Math.round(item.avg)} />
          <span className="text-sm font-bold text-gray-700 w-8 text-right">{item.avg}</span>
        </div>
      ))}
    </div>
  )
}

function CollapsibleSection({ title, defaultOpen, children }: { title: string; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100 px-4 py-3">{children}</div>}
    </Card>
  )
}

// ── Utils ────────────────────────────────────────────────────────────────────

function groupBy<T>(items: T[], keyFn: (item: T) => string | number): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const key = String(keyFn(item))
    ;(map[key] ??= []).push(item)
  }
  return map
}
