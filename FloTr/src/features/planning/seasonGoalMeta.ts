// Shared metric grouping + value formatting for the season-goals card, modal and club rollup.
import type { SeasonGoalDto } from '../../types/domain.types'

export const MATCH_METRICS = [0, 1, 2, 3, 4, 5, 6, 7]
export const TEST_METRICS = [20, 21, 22]
export const PROCESS_METRICS = [40, 41]
export const MANUAL_METRICS = [60, 61]

export const METRIC_GROUPS: { key: string; metrics: number[] }[] = [
  { key: 'match', metrics: MATCH_METRICS },
  { key: 'test', metrics: TEST_METRICS },
  { key: 'process', metrics: PROCESS_METRICS },
  { key: 'manual', metrics: MANUAL_METRICS },
]

export const isTestMetric = (m: number) => TEST_METRICS.includes(m)
export const isManualMetric = (m: number) => MANUAL_METRICS.includes(m)
/** metrics whose value is a percentage: WinRate%, TestImprovedShare%, AttendanceRate% */
export const isPercentMetric = (m: number) => m === 4 || m === 22 || m === 40
/** Losses / GoalsAgainst only make sense as "at most" */
export const forcedAtMost = (m: number) => m === 1 || m === 6

/** Format a computed / target value for display, honouring % and test units. */
export function fmtGoalValue(
  v: number | null | undefined,
  goal: Pick<SeasonGoalDto, 'metric' | 'testUnit'>
): string {
  if (v == null || Number.isNaN(v)) return '–'
  const rounded = Math.round(v * 100) / 100
  if (isPercentMetric(goal.metric)) return `${rounded} %`
  if (isTestMetric(goal.metric) && goal.testUnit) return `${rounded} ${goal.testUnit}`
  return String(rounded)
}

/** verdict enum → tailwind classes + i18n key suffix (label = t('seasonGoals.verdict' + key)). */
export function verdictMeta(v: number): { key: string; cls: string } {
  switch (v) {
    case 1:
      return { key: 'Successful', cls: 'border-green-200 bg-green-100 text-green-700' }
    case 2:
      return { key: 'Partial', cls: 'border-amber-200 bg-amber-100 text-amber-700' }
    case 3:
      return { key: 'Unsuccessful', cls: 'border-red-200 bg-red-100 text-red-700' }
    default:
      return { key: 'Pending', cls: 'border-gray-200 bg-gray-100 text-gray-600' }
  }
}
