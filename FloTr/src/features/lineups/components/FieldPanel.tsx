import type { Dispatch } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Card, CardContent } from '../../../components/ui/Card'
import type { FormationTemplateDto, LineupFormationDto, LineupRosterDto, LineupSlotDto, MatchLineupDto, SlotPosition } from '../../../types/domain.types'
import { SLOT_POSITION_LABELS, SLOT_POSITION_NAMES } from '../../../types/domain.types'
import { colorClasses, rosterShortName } from '../lineupUtils'

export type FieldView = 'single' | 'all' | 'positions'

interface Props {
  lineup: MatchLineupDto
  template?: FormationTemplateDto
  activeFormation: number
  setActiveFormation: (idx: number) => void
  view: FieldView
  setView: (v: FieldView) => void
  dispatch: Dispatch<{ type: string; [key: string]: unknown }>
}

interface SlotProps {
  slot: LineupSlotDto
  formation: LineupFormationDto
  templateSlot?: { x: number; y: number }
  roster?: LineupRosterDto
}

function FieldSlot({ slot, formation, templateSlot, roster }: SlotProps) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `slot-${formation.index}-${slot.id}`,
    data: { kind: 'slot', slotId: slot.id, formationIndex: formation.index },
  })
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `slot-drag-${formation.index}-${slot.id}`,
    data: { source: 'slot', slotId: slot.id, formationIndex: formation.index, rosterId: roster?.id ?? null },
    disabled: !roster,
  })

  const c = colorClasses(formation.colorKey)
  const x = templateSlot?.x ?? 50
  const y = 100 - (templateSlot?.y ?? 50)

  return (
    <div
      ref={setDroppableRef}
      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${isOver ? 'scale-110 z-10' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        ref={setDraggableRef}
        {...attributes}
        {...listeners}
        className={`group relative flex min-w-[3.5rem] max-w-[6.5rem] cursor-grab touch-none flex-col items-center justify-center rounded-full border-2 px-2 py-1 text-xs font-semibold shadow-sm transition ${
          roster
            ? `${c.bg} border-white text-white`
            : `${c.bgSoft} ${c.border} border-dashed ${c.text}`
        } ${isDragging ? 'opacity-30' : ''} ${isOver ? `ring-4 ring-offset-1 ${c.ring} ring-offset-white/60` : ''}`}
        title={roster ? `${SLOT_POSITION_NAMES[slot.position]} – ${rosterShortName(roster)}` : SLOT_POSITION_NAMES[slot.position]}
      >
        {roster ? (
          <span className="block max-w-full truncate text-[11px] leading-tight">
            {rosterShortName(roster)}
          </span>
        ) : (
          <span className="text-xs">{SLOT_POSITION_LABELS[slot.position]}</span>
        )}
        <span
          className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded-full px-1 text-[9px] font-bold ${
            roster ? 'bg-white text-gray-700 shadow-sm' : 'bg-transparent text-gray-400'
          }`}
        >
          {SLOT_POSITION_LABELS[slot.position]}
        </span>
      </div>
    </div>
  )
}

interface BenchProps {
  lineup: MatchLineupDto
  /** When given, bench excludes players already in this formation only (for single view).
   *  Otherwise bench excludes players in ANY formation. */
  formation?: LineupFormationDto
}

function Bench({ lineup, formation }: BenchProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'bench',
    data: { kind: 'bench' },
  })

  const onFieldRosterIds = new Set<number>()
  if (formation) {
    for (const s of formation.slots) if (s.rosterId) onFieldRosterIds.add(s.rosterId)
  } else {
    for (const f of lineup.formations) for (const s of f.slots) if (s.rosterId) onFieldRosterIds.add(s.rosterId)
  }
  const c = formation ? colorClasses(formation.colorKey) : colorClasses('blue')
  const benchPlayers = lineup.roster
    .filter((r) => r.isAvailable && !onFieldRosterIds.has(r.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const label = formation ? 'Náhradníci na lavičce' : 'Hráči mimo formace'

  return (
    <div
      ref={setNodeRef}
      className={`mt-3 rounded-lg border-2 border-dashed bg-gray-50/50 p-2 transition-colors ${
        isOver ? `${c.border} bg-white` : 'border-gray-200'
      }`}
    >
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label} ({benchPlayers.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {benchPlayers.length === 0 ? (
          <p className="px-1 text-xs text-gray-400">
            {formation ? 'Všichni dostupní hráči jsou na hřišti.' : 'Všichni dostupní hráči jsou nasazeni v některé formaci.'}
          </p>
        ) : (
          benchPlayers.map((r) => <BenchCard key={r.id} roster={r} />)
        )}
      </div>
    </div>
  )
}

function BenchCard({ roster }: { roster: LineupRosterDto }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bench-${roster.id}`,
    data: { source: 'bench', rosterId: roster.id },
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      className={`inline-flex cursor-grab touch-none items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      {rosterShortName(roster)}
    </button>
  )
}

function FieldSvg() {
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

function getRosterById(lineup: MatchLineupDto, id: number | null | undefined): LineupRosterDto | undefined {
  if (!id) return undefined
  return lineup.roster.find((r) => r.id === id)
}

function getTemplateSlot(template: FormationTemplateDto | undefined, position: SlotPosition, idx: number): { x: number; y: number } {
  if (!template) return { x: 50, y: 50 }
  const matches = template.slots.filter((s) => s.position === position).sort((a, b) => a.sortOrder - b.sortOrder)
  if (matches.length === 0) return { x: 50, y: 50 }
  return matches[idx % matches.length]
}

/** Column order: LW · C · RW · LD · RD · G */
const POSITION_COL_ORDER: SlotPosition[] = [4, 3, 5, 2, 1, 0]

function PositionGridView({ lineup }: { lineup: MatchLineupDto }) {
  const formations = lineup.formations.slice().sort((a, b) => a.index - b.index)
  // Collect distinct positions present in any formation, ordered by POSITION_COL_ORDER
  const positionsPresent = new Set<SlotPosition>()
  for (const f of formations) for (const s of f.slots) positionsPresent.add(s.position)
  const cols = POSITION_COL_ORDER.filter((p) => positionsPresent.has(p))

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `auto repeat(${cols.length}, minmax(7rem, 1fr))` }}
        >
          {/* header row: empty corner + position headers */}
          <div />
          {cols.map((pos) => (
            <div
              key={pos}
              className="flex items-center justify-center rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600"
            >
              {SLOT_POSITION_NAMES[pos]}
            </div>
          ))}

          {/* one row per formation */}
          {formations.map((f) => (
            <FormationRow key={f.index} formation={f} positions={cols} lineup={lineup} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FormationRow({
  formation,
  positions,
  lineup,
}: {
  formation: LineupFormationDto
  positions: SlotPosition[]
  lineup: MatchLineupDto
}) {
  const c = colorClasses(formation.colorKey)
  return (
    <>
      <div
        className={`flex items-center gap-1.5 rounded-md border ${c.border} ${c.bgSoft} px-2 py-1 text-xs font-semibold ${c.text}`}
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />
        Formace {formation.index}
        {formation.label ? ` · ${formation.label}` : ''}
      </div>
      {positions.map((pos) => {
        const slots = formation.slots.filter((s) => s.position === pos)
        return (
          <div key={pos} className="space-y-1">
            {slots.length === 0 ? (
              <div className="rounded border border-dashed border-gray-200 px-2 py-1.5 text-center text-[10px] text-gray-300">
                —
              </div>
            ) : (
              slots.map((s) => (
                <PositionGridCell
                  key={s.id}
                  formation={formation}
                  slot={s}
                  roster={getRosterById(lineup, s.rosterId)}
                />
              ))
            )}
          </div>
        )
      })}
    </>
  )
}

function PositionGridCell({ formation, slot, roster }: { formation: LineupFormationDto; slot: LineupSlotDto; roster?: LineupRosterDto }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `pgcell-${formation.index}-${slot.id}`,
    data: { kind: 'slot', slotId: slot.id, formationIndex: formation.index },
  })
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `pgcell-drag-${formation.index}-${slot.id}`,
    data: { source: 'slot', slotId: slot.id, formationIndex: formation.index, rosterId: roster?.id ?? null },
    disabled: !roster,
  })
  const c = colorClasses(formation.colorKey)
  return (
    <div ref={setDroppableRef}>
      <div
        ref={setDraggableRef}
        {...attributes}
        {...listeners}
        className={`flex cursor-grab touch-none items-center gap-1.5 rounded-md border-2 px-2 py-1 text-xs transition ${
          roster
            ? `${c.bg} border-white text-white shadow-sm`
            : `${c.bgSoft} ${c.border} border-dashed ${c.text}`
        } ${isDragging ? 'opacity-30' : ''} ${isOver ? `ring-2 ring-offset-1 ${c.ring}` : ''}`}
      >
        <span className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
          roster ? 'bg-white/20 text-white' : 'bg-white/60 text-gray-500'
        }`}>
          {SLOT_POSITION_LABELS[slot.position]}
        </span>
        <span className="truncate">{roster ? rosterShortName(roster) : 'volný'}</span>
      </div>
    </div>
  )
}

export function FieldPanel({ lineup, template, activeFormation, setActiveFormation, view, setView, dispatch }: Props) {
  const formations = lineup.formations.slice().sort((a, b) => a.index - b.index)
  const current = formations.find((f) => f.index === activeFormation) ?? formations[0]

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {formations.map((f) => {
            const c = colorClasses(f.colorKey)
            const isActive = view === 'single' && current?.index === f.index
            return (
              <button
                key={f.index}
                type="button"
                onClick={() => { setActiveFormation(f.index); setView('single') }}
                className={`group inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm font-medium transition-all ${
                  isActive ? `${c.border} ${c.bgSoft} ${c.text}` : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
                Formace {f.index}
                {f.label ? ` · ${f.label}` : ''}
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-1 rounded-full border border-gray-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setView('all')}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                view === 'all' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Hřiště vedle sebe
            </button>
            <button
              type="button"
              onClick={() => setView('positions')}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                view === 'positions' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Po pozicích
            </button>
          </div>
        </div>

        {view === 'all' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {formations.map((f) => (
                <MiniField key={f.index} formation={f} lineup={lineup} template={template} />
              ))}
            </div>
            <Bench lineup={lineup} />
          </>
        ) : view === 'positions' ? (
          <>
            <PositionGridView lineup={lineup} />
            <Bench lineup={lineup} />
          </>
        ) : current ? (
          <>
            <div className="relative aspect-[3/4] w-full max-w-md self-center">
              <FieldSvg />
              {current.slots.map((slot, idx) => {
                const tplSlot = getTemplateSlot(template, slot.position, idx)
                return (
                  <FieldSlot
                    key={slot.id}
                    slot={slot}
                    formation={current}
                    templateSlot={tplSlot}
                    roster={getRosterById(lineup, slot.rosterId)}
                  />
                )
              })}
            </div>
            <div className="mt-2 flex items-center gap-2 px-1">
              <input
                value={current.label ?? ''}
                onChange={(e) => dispatch({ type: 'setFormationLabel', formationIndex: current.index, label: e.target.value })}
                placeholder={`Popis formace ${current.index} (např. „útočná")`}
                className="h-7 flex-1 rounded border border-transparent bg-transparent px-2 text-xs text-gray-700 hover:border-gray-200 focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>
            <Bench lineup={lineup} formation={current} />
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function MiniField({ formation, lineup, template }: { formation: LineupFormationDto; lineup: MatchLineupDto; template?: FormationTemplateDto }) {
  const c = colorClasses(formation.colorKey)
  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
        Formace {formation.index}
        {formation.label ? ` · ${formation.label}` : ''}
      </div>
      <div className="relative aspect-[3/4] w-full">
        <FieldSvg />
        {formation.slots.map((slot, idx) => {
          const tplSlot = template ? (() => {
            const matches = template.slots.filter((s) => s.position === slot.position).sort((a, b) => a.sortOrder - b.sortOrder)
            return matches[idx % matches.length] ?? { x: 50, y: 50 }
          })() : { x: 50, y: 50 }
          return (
            <MiniSlot
              key={slot.id}
              slot={slot}
              formation={formation}
              roster={getRosterById(lineup, slot.rosterId)}
              x={tplSlot.x}
              y={100 - tplSlot.y}
            />
          )
        })}
      </div>
    </div>
  )
}

function MiniSlot({ slot, formation, roster, x, y }: {
  slot: LineupSlotDto
  formation: LineupFormationDto
  roster?: LineupRosterDto
  x: number
  y: number
}) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `mini-${formation.index}-${slot.id}`,
    data: { kind: 'slot', slotId: slot.id, formationIndex: formation.index },
  })
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `mini-drag-${formation.index}-${slot.id}`,
    data: { source: 'slot', slotId: slot.id, formationIndex: formation.index, rosterId: roster?.id ?? null },
    disabled: !roster,
  })
  const c = colorClasses(formation.colorKey)
  return (
    <div
      ref={setDroppableRef}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${isOver ? 'scale-110 z-10' : ''} transition-transform`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        ref={setDraggableRef}
        {...attributes}
        {...listeners}
        className={`flex min-w-[2.5rem] max-w-[5rem] cursor-grab touch-none items-center justify-center rounded-full border-2 px-1.5 py-0.5 text-[10px] font-semibold ${
          roster ? `${c.bg} border-white text-white` : `${c.bgSoft} ${c.border} border-dashed ${c.text}`
        } ${isDragging ? 'opacity-30' : ''} ${isOver ? `ring-2 ring-offset-1 ${c.ring}` : ''}`}
        title={roster ? rosterShortName(roster) : SLOT_POSITION_NAMES[slot.position]}
      >
        <span className="truncate">{roster ? rosterShortName(roster) : SLOT_POSITION_LABELS[slot.position]}</span>
      </div>
    </div>
  )
}
