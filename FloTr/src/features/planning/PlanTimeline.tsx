import { useMemo } from 'react'
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
}

/**
 * Proportional horizontal timeline of the season plan: a months header row,
 * a mesocycle band (colored by phase) and a microcycle band (colored by type),
 * plus a "today" marker. One CSS grid column per day.
 */
export function PlanTimeline({
  rangeStart,
  rangeEnd,
  mesocycles,
  selectedMesocycleId,
  selectedMicrocycleId,
  onSelectMesocycle,
  onSelectMicrocycle,
}: PlanTimelineProps) {
  const { t } = useTranslation()

  const totalDays = Math.max(differenceInCalendarDays(rangeEnd, rangeStart) + 1, 1)
  const months = useMemo(() => monthSegments(rangeStart, totalDays), [rangeStart, totalDays])

  const todayIndex = differenceInCalendarDays(new Date(), rangeStart)
  const todayVisible = todayIndex >= 0 && todayIndex < totalDays

  const gridStyle = { gridTemplateColumns: `repeat(${totalDays}, minmax(0, 1fr))` }

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
      <div className="relative min-w-[840px]">
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
              <button
                key={meso.id}
                type="button"
                onClick={() => onSelectMesocycle(meso)}
                title={cycleTitle(meso.name, meso.startDate, meso.endDate)}
                className={cn(
                  'm-0.5 flex items-center overflow-hidden rounded-md border-l-4 px-2 text-left text-xs font-medium transition-colors',
                  phaseBlockClass(meso.phase),
                  selectedMesocycleId === meso.id && 'ring-2 ring-sky-500'
                )}
                style={cols}
              >
                <span className="truncate">{meso.name}</span>
              </button>
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
                <button
                  key={mc.id}
                  type="button"
                  onClick={() => onSelectMicrocycle(mc, meso)}
                  title={cycleTitle(mc.name, mc.startDate, mc.endDate)}
                  className={cn(
                    'm-0.5 flex items-center overflow-hidden rounded border px-1.5 text-left text-[11px] transition-colors',
                    typeBlockClass(mc.type),
                    selectedMicrocycleId === mc.id && 'ring-2 ring-sky-500'
                  )}
                  style={cols}
                >
                  <span className="truncate">{mc.name}</span>
                </button>
              )
            })
          )}
        </div>

        {/* Band labels */}
        <div className="mt-1 flex gap-4 text-[10px] uppercase tracking-wide text-gray-400">
          <span>{t('planning.mesocycles')}</span>
          <span>{t('planning.microcycles')}</span>
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
