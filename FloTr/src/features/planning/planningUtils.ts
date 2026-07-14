import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns'

// ── Colors ────────────────────────────────────────────────────────────────────
// Mesocycle phase: 0=Preparation 1=PreCompetition 2=Competition 3=Transition 4=Regeneration
// Microcycle type: 0=Development 1=Stabilization 2=Tapering 3=Regeneration 4=Competition

/** Timeline block classes for a mesocycle, by phase */
export function phaseBlockClass(phase: number): string {
  switch (phase) {
    case 0:
      return 'bg-orange-200 text-orange-900 border-orange-400 hover:bg-orange-300'
    case 1:
      return 'bg-amber-200 text-amber-900 border-amber-400 hover:bg-amber-300'
    case 2:
      return 'bg-rose-200 text-rose-900 border-rose-400 hover:bg-rose-300'
    case 3:
      return 'bg-slate-200 text-slate-800 border-slate-400 hover:bg-slate-300'
    case 4:
      return 'bg-lime-200 text-lime-900 border-lime-400 hover:bg-lime-300'
    default:
      return 'bg-gray-200 text-gray-800 border-gray-400 hover:bg-gray-300'
  }
}

/** Timeline block classes for a microcycle, by type */
export function typeBlockClass(type: number): string {
  switch (type) {
    case 0:
      return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'
    case 1:
      return 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200'
    case 2:
      return 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200'
    case 3:
      return 'bg-lime-100 text-lime-800 border-lime-300 hover:bg-lime-200'
    case 4:
      return 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
  }
}

/** Small legend swatch classes (no hover), by microcycle type */
export function typeSwatchClass(type: number): string {
  switch (type) {
    case 0:
      return 'bg-orange-100 border-orange-300'
    case 1:
      return 'bg-sky-100 border-sky-300'
    case 2:
      return 'bg-violet-100 border-violet-300'
    case 3:
      return 'bg-lime-100 border-lime-300'
    case 4:
      return 'bg-rose-100 border-rose-300'
    default:
      return 'bg-gray-100 border-gray-300'
  }
}

// ── Date range helpers (cycle dates are date-only ISO strings, inclusive) ─────

export interface DateRange {
  startDate: string
  endDate: string
}

/** Inclusive number of days of a cycle ('2026-07-01'..'2026-07-07' → 7) */
export function daySpan(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
}

/** Zero-based day index of `date` within a range starting at `rangeStart` */
export function dayIndex(date: string, rangeStart: Date): number {
  return differenceInCalendarDays(parseISO(date), rangeStart)
}

/** Inclusive date-range overlap */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate
}

/** First sibling overlapping the candidate (ignoring `excludeId`), or undefined */
export function findOverlap<T extends DateRange & { id: number }>(
  siblings: T[],
  candidate: DateRange,
  excludeId?: number
): T | undefined {
  return siblings.find((s) => s.id !== excludeId && rangesOverlap(s, candidate))
}

/** True when the cycle sticks out of the given bounds (bounds are optional) */
export function isOutsideRange(
  cycle: DateRange,
  boundsStart?: string | null,
  boundsEnd?: string | null
): boolean {
  if (!boundsStart || !boundsEnd) return false
  return cycle.startDate < boundsStart.slice(0, 10) || cycle.endDate > boundsEnd.slice(0, 10)
}

/**
 * Suggested start date for a new cycle: the day after the latest sibling end,
 * clamped to `fallbackStart` when there are no siblings.
 */
export function suggestNextStart(siblings: DateRange[], fallbackStart: string): string {
  if (!siblings.length) return fallbackStart.slice(0, 10)
  const maxEnd = siblings.reduce(
    (max, s) => (s.endDate > max ? s.endDate : max),
    siblings[0].endDate
  )
  return format(addDays(parseISO(maxEnd), 1), 'yyyy-MM-dd')
}

/** Month segments (for the timeline header) across a day range */
export function monthSegments(
  rangeStart: Date,
  totalDays: number
): { label: Date; startIndex: number; days: number }[] {
  const segments: { label: Date; startIndex: number; days: number }[] = []
  let i = 0
  while (i < totalDays) {
    const day = addDays(rangeStart, i)
    const monthEnd = new Date(day.getFullYear(), day.getMonth() + 1, 0)
    const remainingInMonth = differenceInCalendarDays(monthEnd, day) + 1
    const days = Math.min(remainingInMonth, totalDays - i)
    segments.push({ label: day, startIndex: i, days })
    i += days
  }
  return segments
}
