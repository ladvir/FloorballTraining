import type { QueryClient } from '@tanstack/react-query'

/**
 * Force every season-plan-derived view to reload *now* — the plan itself
 * (`['seasonPlan', …]`), the calendar overlay (`['planCalendar', …]`) and the
 * mesocycle evaluation (`['mesocycleEvaluation', …]`).
 *
 * Uses `refetchType: 'all'` on purpose: the default `'active'` skips any query
 * whose observer is momentarily unmounted (a modal render cycle), which is what
 * made plain `invalidateQueries` look like it "misfired" — a meso/micro/trainings
 * edit would not show until a full page reload. Mirrors `refreshAppointments`.
 */
export function refreshPlan(qc: QueryClient) {
  return qc.invalidateQueries({
    predicate: (q) => {
      const root = q.queryKey[0]
      return root === 'seasonPlan' || root === 'planCalendar' || root === 'mesocycleEvaluation'
    },
    refetchType: 'all',
  })
}
