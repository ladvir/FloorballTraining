import type { CycleEvaluationBlockDto, TestProgressionDto } from '../../types/domain.types'

/** Row of the coverage stacked-bar chart: goal-matched vs other training minutes. */
export interface CoverageRow {
  name: string
  matched: number
  other: number
  percent: number
}

/** Total first, then per-microcycle blocks; blocks without held trainings are kept (zero bars). */
export function buildCoverageRows(
  total: CycleEvaluationBlockDto,
  microcycles: CycleEvaluationBlockDto[],
  totalLabel: string
): CoverageRow[] {
  const toRow = (block: CycleEvaluationBlockDto, name: string): CoverageRow => ({
    name,
    matched: block.goalMatchedMinutes,
    other: Math.max(block.totalTrainingMinutes - block.goalMatchedMinutes, 0),
    percent: block.goalCoveragePercent,
  })
  return [toRow(total, totalLabel), ...microcycles.map((mc) => toRow(mc, mc.name))]
}

/**
 * Whether the average delta means improvement: for "higher is better" tests a
 * positive delta improves, otherwise a negative one does. Zero/None → null.
 */
export function deltaImproves(test: TestProgressionDto): boolean | null {
  if (test.delta == null || test.delta === 0) return null
  return test.higherIsBetter ? test.delta > 0 : test.delta < 0
}

/** 1.0–5.0 school-grade color (1 = best), matching the calendar's grade badge scale. */
export function gradeColorClass(grade: number): string {
  if (grade <= 1.5) return 'bg-green-500'
  if (grade <= 2.5) return 'bg-lime-500'
  if (grade <= 3.5) return 'bg-yellow-500'
  if (grade <= 4.5) return 'bg-orange-500'
  return 'bg-red-500'
}
