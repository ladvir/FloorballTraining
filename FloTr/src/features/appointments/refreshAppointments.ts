import type { QueryClient } from '@tanstack/react-query'

/**
 * Force every appointment-derived view to reload *now* — calendar & list
 * (`['appointments', …]`), single-event views (`['appointment', id]`) and the
 * dashboard's upcoming list (`['dashboard']`).
 *
 * Uses `refetchType: 'all'` on purpose: the default `'active'` skips any query
 * whose observer is momentarily unmounted (a modal render cycle, a route that
 * isn't the current one), which is what made plain `invalidateQueries` look like
 * it "misfired" — a create/edit/delete would not show until a full page reload.
 */
export function refreshAppointments(qc: QueryClient) {
  return qc.invalidateQueries({
    predicate: (q) => {
      const root = q.queryKey[0]
      return root === 'appointments' || root === 'appointment' || root === 'dashboard'
    },
    refetchType: 'all',
  })
}
