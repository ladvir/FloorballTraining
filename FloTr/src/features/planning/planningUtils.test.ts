import { describe, it, expect } from 'vitest'
import {
  daySpan,
  dayIndex,
  rangesOverlap,
  findOverlap,
  isOutsideRange,
  suggestNextStart,
  monthSegments,
  phaseBlockClass,
  typeBlockClass,
} from './planningUtils'

describe('daySpan', () => {
  it('is inclusive on both ends', () => {
    expect(daySpan('2026-07-01', '2026-07-07')).toBe(7)
    expect(daySpan('2026-07-01', '2026-07-01')).toBe(1)
  })

  it('spans month boundaries', () => {
    expect(daySpan('2026-07-28', '2026-08-03')).toBe(7)
  })
})

describe('dayIndex', () => {
  it('returns zero-based offset from range start', () => {
    expect(dayIndex('2026-07-01', new Date(2026, 6, 1))).toBe(0)
    expect(dayIndex('2026-07-15', new Date(2026, 6, 1))).toBe(14)
  })
})

describe('rangesOverlap / findOverlap', () => {
  const a = { id: 1, startDate: '2026-07-01', endDate: '2026-07-28' }
  const b = { id: 2, startDate: '2026-08-01', endDate: '2026-08-31' }

  it('detects inclusive touch as overlap', () => {
    expect(
      rangesOverlap(
        { startDate: '2026-07-28', endDate: '2026-08-05' },
        { startDate: '2026-07-01', endDate: '2026-07-28' }
      )
    ).toBe(true)
  })

  it('does not report adjacent ranges', () => {
    expect(
      rangesOverlap(
        { startDate: '2026-07-29', endDate: '2026-07-31' },
        { startDate: '2026-07-01', endDate: '2026-07-28' }
      )
    ).toBe(false)
  })

  it('finds the overlapping sibling and honors excludeId', () => {
    const candidate = { startDate: '2026-07-20', endDate: '2026-08-05' }
    expect(findOverlap([a, b], candidate)?.id).toBe(1)
    expect(findOverlap([a, b], candidate, 1)?.id).toBe(2)
    expect(findOverlap([a], { startDate: '2026-09-01', endDate: '2026-09-30' })).toBeUndefined()
  })
})

describe('isOutsideRange', () => {
  it('is false without bounds', () => {
    expect(isOutsideRange({ startDate: '2026-07-01', endDate: '2026-07-28' }, null, null)).toBe(
      false
    )
  })

  it('flags cycles sticking out of the season', () => {
    const season = { start: '2026-08-01T00:00:00', end: '2027-06-30T00:00:00' }
    expect(
      isOutsideRange({ startDate: '2026-07-20', endDate: '2026-08-10' }, season.start, season.end)
    ).toBe(true)
    expect(
      isOutsideRange({ startDate: '2026-08-01', endDate: '2026-08-28' }, season.start, season.end)
    ).toBe(false)
  })
})

describe('suggestNextStart', () => {
  it('falls back to the given start when empty', () => {
    expect(suggestNextStart([], '2026-08-01T00:00:00')).toBe('2026-08-01')
  })

  it('returns the day after the latest end', () => {
    expect(
      suggestNextStart(
        [
          { startDate: '2026-07-01', endDate: '2026-07-28' },
          { startDate: '2026-08-01', endDate: '2026-08-31' },
        ],
        '2026-07-01'
      )
    ).toBe('2026-09-01')
  })
})

describe('monthSegments', () => {
  it('splits a range into month header segments', () => {
    // 20.7.2026 – 10.8.2026 = 22 days: 12 in July + 10 in August
    const segments = monthSegments(new Date(2026, 6, 20), 22)
    expect(segments).toHaveLength(2)
    expect(segments[0]).toMatchObject({ startIndex: 0, days: 12 })
    expect(segments[1]).toMatchObject({ startIndex: 12, days: 10 })
    expect(segments[1].label.getMonth()).toBe(7)
  })

  it('handles a range inside a single month', () => {
    const segments = monthSegments(new Date(2026, 6, 1), 10)
    expect(segments).toHaveLength(1)
    expect(segments[0].days).toBe(10)
  })
})

describe('color maps', () => {
  it('gives every phase and type a distinct class', () => {
    const phases = [0, 1, 2, 3, 4].map(phaseBlockClass)
    const types = [0, 1, 2, 3, 4].map(typeBlockClass)
    expect(new Set(phases).size).toBe(5)
    expect(new Set(types).size).toBe(5)
  })

  it('falls back for unknown values', () => {
    expect(phaseBlockClass(99)).toContain('bg-gray')
    expect(typeBlockClass(99)).toContain('bg-gray')
  })
})
