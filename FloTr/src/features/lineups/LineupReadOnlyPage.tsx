import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { lineupsApi } from '../../api/index'
import type { FormationTemplateDto, LineupFormationDto, LineupRosterDto, MatchLineupDto, SlotPosition } from '../../types/domain.types'
import { SLOT_POSITION_LABELS, SLOT_POSITION_NAMES } from '../../types/domain.types'
import { colorClasses, rosterShortName, rosterDisplayName } from './lineupUtils'

function getRoster(lineup: MatchLineupDto, id: number | null | undefined): LineupRosterDto | undefined {
  if (!id) return undefined
  return lineup.roster.find((r) => r.id === id)
}

function templateSlot(t: FormationTemplateDto | undefined | null, position: SlotPosition, idx: number) {
  if (!t) return { x: 50, y: 50 }
  const matches = t.slots.filter((s) => s.position === position).sort((a, b) => a.sortOrder - b.sortOrder)
  return matches[idx % matches.length] ?? { x: 50, y: 50 }
}

function FieldBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-emerald-700/30 bg-gradient-to-b from-emerald-50/60 via-emerald-50/40 to-emerald-50/60">
      <div className="absolute left-2 right-2 top-1/2 h-px bg-emerald-700/40" />
      <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-700/40" />
      <div className="absolute left-1/2 top-1 h-10 w-24 -translate-x-1/2 rounded-b-md border-2 border-t-0 border-emerald-700/40" />
      <div className="absolute left-1/2 top-1 h-2 w-10 -translate-x-1/2 rounded-b-sm bg-red-500/70" />
      <div className="absolute bottom-1 left-1/2 h-10 w-24 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-emerald-700/40" />
      <div className="absolute bottom-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-t-sm bg-red-500/70" />
    </div>
  )
}

function FormationView({ formation, lineup }: { formation: LineupFormationDto; lineup: MatchLineupDto }) {
  const c = colorClasses(formation.colorKey)
  const tpl = lineup.formationTemplate
  return (
    <div>
      <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${c.text}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
        Formace {formation.index}{formation.label ? ` · ${formation.label}` : ''}
      </div>
      <div className="relative aspect-[3/4] w-full max-w-xs">
        <FieldBackground />
        {formation.slots.map((slot, idx) => {
          const ts = templateSlot(tpl, slot.position, idx)
          const x = ts.x
          const y = 100 - ts.y
          const roster = getRoster(lineup, slot.rosterId)
          return (
            <div
              key={slot.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex min-w-[3rem] max-w-[6rem] items-center justify-center rounded-full border-2 px-2 py-1 text-[11px] font-semibold shadow-sm ${
                roster ? `${c.bg} border-white text-white` : `${c.bgSoft} ${c.border} border-dashed ${c.text}`
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={roster ? `${SLOT_POSITION_NAMES[slot.position]} – ${rosterShortName(roster)}` : SLOT_POSITION_NAMES[slot.position]}
            >
              <span className="truncate">{roster ? rosterShortName(roster) : SLOT_POSITION_LABELS[slot.position]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LineupReadOnlyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: lineup, isLoading } = useQuery({
    queryKey: ['lineup', Number(id)],
    queryFn: () => lineupsApi.getById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) return <LoadingSpinner />
  if (!lineup) return <p className="text-center text-gray-500 mt-12">Sestava nenalezena.</p>

  const formations = lineup.formations.slice().sort((a, b) => a.index - b.index)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{lineup.name}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            {lineup.teamName && <span>{lineup.teamName}</span>}
            {lineup.appointmentName && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {lineup.appointmentName}
                {lineup.appointmentStart && ` (${format(parseISO(lineup.appointmentStart), 'd.M.yyyy')})`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> Sdíleno
            </span>
          </div>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Soupiska zápasu ({lineup.roster.filter((r) => r.isAvailable).length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lineup.roster.filter((r) => r.isAvailable).sort((a, b) => a.sortOrder - b.sortOrder).map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700"
              >
                {rosterDisplayName(r)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {formations.map((f) => (
          <Card key={f.index}>
            <CardContent className="py-4">
              <FormationView formation={f} lineup={lineup} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
