import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Trophy,
  X,
  Star,
  Save,
  HelpCircle,
  ArrowLeft,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { tournamentsApi } from '../../api/index'
import { TournamentMatchStatsButton } from '../stats/TournamentMatchStatsButton'
import type {
  TournamentDto,
  TournamentTeamDto,
  TournamentSpecialTaskDto,
  TournamentMatchDto,
} from '../../types/domain.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

let tempIdCounter = -1
function nextTempId() {
  return tempIdCounter--
}

const STAGE_LABEL: Record<string, string> = {
  rr: 'Skupina',
  sf: 'Semifinále',
  '3p': 'O 3. místo',
  f: 'Finále',
}

interface Standing {
  teamId: number
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  taskBonus: number
  basePoints: number
  totalPoints: number
}

/** Generate pairings for a SINGLE round (1-based) using circle method, cycling for endless mode. */
function generateOneRound(
  teamIds: number[],
  roundNumber: number
): Array<[number | null, number | null]> {
  if (teamIds.length < 2) return []
  const ids: Array<number | null> = [...teamIds]
  const isOdd = ids.length % 2 === 1
  if (isOdd) ids.push(null)
  const n = ids.length
  const half = n / 2
  const cycleLen = n - 1
  const r = (roundNumber - 1) % cycleLen

  const rotating = ids.slice(1)
  for (let i = 0; i < r; i++) {
    rotating.unshift(rotating.pop()!)
  }
  const ordered = [ids[0], ...rotating]

  const round: Array<[number | null, number | null]> = []
  for (let i = 0; i < half; i++) {
    const a = ordered[i]
    const b = ordered[n - 1 - i]
    // Alternate sides between rounds for fairness
    const home = r % 2 === 0 ? a : b
    const away = r % 2 === 0 ? b : a
    round.push([home, away])
  }
  return round
}

/** Build initial RR matches: full cycle (n-1 rounds) or only round 1 for endless. */
function buildInitialMatches(
  teams: TournamentTeamDto[],
  fields: string[],
  endless: boolean
): TournamentMatchDto[] {
  const ids = teams.map((t) => t.id)
  if (ids.length < 2) return []
  const totalRounds = endless ? 1 : ids.length % 2 === 0 ? ids.length - 1 : ids.length
  const matches: TournamentMatchDto[] = []
  for (let r = 1; r <= totalRounds; r++) {
    const pairs = generateOneRound(ids, r)
    let fieldIdx = 0
    pairs.forEach(([home, away]) => {
      const isBye = home === null || away === null
      matches.push({
        id: nextTempId(),
        round: r,
        stage: 'rr',
        field: isBye ? null : (fields[fieldIdx % Math.max(fields.length, 1)] ?? fields[0] ?? ''),
        homeTeamId: home,
        awayTeamId: away,
        played: false,
        homeGoals: 0,
        awayGoals: 0,
        homeSpecialGoals: 0,
        awaySpecialGoals: 0,
        homeTaskIds: [],
        awayTaskIds: [],
      })
      if (!isBye) fieldIdx++
    })
  }
  return matches
}

function buildOneMoreRound(
  teams: TournamentTeamDto[],
  fields: string[],
  existing: TournamentMatchDto[]
): TournamentMatchDto[] {
  const ids = teams.map((t) => t.id)
  if (ids.length < 2) return existing
  const maxRound = existing
    .filter((m) => m.stage === 'rr')
    .reduce((acc, m) => Math.max(acc, m.round), 0)
  const nextRound = maxRound + 1
  const pairs = generateOneRound(ids, nextRound)
  const additions: TournamentMatchDto[] = []
  let fieldIdx = 0
  pairs.forEach(([home, away]) => {
    const isBye = home === null || away === null
    additions.push({
      id: nextTempId(),
      round: nextRound,
      stage: 'rr',
      field: isBye ? null : (fields[fieldIdx % Math.max(fields.length, 1)] ?? fields[0] ?? ''),
      homeTeamId: home,
      awayTeamId: away,
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      homeSpecialGoals: 0,
      awaySpecialGoals: 0,
      homeTaskIds: [],
      awayTaskIds: [],
    })
    if (!isBye) fieldIdx++
  })
  return [...existing, ...additions]
}

function computeStandings(t: TournamentDto): Standing[] {
  const map = new Map<number, Standing>()
  for (const team of t.teams) {
    map.set(team.id, {
      teamId: team.id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      taskBonus: 0,
      basePoints: 0,
      totalPoints: 0,
    })
  }
  const taskMap = new Map(t.specialTasks.map((s) => [s.id, s]))

  for (const m of t.matches) {
    if (m.stage !== 'rr') continue
    if (!m.played || !m.homeTeamId || !m.awayTeamId) continue
    const hg = m.homeGoals
    const ag = m.awayGoals
    const home = map.get(m.homeTeamId)
    const away = map.get(m.awayTeamId)
    if (!home || !away) continue
    home.played++
    away.played++
    home.goalsFor += hg
    home.goalsAgainst += ag
    away.goalsFor += ag
    away.goalsAgainst += hg
    if (hg > ag) {
      home.wins++
      away.losses++
      home.basePoints += 3
    } else if (hg < ag) {
      away.wins++
      home.losses++
      away.basePoints += 3
    } else {
      home.draws++
      away.draws++
      home.basePoints += 1
      away.basePoints += 1
    }
    for (const tid of m.homeTaskIds) {
      const task = taskMap.get(tid)
      if (task) home.taskBonus += task.bonusPoints
    }
    for (const tid of m.awayTaskIds) {
      const task = taskMap.get(tid)
      if (task) away.taskBonus += task.bonusPoints
    }
  }

  const out = [...map.values()]
  for (const s of out) s.totalPoints = s.basePoints + s.taskBonus
  out.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    const dA = a.goalsFor - a.goalsAgainst
    const dB = b.goalsFor - b.goalsAgainst
    if (dB !== dA) return dB - dA
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return 0
  })
  return out
}

function buildPlayoffMatches(t: TournamentDto, standings: Standing[]): TournamentMatchDto[] {
  const top = standings.slice(0, Math.min(4, standings.length)).map((s) => s.teamId)
  if (top.length < 2) return []
  const matches: TournamentMatchDto[] = []
  const field = t.fields[0] ?? ''
  if (top.length >= 4) {
    matches.push({
      id: nextTempId(),
      round: 1,
      stage: 'sf',
      field,
      homeTeamId: top[0],
      awayTeamId: top[3],
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      homeSpecialGoals: 0,
      awaySpecialGoals: 0,
      homeTaskIds: [],
      awayTaskIds: [],
    })
    matches.push({
      id: nextTempId(),
      round: 1,
      stage: 'sf',
      field: t.fields[1] ?? field,
      homeTeamId: top[1],
      awayTeamId: top[2],
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      homeSpecialGoals: 0,
      awaySpecialGoals: 0,
      homeTaskIds: [],
      awayTaskIds: [],
    })
    matches.push({
      id: nextTempId(),
      round: 2,
      stage: '3p',
      field,
      homeTeamId: null,
      awayTeamId: null,
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      homeSpecialGoals: 0,
      awaySpecialGoals: 0,
      homeTaskIds: [],
      awayTaskIds: [],
    })
    matches.push({
      id: nextTempId(),
      round: 2,
      stage: 'f',
      field,
      homeTeamId: null,
      awayTeamId: null,
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      homeSpecialGoals: 0,
      awaySpecialGoals: 0,
      homeTaskIds: [],
      awayTaskIds: [],
    })
  } else {
    matches.push({
      id: nextTempId(),
      round: 1,
      stage: 'f',
      field,
      homeTeamId: top[0],
      awayTeamId: top[1],
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      homeSpecialGoals: 0,
      awaySpecialGoals: 0,
      homeTaskIds: [],
      awayTaskIds: [],
    })
  }
  return matches
}

function propagatePlayoff(matches: TournamentMatchDto[]): TournamentMatchDto[] {
  const sfs = matches.filter((m) => m.stage === 'sf')
  const finalMatch = matches.find((m) => m.stage === 'f')
  const thirdPlace = matches.find((m) => m.stage === '3p')
  if (!finalMatch || !thirdPlace) return matches
  if (sfs.length < 2 || !sfs.every((m) => m.played)) return matches
  const winnerOf = (m: TournamentMatchDto): number | null => {
    if (!m.homeTeamId || !m.awayTeamId) return null
    if (m.homeGoals > m.awayGoals) return m.homeTeamId
    if (m.awayGoals > m.homeGoals) return m.awayTeamId
    return m.homeTeamId
  }
  const loserOf = (m: TournamentMatchDto): number | null => {
    const w = winnerOf(m)
    if (!w) return null
    return w === m.homeTeamId ? (m.awayTeamId ?? null) : (m.homeTeamId ?? null)
  }
  return matches.map((m) => {
    if (m.id === finalMatch.id) {
      return { ...m, homeTeamId: winnerOf(sfs[0]), awayTeamId: winnerOf(sfs[1]) }
    }
    if (m.id === thirdPlace.id) {
      return { ...m, homeTeamId: loserOf(sfs[0]), awayTeamId: loserOf(sfs[1]) }
    }
    return m
  })
}

// ── Reducer ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'init'; t: TournamentDto }
  | { type: 'setName'; name: string }
  | { type: 'setFormat'; format: string }
  | { type: 'addField' }
  | { type: 'setField'; idx: number; name: string }
  | { type: 'removeField'; idx: number }
  | { type: 'addTeam'; name: string }
  | { type: 'removeTeam'; id: number }
  | { type: 'addTask'; name: string; bonus: number }
  | { type: 'removeTask'; id: number }
  | { type: 'regenerateRR' }
  | { type: 'addNextRound' }
  | { type: 'startPlayoff'; standings: Standing[] }
  | { type: 'updateMatch'; id: number; patch: Partial<TournamentMatchDto> }
  | { type: 'resetMatch'; id: number }

function reducer(state: TournamentDto, action: Action): TournamentDto {
  switch (action.type) {
    case 'init':
      return action.t
    case 'setName':
      return { ...state, name: action.name }
    case 'setFormat':
      return { ...state, format: action.format }
    case 'addField':
      return { ...state, fields: [...state.fields, `Hřiště ${state.fields.length + 1}`] }
    case 'setField':
      return { ...state, fields: state.fields.map((f, i) => (i === action.idx ? action.name : f)) }
    case 'removeField':
      return { ...state, fields: state.fields.filter((_, i) => i !== action.idx) }
    case 'addTeam': {
      const sortOrder = state.teams.length
      return {
        ...state,
        teams: [...state.teams, { id: nextTempId(), name: action.name, sortOrder }],
      }
    }
    case 'removeTeam':
      return {
        ...state,
        teams: state.teams.filter((x) => x.id !== action.id),
        matches: state.matches.filter(
          (m) => m.homeTeamId !== action.id && m.awayTeamId !== action.id
        ),
      }
    case 'addTask':
      if (state.specialTasks.length >= 3) return state
      return {
        ...state,
        specialTasks: [
          ...state.specialTasks,
          { id: nextTempId(), name: action.name, bonusPoints: action.bonus },
        ],
      }
    case 'removeTask':
      return {
        ...state,
        specialTasks: state.specialTasks.filter((x) => x.id !== action.id),
        matches: state.matches.map((m) => ({
          ...m,
          homeTaskIds: m.homeTaskIds.filter((x) => x !== action.id),
          awayTaskIds: m.awayTaskIds.filter((x) => x !== action.id),
        })),
      }
    case 'regenerateRR': {
      const endless = state.format === 'round-robin-endless'
      const matches = buildInitialMatches(state.teams, state.fields, endless)
      return { ...state, matches }
    }
    case 'addNextRound': {
      const matches = buildOneMoreRound(state.teams, state.fields, state.matches)
      return { ...state, matches }
    }
    case 'startPlayoff': {
      const playoff = buildPlayoffMatches(state, action.standings)
      return { ...state, matches: [...state.matches.filter((m) => m.stage === 'rr'), ...playoff] }
    }
    case 'updateMatch': {
      const next = state.matches.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m))
      return { ...state, matches: propagatePlayoff(next) }
    }
    case 'resetMatch': {
      const next = state.matches.map((m) =>
        m.id === action.id
          ? {
              ...m,
              played: false,
              homeGoals: 0,
              awayGoals: 0,
              homeSpecialGoals: 0,
              awaySpecialGoals: 0,
              homeTaskIds: [],
              awayTaskIds: [],
            }
          : m
      )
      return { ...state, matches: propagatePlayoff(next) }
    }
    default:
      return state
  }
}

function emptyTournamentDto(): TournamentDto {
  const now = new Date().toISOString()
  return {
    id: 0,
    name: 'Turnaj',
    format: 'round-robin-playoff',
    specialGoalBonusPoints: 0,
    fields: ['Hřiště 1'],
    createdAt: now,
    updatedAt: now,
    teams: [],
    specialTasks: [],
    matches: [],
  }
}

// ── Main page ────────────────────────────────────────────────────────────────

export function TournamentPage() {
  const params = useParams<{ id?: string }>()
  const id = params.id ? Number(params.id) : undefined
  const isNew = !id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [helpOpen, setHelpOpen] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  /** null = follow default (open if no matches); explicit true/false = user override */
  const [setupOverride, setSetupOverride] = useState<boolean | null>(null)
  const initialized = useRef(false)

  const { data: existing, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
  })

  const [state, dispatch] = useReducer(reducer, null as unknown as TournamentDto)

  useEffect(() => {
    if (initialized.current) return
    if (existing) {
      dispatch({ type: 'init', t: existing })
      initialized.current = true
    } else if (isNew) {
      dispatch({ type: 'init', t: emptyTournamentDto() })
      initialized.current = true
    }
  }, [existing, isNew])

  const saveMutation = useMutation({
    mutationFn: async (t: TournamentDto) => {
      if (t.id > 0) return tournamentsApi.update(t.id, t)
      return tournamentsApi.create(t)
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['tournaments'] })
      setSavedAt(new Date())
      if (id) {
        qc.setQueryData(['tournament', id], saved)
        dispatch({ type: 'init', t: saved })
      } else {
        navigate(`/tournaments/${saved.id}`, { replace: true })
      }
    },
  })

  const standings = useMemo(() => (state ? computeStandings(state) : []), [state])
  const teamById = useMemo(
    () =>
      state ? new Map(state.teams.map((x) => [x.id, x])) : new Map<number, TournamentTeamDto>(),
    [state]
  )

  if (isLoading || !state) return <LoadingSpinner />

  const setupOpen = setupOverride ?? state.matches.length === 0
  const isEndless = state.format === 'round-robin-endless'
  const hasPlayoff = state.matches.some((m) => m.stage !== 'rr')
  const rrMatches = state.matches.filter((m) => m.stage === 'rr')
  const rrComplete =
    rrMatches.length > 0 &&
    rrMatches.filter((m) => m.homeTeamId && m.awayTeamId).every((m) => m.played)

  function regenerateSchedule() {
    if (state.teams.length < 2) return
    if (state.matches.length > 0) {
      if (!confirm('Vygenerovat nový rozpis? Ztratíš zaznamenané výsledky.')) return
    }
    dispatch({ type: 'regenerateRR' })
    setSetupOverride(false)
  }
  function addNextRound() {
    if (state.teams.length < 2) return
    dispatch({ type: 'addNextRound' })
  }
  function startPlayoff() {
    if (!rrComplete) {
      alert('Skupina ještě není dohraná.')
      return
    }
    if (hasPlayoff) {
      if (!confirm('Playoff už je vygenerované. Přegenerovat?')) return
    }
    dispatch({ type: 'startPlayoff', standings })
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/tournaments')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 flex-col">
          <label
            htmlFor="tournament-name"
            className="text-[11px] font-medium uppercase tracking-wide text-gray-500"
          >
            Název turnaje
          </label>
          <input
            id="tournament-name"
            value={state.name}
            onChange={(e) => dispatch({ type: 'setName', name: e.target.value })}
            placeholder="Např. Krajský pohár 2026"
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xl font-semibold text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        {state.matches.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSetupOverride(!setupOpen)}
            className="self-end"
          >
            <Settings className="h-4 w-4" />
            {setupOpen ? 'Zavřít nastavení' : 'Upravit nastavení'}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)} className="self-end">
          <HelpCircle className="h-4 w-4" /> Nápověda
        </Button>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate(state)}
          loading={saveMutation.isPending}
          className="self-end"
        >
          <Save className="h-4 w-4" /> {isNew ? 'Vytvořit' : 'Uložit'}
        </Button>
      </div>

      {savedAt && !saveMutation.isPending && (
        <p className="mb-2 text-xs text-green-600">Uloženo {savedAt.toLocaleTimeString('cs-CZ')}</p>
      )}

      <div className={`grid gap-4 ${setupOpen ? 'lg:grid-cols-12' : ''}`}>
        {/* LEFT: setup panels */}
        {setupOpen && (
          <div className="space-y-4 lg:col-span-4">
            <TeamsPanel
              teams={state.teams}
              onAdd={(name) => dispatch({ type: 'addTeam', name })}
              onRemove={(tid) => dispatch({ type: 'removeTeam', id: tid })}
            />
            <FieldsPanel
              fields={state.fields}
              onAdd={() => dispatch({ type: 'addField' })}
              onChange={(idx, n) => dispatch({ type: 'setField', idx, name: n })}
              onRemove={(idx) => dispatch({ type: 'removeField', idx })}
            />
            <FormatPanel
              format={state.format}
              onChangeFormat={(f) => dispatch({ type: 'setFormat', format: f })}
            />
            <TasksPanel
              tasks={state.specialTasks}
              onAdd={(name, bonus) => dispatch({ type: 'addTask', name, bonus })}
              onRemove={(tid) => dispatch({ type: 'removeTask', id: tid })}
            />
            <div className="flex flex-col gap-2">
              <Button onClick={regenerateSchedule} disabled={state.teams.length < 2}>
                <Trophy className="h-4 w-4" />
                {state.matches.length === 0
                  ? isEndless
                    ? 'Spustit turnaj (1. kolo)'
                    : 'Vygenerovat rozlosování'
                  : 'Vygenerovat znovu'}
              </Button>
            </div>
          </div>
        )}

        {/* RIGHT: standings + matches */}
        <div className={`space-y-4 ${setupOpen ? 'lg:col-span-8' : ''}`}>
          <StandingsPanel standings={standings} teamById={teamById} />
          <ScheduleAndMatchesPanel
            tournament={state}
            teamById={teamById}
            isEndless={isEndless}
            rrComplete={rrComplete}
            hasPlayoff={hasPlayoff}
            onAddNextRound={addNextRound}
            onStartPlayoff={startPlayoff}
            onUpdateMatch={(mid, patch) => dispatch({ type: 'updateMatch', id: mid, patch })}
            onResetMatch={(mid) => dispatch({ type: 'resetMatch', id: mid })}
          />
        </div>
      </div>

      <TournamentHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

// ── Panels ───────────────────────────────────────────────────────────────────

function TeamsPanel({
  teams,
  onAdd,
  onRemove,
}: {
  teams: TournamentTeamDto[]
  onAdd: (name: string) => void
  onRemove: (id: number) => void
}) {
  const [name, setName] = useState('')
  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Týmy ({teams.length})
        </p>
        <div className="space-y-1.5">
          {teams.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">
              Zatím žádné týmy. Přidej alespoň 2.
            </p>
          ) : (
            teams
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                >
                  <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-gray-900">{t.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(t.id)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Odebrat"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Název týmu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAdd(name)
                setName('')
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onAdd(name)
              setName('')
            }}
            disabled={!name.trim()}
            className="h-9 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Přidat
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FieldsPanel({
  fields,
  onAdd,
  onChange,
  onRemove,
}: {
  fields: string[]
  onAdd: () => void
  onChange: (idx: number, name: string) => void
  onRemove: (idx: number) => void
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Hřiště ({fields.length})
        </p>
        <p className="mb-2 text-xs text-gray-500">
          Zápasy v jednom kole se rozdělí na hřiště rotačně.
        </p>
        <div className="space-y-1.5">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={f}
                onChange={(e) => onChange(i, e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-sky-500 focus:outline-none"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-2" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Přidat hřiště
        </Button>
      </CardContent>
    </Card>
  )
}

function FormatPanel({
  format,
  onChangeFormat,
}: {
  format: string
  onChangeFormat: (f: string) => void
}) {
  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Formát</p>
        <div className="space-y-1.5 text-sm">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              checked={format === 'round-robin'}
              onChange={() => onChangeFormat('round-robin')}
              className="mt-0.5 h-4 w-4 text-sky-500 focus:ring-sky-500"
            />
            <span>
              <span className="font-medium text-gray-700">Skupina</span>
              <span className="block text-xs text-gray-500">Každý s každým — jeden cyklus.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              checked={format === 'round-robin-playoff'}
              onChange={() => onChangeFormat('round-robin-playoff')}
              className="mt-0.5 h-4 w-4 text-sky-500 focus:ring-sky-500"
            />
            <span>
              <span className="font-medium text-gray-700">Skupina + playoff</span>
              <span className="block text-xs text-gray-500">
                Po skupině top 4 → SF, 3. místo a finále.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              checked={format === 'round-robin-endless'}
              onChange={() => onChangeFormat('round-robin-endless')}
              className="mt-0.5 h-4 w-4 text-sky-500 focus:ring-sky-500"
            />
            <span>
              <span className="font-medium text-gray-700">Skupina (nekonečně)</span>
              <span className="block text-xs text-gray-500">
                Hraje se po jednom kole; další kola přidáváš ručně, dokud nechceš skončit.
              </span>
            </span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

function TasksPanel({
  tasks,
  onAdd,
  onRemove,
}: {
  tasks: TournamentSpecialTaskDto[]
  onAdd: (name: string, bonus: number) => void
  onRemove: (id: number) => void
}) {
  const [name, setName] = useState('')
  const [bonus, setBonus] = useState<number>(2)
  const max = 3
  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Speciální úkoly ({tasks.length}/{max})
        </p>
        <p className="mb-2 text-xs text-gray-500">
          Tým, který úkol v zápase splní, dostane bonusové body do tabulky. Úkoly zaznamenáš v
          každém zápase.
        </p>
        <div className="space-y-1.5">
          {tasks.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">
              Žádné úkoly. Přidej max. 3.
            </p>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              >
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span className="flex-1 truncate text-gray-900">{t.name}</span>
                <Badge variant="info">+{t.bonusPoints}</Badge>
                <button
                  type="button"
                  onClick={() => onRemove(t.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        {tasks.length < max && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Název úkolu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAdd(name, bonus)
                  setName('')
                }
              }}
            />
            <input
              type="number"
              min={1}
              max={10}
              value={bonus}
              onChange={(e) => setBonus(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="h-9 w-16 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none"
              title="Bodový bonus"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onAdd(name, bonus)
                setName('')
              }}
              disabled={!name.trim()}
              className="h-9 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StandingsPanel({
  standings,
  teamById,
}: {
  standings: Standing[]
  teamById: Map<number, TournamentTeamDto>
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Průběžné pořadí
          </p>
          <p className="text-[11px] text-gray-400">
            Z = zápasy · V/R/P · GF/GA · ÚK = bonus za splněné úkoly
          </p>
        </div>
        {standings.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">
            Přidej týmy a zadej výsledky pro výpočet pořadí.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Tým</th>
                  <th className="py-2 px-2 text-center">Z</th>
                  <th className="py-2 px-2 text-center">V</th>
                  <th className="py-2 px-2 text-center">R</th>
                  <th className="py-2 px-2 text-center">P</th>
                  <th className="py-2 px-2 text-center">GF</th>
                  <th className="py-2 px-2 text-center">GA</th>
                  <th className="py-2 px-2 text-center">+/−</th>
                  <th className="py-2 px-2 text-center">ÚK</th>
                  <th className="py-2 pl-2 text-right">Body</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => {
                  const team = teamById.get(s.teamId)
                  if (!team) return null
                  const isTop4 = idx < 4 && s.played > 0
                  return (
                    <tr
                      key={s.teamId}
                      className={`border-b border-gray-50 last:border-0 ${isTop4 ? 'bg-sky-50/30' : ''}`}
                    >
                      <td className="py-2 pr-2 font-medium text-gray-700">{idx + 1}</td>
                      <td className="py-2 pr-2 font-medium text-gray-900">{team.name}</td>
                      <td className="py-2 px-2 text-center text-gray-500">{s.played}</td>
                      <td className="py-2 px-2 text-center text-green-600">{s.wins}</td>
                      <td className="py-2 px-2 text-center text-amber-600">{s.draws}</td>
                      <td className="py-2 px-2 text-center text-red-500">{s.losses}</td>
                      <td className="py-2 px-2 text-center">{s.goalsFor}</td>
                      <td className="py-2 px-2 text-center">{s.goalsAgainst}</td>
                      <td className="py-2 px-2 text-center font-medium">
                        {s.goalsFor - s.goalsAgainst}
                      </td>
                      <td className="py-2 px-2 text-center text-amber-600">{s.taskBonus}</td>
                      <td className="py-2 pl-2 text-right font-bold text-gray-900">
                        {s.totalPoints}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ScheduleAndMatchesPanel({
  tournament,
  teamById,
  isEndless,
  rrComplete,
  hasPlayoff,
  onAddNextRound,
  onStartPlayoff,
  onUpdateMatch,
  onResetMatch,
}: {
  tournament: TournamentDto
  teamById: Map<number, TournamentTeamDto>
  isEndless: boolean
  rrComplete: boolean
  hasPlayoff: boolean
  onAddNextRound: () => void
  onStartPlayoff: () => void
  onUpdateMatch: (id: number, patch: Partial<TournamentMatchDto>) => void
  onResetMatch: (id: number) => void
}) {
  const isPlayoffFormat = tournament.format === 'round-robin-playoff'

  const rrGrouped = useMemo(() => {
    const byRound = new Map<number, TournamentMatchDto[]>()
    for (const m of tournament.matches) {
      if (m.stage !== 'rr') continue
      if (!byRound.has(m.round)) byRound.set(m.round, [])
      byRound.get(m.round)!.push(m)
    }
    return Array.from(byRound.entries()).sort((a, b) => a[0] - b[0])
  }, [tournament.matches])

  const playoffMatches = useMemo(
    () => tournament.matches.filter((m) => m.stage !== 'rr'),
    [tournament.matches]
  )
  const sfMatches = playoffMatches.filter((m) => m.stage === 'sf')
  const thirdPlace = playoffMatches.find((m) => m.stage === '3p')
  const finalMatch = playoffMatches.find((m) => m.stage === 'f')

  if (tournament.matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-gray-500">
          Rozlosování zatím není vygenerováno. Přidej týmy a klikni na{' '}
          <strong>„Vygenerovat rozlosování"</strong>.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Rozlosování a zápasy
        </p>

        {/* Round-robin section */}
        <div className="space-y-5">
          {rrGrouped.map(([round, matches]) => (
            <div key={round}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  {STAGE_LABEL.rr} — Kolo {round}
                </h3>
              </div>
              <div className="space-y-2">
                {matches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    teamById={teamById}
                    tasks={tournament.specialTasks}
                    onUpdate={(patch) => onUpdateMatch(m.id, patch)}
                    onReset={() => onResetMatch(m.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Endless: add next round */}
        {isEndless && rrGrouped.length > 0 && (
          <div className="mt-5 flex justify-center">
            <Button variant="outline" onClick={onAddNextRound}>
              <Plus className="h-4 w-4" /> Přidat další kolo
            </Button>
          </div>
        )}

        {/* Playoff section */}
        {isPlayoffFormat && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-sky-700">Playoff</h2>
              <div className="h-px flex-1 bg-sky-200" />
            </div>

            {!hasPlayoff && (
              <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50/50 p-4">
                <div className="mb-2 flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sky-900">
                      Po dohrání skupiny se vygenerují tyto zápasy:
                    </p>
                    <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs text-sky-800">
                      <li>
                        <strong>Semifinále 1</strong>: 1. místo skupiny vs. 4. místo
                      </li>
                      <li>
                        <strong>Semifinále 2</strong>: 2. místo vs. 3. místo
                      </li>
                      <li>
                        <strong>O 3. místo</strong>: poražení semifinálů
                      </li>
                      <li>
                        <strong>Finále</strong>: vítězové semifinálů
                      </li>
                    </ul>
                  </div>
                </div>
                <Button size="sm" onClick={onStartPlayoff} disabled={!rrComplete} className="mt-2">
                  <Trophy className="h-4 w-4" />
                  {rrComplete ? 'Spustit playoff' : 'Skupina ještě není dohraná'}
                </Button>
              </div>
            )}

            {hasPlayoff && (
              <div className="space-y-5 rounded-lg border-2 border-sky-300 bg-sky-50/30 p-4">
                {sfMatches.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-sky-800">{STAGE_LABEL.sf}</h3>
                    <div className="space-y-2">
                      {sfMatches.map((m) => (
                        <MatchRow
                          key={m.id}
                          match={m}
                          teamById={teamById}
                          tasks={tournament.specialTasks}
                          highlight="sky"
                          onUpdate={(patch) => onUpdateMatch(m.id, patch)}
                          onReset={() => onResetMatch(m.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {thirdPlace && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-amber-700">
                      {STAGE_LABEL['3p']}
                    </h3>
                    <MatchRow
                      match={thirdPlace}
                      teamById={teamById}
                      tasks={tournament.specialTasks}
                      highlight="amber"
                      onUpdate={(patch) => onUpdateMatch(thirdPlace.id, patch)}
                      onReset={() => onResetMatch(thirdPlace.id)}
                    />
                  </div>
                )}
                {finalMatch && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-violet-800">{STAGE_LABEL.f}</h3>
                    <MatchRow
                      match={finalMatch}
                      teamById={teamById}
                      tasks={tournament.specialTasks}
                      highlight="violet"
                      onUpdate={(patch) => onUpdateMatch(finalMatch.id, patch)}
                      onReset={() => onResetMatch(finalMatch.id)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MatchRow({
  match,
  teamById,
  tasks,
  highlight,
  onUpdate,
  onReset,
}: {
  match: TournamentMatchDto
  teamById: Map<number, TournamentTeamDto>
  tasks: TournamentSpecialTaskDto[]
  highlight?: 'sky' | 'amber' | 'violet'
  onUpdate: (patch: Partial<TournamentMatchDto>) => void
  onReset: () => void
}) {
  const home = match.homeTeamId ? teamById.get(match.homeTeamId) : null
  const away = match.awayTeamId ? teamById.get(match.awayTeamId) : null
  const isBye = !home || !away
  const isPending = !isBye && !match.played

  if (isBye) {
    const restingTeam = home ?? away
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-3 py-2 text-xs text-gray-500">
        <span className="font-medium text-gray-600">Odpočinek:</span>{' '}
        {restingTeam ? restingTeam.name : '—'}
      </div>
    )
  }

  const borderColor =
    highlight === 'sky'
      ? 'border-sky-200'
      : highlight === 'amber'
        ? 'border-amber-200'
        : highlight === 'violet'
          ? 'border-violet-200'
          : 'border-gray-200'

  return (
    <div className={`rounded-lg border bg-white p-3 ${borderColor}`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1">
          {match.field && <Badge variant="default">{match.field}</Badge>}
          {isPending && <span className="text-amber-600">nezapsáno</span>}
          {match.played && <span className="text-green-600">zaznamenáno</span>}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="text-right">
          <p className="font-medium text-gray-900">{home!.name}</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">domácí</p>
        </div>
        <div className="flex items-center gap-1">
          <ScoreInput
            value={match.homeGoals}
            onChange={(v) => onUpdate({ homeGoals: v, played: true })}
          />
          <span className="text-gray-400">:</span>
          <ScoreInput
            value={match.awayGoals}
            onChange={(v) => onUpdate({ awayGoals: v, played: true })}
          />
        </div>
        <div>
          <p className="font-medium text-gray-900">{away!.name}</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">hosté</p>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
          <div>
            <p className="mb-1.5 font-medium text-gray-600">Splněné úkoly — domácí</p>
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <TaskCounter
                  key={task.id}
                  task={task}
                  count={countOccurrences(match.homeTaskIds, task.id)}
                  onInc={() =>
                    onUpdate({ homeTaskIds: [...match.homeTaskIds, task.id], played: true })
                  }
                  onDec={() =>
                    onUpdate({ homeTaskIds: removeOnce(match.homeTaskIds, task.id), played: true })
                  }
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-medium text-gray-600">Splněné úkoly — hosté</p>
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <TaskCounter
                  key={task.id}
                  task={task}
                  count={countOccurrences(match.awayTaskIds, task.id)}
                  onInc={() =>
                    onUpdate({ awayTaskIds: [...match.awayTaskIds, task.id], played: true })
                  }
                  onDec={() =>
                    onUpdate({ awayTaskIds: removeOnce(match.awayTaskIds, task.id), played: true })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-1">
        <TournamentMatchStatsButton tournamentMatchId={match.id} />
        {match.played && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded p-1 text-[11px] text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-3 w-3" /> Resetovat zápas
          </button>
        )}
      </div>
    </div>
  )
}

function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className="h-9 w-12 rounded-lg border border-gray-300 bg-white text-center text-base font-semibold text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
    />
  )
}

function countOccurrences(ids: number[], id: number): number {
  let n = 0
  for (const x of ids) if (x === id) n++
  return n
}

function removeOnce(ids: number[], id: number): number[] {
  const i = ids.indexOf(id)
  if (i < 0) return ids
  return [...ids.slice(0, i), ...ids.slice(i + 1)]
}

function TaskCounter({
  task,
  count,
  onInc,
  onDec,
}: {
  task: TournamentSpecialTaskDto
  count: number
  onInc: () => void
  onDec: () => void
}) {
  const active = count > 0
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
        active ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
      }`}
      title={`+${task.bonusPoints} bod/ů za každé splnění`}
    >
      <Star
        className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-amber-500' : 'text-gray-400'}`}
      />
      <span
        className={`flex-1 truncate text-xs ${active ? 'font-medium text-amber-800' : 'text-gray-600'}`}
      >
        {task.name}
      </span>
      <span className="text-[10px] text-gray-400">+{task.bonusPoints}</span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onDec}
          disabled={count === 0}
          className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          aria-label="Odebrat splnění"
        >
          −
        </button>
        <span
          className={`min-w-[1.25rem] text-center text-sm font-bold ${active ? 'text-amber-700' : 'text-gray-400'}`}
        >
          {count}
        </span>
        <button
          type="button"
          onClick={onInc}
          className="inline-flex h-6 w-6 items-center justify-center rounded border border-amber-300 bg-amber-100 text-sm font-bold text-amber-700 hover:bg-amber-200"
          aria-label="Přidat splnění"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ── Help modal ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2 text-sm text-gray-700">{children}</div>
    </section>
  )
}

function Tag({
  children,
  color = 'gray',
}: {
  children: React.ReactNode
  color?: 'gray' | 'sky' | 'violet' | 'amber' | 'emerald' | 'red' | 'green'
}) {
  const palette = {
    gray: 'bg-gray-100 text-gray-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${palette[color]}`}
    >
      {children}
    </span>
  )
}

function TournamentHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Nápověda — turnaj" maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          Stránka <strong>Turnaj</strong> ti pomůže rozlosovat zápasy, zaznamenávat výsledky a
          sledovat průběžné pořadí. Turnaje se ukládají do databáze, můžeš se k nim vrátit a zpětně
          je upravovat.
        </p>

        <Section title="1. Týmy">
          <ul className="ml-4 list-disc space-y-1">
            <li>Přidej alespoň 2 týmy. Pořadí přidání nemá vliv — losování se vygeneruje samo.</li>
            <li>
              Při lichém počtu týmů jeden tým v každém kole <em>odpočívá</em> (bye).
            </li>
          </ul>
        </Section>

        <Section title="2. Hřiště">
          <p>
            Zadej tolik hřišť, kolik máš k dispozici. Zápasy v jednom kole se rozdělí rotačně mezi
            všechna hřiště.
          </p>
        </Section>

        <Section title="3. Formát">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <Tag color="sky">Skupina</Tag> — každý s každým, jeden cyklus.
            </li>
            <li>
              <Tag color="sky">Skupina + playoff</Tag> — po základní části postupují{' '}
              <strong>top 4</strong> do playoff: SF (1.–4. a 2.–3.), zápas o 3. místo a finále.
            </li>
            <li>
              <Tag color="sky">Skupina (nekonečně)</Tag> — vygeneruje se 1 kolo, další kola přidáváš
              ručně tlačítkem <Tag>Přidat další kolo</Tag>. Pořadí je kumulativní napříč všemi koly.
              Hodí se na otevřené turnaje, kde nevíš dopředu, kolik zápasů odehrajete.
            </li>
          </ul>
        </Section>

        <Section title="4. Speciální úkoly (max 3)">
          <p>
            Vymysli si až tři úkoly s bodovým bonusem (např. „nepustit gól", „aspoň 5 nahrávek za
            sebou", „gól z brankáře"). U každého zápasu pak <strong>odškrtneš</strong>, který tým
            úkol splnil — body se přičtou do tabulky (sloupec <Tag color="amber">ÚK</Tag>).
          </p>
          <p className="text-xs text-gray-500">
            Úkoly přidáš v panelu nastavení. Zaznamenat splnění lze v každém zápase tlačítky se
            hvězdičkou pod skóre.
          </p>
        </Section>

        <Section title="5. Rozlosování">
          <p>
            Klikni na <Tag color="sky">Vygenerovat rozlosování</Tag>. Použije se{' '}
            <em>kruhová metoda</em>: v každém kole hraje každý jeden zápas (nebo si odpočine),
            strany (domácí/hosté) se průběžně rotují.
          </p>
          <p className="text-xs text-gray-500">
            Po vygenerování se panel nastavení skryje. Zpět ho otevřeš tlačítkem{' '}
            <Tag>Upravit nastavení</Tag>. Pozor: nové vygenerování smaže zaznamenané výsledky.
          </p>
        </Section>

        <Section title="6. Zaznamenávání zápasů">
          <ul className="ml-4 list-disc space-y-1">
            <li>U každého zápasu vyplň skóre (góly).</li>
            <li>
              Odškrtni splněné úkoly tlačítky <Star className="inline h-3 w-3 text-amber-500" />.
            </li>
            <li>
              Zápas se automaticky označí jako zaznamenaný; pořadí v tabulce nahoře se okamžitě
              přepočítá.
            </li>
            <li>
              <Tag color="red">Resetovat zápas</Tag> vrátí výsledek na 0:0 a znovu označí jako
              nezapsaný.
            </li>
          </ul>
        </Section>

        <Section title="7. Playoff">
          <p>
            Při formátu <em>Skupina + playoff</em> se pod skupinovými zápasy zobrazí sekce{' '}
            <Tag color="sky">PLAYOFF</Tag>s placeholderem ukazujícím, jaké zápasy se vygenerují.
          </p>
          <p>
            Až všechny zápasy ve skupině mají vyplněné výsledky, klikni na{' '}
            <Tag color="sky">Spustit playoff</Tag>. Vytvoří se semifinále (1. vs 4. a 2. vs 3.),
            zápas o 3. místo a finále. Vítězové/poražení semifinále se do následujících zápasů
            doplní automaticky.
          </p>
        </Section>

        <Section title="8. Pořadí — jak se počítá">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Body</strong> = výhra 3 + remíza 1 + prohra 0 + bonusy z úkolů.
            </li>
            <li>
              <strong>GF/GA</strong> = vstřelené/obdržené góly.
            </li>
            <li>Při shodě bodů rozhoduje rozdíl skóre, pak vstřelené góly.</li>
            <li>
              Pořadí počítá <strong>jen zápasy ve skupině</strong>, ne playoff.
            </li>
          </ul>
        </Section>

        <Section title="Ukládání a editace">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Změny se ukládají na server tlačítkem <Tag color="sky">Uložit</Tag> (nebo{' '}
              <Tag color="sky">Vytvořit</Tag> u nového turnaje).
            </li>
            <li>Z přehledu turnajů se k libovolnému turnaji můžeš vrátit a upravit ho.</li>
            <li>Smazání turnaje provedeš v přehledu turnajů (ikona koše).</li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
