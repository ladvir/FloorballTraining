import { describe, it, expect } from 'vitest'
import { buildCoverageRows, deltaImproves, gradeColorClass } from './evaluationUtils'
import type { CycleEvaluationBlockDto, TestProgressionDto } from '../../types/domain.types'

const block = (over: Partial<CycleEvaluationBlockDto>): CycleEvaluationBlockDto => ({
  cycleId: 1,
  name: 'Blok',
  from: '2026-07-01',
  to: '2026-07-28',
  trainingAppointmentsCount: 0,
  withLinkedTrainingCount: 0,
  totalTrainingMinutes: 0,
  goalMatchedMinutes: 0,
  goalCoveragePercent: 0,
  perTag: [],
  presentCount: 0,
  absentCount: 0,
  excusedCount: 0,
  unknownCount: 0,
  attendanceRatePercent: 0,
  ratingsCount: 0,
  ...over,
})

describe('buildCoverageRows', () => {
  it('puts the total first and splits matched vs other minutes', () => {
    const rows = buildCoverageRows(
      block({ totalTrainingMinutes: 60, goalMatchedMinutes: 30, goalCoveragePercent: 50 }),
      [
        block({ name: 'Týden 1', totalTrainingMinutes: 40, goalMatchedMinutes: 25 }),
        block({ name: 'Týden 2' }),
      ],
      'Celkem'
    )
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ name: 'Celkem', matched: 30, other: 30, percent: 50 })
    expect(rows[1]).toMatchObject({ name: 'Týden 1', matched: 25, other: 15 })
    expect(rows[2]).toMatchObject({ name: 'Týden 2', matched: 0, other: 0 })
  })

  it('never returns negative "other" minutes', () => {
    const rows = buildCoverageRows(
      block({ totalTrainingMinutes: 20, goalMatchedMinutes: 30 }),
      [],
      'T'
    )
    expect(rows[0].other).toBe(0)
  })
})

describe('deltaImproves', () => {
  const test = (over: Partial<TestProgressionDto>): TestProgressionDto => ({
    testDefinitionId: 1,
    name: 'Sprint',
    higherIsBetter: false,
    improvedCount: 0,
    worsenedCount: 0,
    membersMeasuredBoth: 0,
    ...over,
  })

  it('respects higherIsBetter in both directions', () => {
    expect(deltaImproves(test({ delta: -0.2, higherIsBetter: false }))).toBe(true)
    expect(deltaImproves(test({ delta: 0.2, higherIsBetter: false }))).toBe(false)
    expect(deltaImproves(test({ delta: 0.2, higherIsBetter: true }))).toBe(true)
    expect(deltaImproves(test({ delta: -0.2, higherIsBetter: true }))).toBe(false)
  })

  it('returns null for zero or missing delta', () => {
    expect(deltaImproves(test({ delta: 0 }))).toBeNull()
    expect(deltaImproves(test({ delta: null }))).toBeNull()
  })
})

describe('gradeColorClass', () => {
  it('maps the school-grade scale', () => {
    expect(gradeColorClass(1)).toBe('bg-green-500')
    expect(gradeColorClass(2)).toBe('bg-lime-500')
    expect(gradeColorClass(3)).toBe('bg-yellow-500')
    expect(gradeColorClass(4)).toBe('bg-orange-500')
    expect(gradeColorClass(5)).toBe('bg-red-500')
  })
})
