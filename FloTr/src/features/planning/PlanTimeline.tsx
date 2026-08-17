import { useMemo, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { dfLocale } from '../../utils/dateLocale'
import { cn } from '../../utils/cn'
import type { MesocycleDto, MicrocycleDto } from '../../types/domain.types'
import { daySpan, dayIndex, phaseBlockClass, typeBlockClass, monthSegments } from './planningUtils'

interface PlanTimelineProps {
  rangeStart: Date
  rangeEnd: Date
  mesocycles: MesocycleDto[]
  selectedMesocycleId: number | null
  selectedMicrocycleId: number | null
  onSelectMesocycle: (m: MesocycleDto) => void
  onSelectMicrocycle: (mc: MicrocycleDto, meso: MesocycleDto) => void
  /** Coaches can drag blocks to move cycles and drag the right edge to resize them */
  editable?: boolean
  onMoveMesocycle?: (meso: MesocycleDto, dayDelta: number) => void
  onResizeMesocycle?: (meso: MesocycleDto, dayDelta: number) => void
  onMoveMicrocycle?: (micro: MicrocycleDto, dayDelta: number) => void
  onResizeMicrocycle?: (micro: MicrocycleDto, dayDelta: number) => void
}

type DragKind = 'meso' | 'micro'
type DragMode = 'move' | 'resize'

const encodeDragId = (kind: DragKind, mode: DragMode, cycleId: number) =>
  `${kind}:${mode}:${cycleId}`

/** Block draggable horizontally; snapping to whole days happens on drop. */
function DraggableBlock({
  kind,
  cycleId,
  disabled,
  className,
  gridStyle,
  title,
  onClick,
  children,
}: {
  kind: DragKind
  cycleId: number
  disabled: boolean
  className: string
  gridStyle: React.CSSProperties
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: encodeDragId(kind, 'move', cycleId),
    disabled,
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={onClick}
      title={title}
      className={cn(className, isDragging && 'z-20 opacity-75 ring-2 ring-sky-400')}
      style={{
        ...gridStyle,
        transform: transform ? `translateX(${transform.x}px)` : undefined,
        touchAction: 'none',
      }}
    >
      {children}
    </button>
  )
}

/** Right-edge resize handle; stops propagation so it does not start a block move. */
function ResizeHandle({
  kind,
  cycleId,
  disabled,
}: {
  kind: DragKind
  cycleId: number
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: encodeDragId(kind, 'resize', cycleId),
    disabled,
  })
  if (disabled) return null

  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        e.stopPropagation()
        listeners?.onPointerDown?.(e)
      }}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'ml-auto h-4/5 w-1.5 flex-shrink-0 cursor-ew-resize rounded-sm bg-black/10 hover:bg-black/25',
        isDragging && 'bg-sky-500'
      )}
      style={{
        transform: transform ? `translateX(${transform.x}px)` : undefined,
        touchAction: 'none',
      }}
    />
  )
}

/**
 * Proportional horizontal timeline of the season plan: a months header row,
 * a mesocycle band (colored by phase) and a microcycle band (colored by type),
 * plus a "today" marker. One CSS grid column per day. For coaches, blocks are
 * draggable (move) and have a right-edge handle (resize); the pixel delta is
 * snapped to whole days on drop.
 */
export function PlanTimeline({
  rangeStart,
  rangeEnd,
  mesocycles,
  selectedMesocycleId,
  selectedMicrocycleId,
  onSelectMesocycle,
  onSelectMicrocycle,
  editable = false,
  onMoveMesocycle,
  onResizeMesocycle,
  onMoveMicrocycle,
  onResizeMicrocycle,
}: PlanTimelineProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  // A finished drag also fires a click on the block; swallow that one selection
  const suppressClick = useRef(false)

  const totalDays = Math.max(differenceInCalendarDays(rangeEnd, rangeStart) + 1, 1)
  const months = useMemo(() => monthSegments(rangeStart, totalDays), [rangeStart, totalDays])

  const todayIndex = differenceInCalendarDays(new Date(), rangeStart)
  const todayVisible = todayIndex >= 0 && todayIndex < totalDays

  const gridStyle = { gridTemplateColumns: `repeat(${totalDays}, minmax(0, 1fr))` }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    suppressClick.current = true
    setTimeout(() => {
      suppressClick.current = false
    }, 0)

    const width = containerRef.current?.clientWidth ?? 0
    if (!width) return
    const dayWidth = width / totalDays
    const dayDelta = Math.round(event.delta.x / dayWidth)
    if (!dayDelta) return

    const [kind, mode, idStr] = String(event.active.id).split(':')
    const cycleId = Number(idStr)

    if (kind === 'meso') {
      const meso = mesocycles.find((m) => m.id === cycleId)
      if (!meso) return
      if (mode === 'move') onMoveMesocycle?.(meso, dayDelta)
      else onResizeMesocycle?.(meso, dayDelta)
      return
    }

    for (const meso of mesocycles) {
      const micro = meso.microcycles.find((mc) => mc.id === cycleId)
      if (micro) {
        if (mode === 'move') onMoveMicrocycle?.(micro, dayDelta)
        else onResizeMicrocycle?.(micro, dayDelta)
        return
      }
    }
  }

  const select = (fn: () => void) => () => {
    if (suppressClick.current) return
    fn()
  }

  /** Clamp a cycle to the visible range and return grid column bounds (1-based) */
  const columnsFor = (startDate: string, endDate: string) => {
    const start = Math.max(dayIndex(startDate, rangeStart), 0)
    const end = Math.min(dayIndex(endDate, rangeStart), totalDays - 1)
    if (end < 0 || start > totalDays - 1) return null
    return { gridColumnStart: start + 1, gridColumnEnd: end + 2 }
  }

  const cycleTitle = (name: string, startDate: string, endDate: string) =>
    `${name} · ${format(parseISO(startDate), 'd.M.', { locale: dfLocale() })}–${format(
      parseISO(endDate),
      'd.M.yyyy',
      { locale: dfLocale() }
    )} (${daySpan(startDate, endDate)} d)`

  return (
    <div className="overflow-x-auto">
      <div ref={containerRef} className="relative min-w-[840px]">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {/* Months header */}
          <div className="grid" style={gridStyle}>
            {months.map((m) => (
              <div
                key={m.startIndex}
                className="border-l border-gray-200 px-1 pb-1 text-[11px] font-medium text-gray-500"
                style={{ gridColumn: `${m.startIndex + 1} / ${m.startIndex + m.days + 1}` }}
              >
                {format(m.label, 'LLL yy', { locale: dfLocale() })}
              </div>
            ))}
          </div>

          {/* Mesocycle band */}
          <div className="grid h-12 rounded-md bg-gray-50" style={gridStyle}>
            {mesocycles.map((meso) => {
              const cols = columnsFor(meso.startDate, meso.endDate)
              if (!cols) return null
              return (
                <DraggableBlock
                  key={meso.id}
                  kind="meso"
                  cycleId={meso.id}
                  disabled={!editable}
                  onClick={select(() => onSelectMesocycle(meso))}
                  title={cycleTitle(meso.name, meso.startDate, meso.endDate)}
                  className={cn(
                    'm-0.5 flex items-center overflow-hidden rounded-md border-l-4 px-2 text-left text-xs font-medium transition-colors',
                    phaseBlockClass(meso.phase),
                    selectedMesocycleId === meso.id && 'ring-2 ring-sky-500',
                    editable && 'cursor-grab active:cursor-grabbing'
                  )}
                  gridStyle={cols}
                >
                  <span className="truncate">{meso.name}</span>
                  <ResizeHandle kind="meso" cycleId={meso.id} disabled={!editable} />
                </DraggableBlock>
              )
            })}
          </div>

          {/* Microcycle band */}
          <div className="mt-1 grid h-9 rounded-md bg-gray-50" style={gridStyle}>
            {mesocycles.flatMap((meso) =>
              meso.microcycles.map((mc) => {
                const cols = columnsFor(mc.startDate, mc.endDate)
                if (!cols) return null
                return (
                  <DraggableBlock
                    key={mc.id}
                    kind="micro"
                    cycleId={mc.id}
                    disabled={!editable}
                    onClick={select(() => onSelectMicrocycle(mc, meso))}
                    title={cycleTitle(mc.name, mc.startDate, mc.endDate)}
                    className={cn(
                      'm-0.5 flex items-center overflow-hidden rounded border px-1.5 text-left text-[11px] transition-colors',
                      typeBlockClass(mc.type),
                      selectedMicrocycleId === mc.id && 'ring-2 ring-sky-500',
                      editable && 'cursor-grab active:cursor-grabbing'
                    )}
                    gridStyle={cols}
                  >
                    <span className="truncate">{mc.name}</span>
                    <ResizeHandle kind="micro" cycleId={mc.id} disabled={!editable} />
                  </DraggableBlock>
                )
              })
            )}
          </div>
        </DndContext>

        {/* Band labels */}
        <div className="mt-1 flex gap-4 text-[10px] uppercase tracking-wide text-gray-400">
          <span>{t('planning.mesocycles')}</span>
          <span>{t('planning.microcycles')}</span>
          {editable && (
            <span className="normal-case tracking-normal">{t('planning.dragHint')}</span>
          )}
        </div>

        {/* Today marker */}
        {todayVisible && (
          <div
            className="pointer-events-none absolute bottom-5 top-5 z-10 w-0.5 bg-sky-600"
            style={{ left: `${((todayIndex + 0.5) / totalDays) * 100}%` }}
            title={t('planning.today')}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-sky-600 px-1 text-[9px] font-semibold text-white">
              {t('planning.today')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
