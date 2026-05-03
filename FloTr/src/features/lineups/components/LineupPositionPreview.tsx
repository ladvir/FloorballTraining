import type { LineupFormationDto, LineupRosterDto, LineupSlotDto, MatchLineupDto, SlotPosition } from '../../../types/domain.types'
import { SLOT_POSITION_LABELS, SLOT_POSITION_NAMES } from '../../../types/domain.types'
import { colorClasses, rosterDisplayName } from '../lineupUtils'

/** Column order: LW · C · RW · LD · RD · G */
const POSITION_COL_ORDER: SlotPosition[] = [4, 3, 5, 2, 1, 0]

function getRoster(lineup: MatchLineupDto, id: number | null | undefined): LineupRosterDto | undefined {
  if (!id) return undefined
  return lineup.roster.find((r) => r.id === id)
}

function PreviewCell({
  formation,
  slot,
  roster,
}: {
  formation: LineupFormationDto
  slot: LineupSlotDto
  roster?: LineupRosterDto
}) {
  const c = colorClasses(formation.colorKey)
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border-2 px-2 py-1 text-xs ${
        roster
          ? `${c.bg} border-white text-white shadow-sm`
          : `${c.bgSoft} ${c.border} border-dashed ${c.text}`
      }`}
      title={roster ? rosterDisplayName(roster) : SLOT_POSITION_NAMES[slot.position]}
    >
      <span
        className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
          roster ? 'bg-white/20 text-white' : 'bg-white/60 text-gray-500'
        }`}
      >
        {SLOT_POSITION_LABELS[slot.position]}
      </span>
      <span className="truncate">{roster ? rosterDisplayName(roster) : 'volný'}</span>
    </div>
  )
}

function PreviewRow({
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
                <PreviewCell
                  key={s.id}
                  formation={formation}
                  slot={s}
                  roster={getRoster(lineup, s.rosterId)}
                />
              ))
            )}
          </div>
        )
      })}
    </>
  )
}

export function LineupPositionPreview({ lineup }: { lineup: MatchLineupDto }) {
  const formations = lineup.formations.slice().sort((a, b) => a.index - b.index)
  const positionsPresent = new Set<SlotPosition>()
  for (const f of formations) for (const s of f.slots) positionsPresent.add(s.position)
  const cols = POSITION_COL_ORDER.filter((p) => positionsPresent.has(p))

  if (formations.length === 0) {
    return <p className="text-sm text-gray-500">Sestava nemá žádné formace.</p>
  }
  if (cols.length === 0) {
    return <p className="text-sm text-gray-500">Žádné pozice k zobrazení.</p>
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `auto repeat(${cols.length}, minmax(7rem, 1fr))` }}
        >
          <div />
          {cols.map((pos) => (
            <div
              key={pos}
              className="flex items-center justify-center rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600"
            >
              {SLOT_POSITION_NAMES[pos]}
            </div>
          ))}
          {formations.map((f) => (
            <PreviewRow key={f.index} formation={f} positions={cols} lineup={lineup} />
          ))}
        </div>
      </div>
    </div>
  )
}
