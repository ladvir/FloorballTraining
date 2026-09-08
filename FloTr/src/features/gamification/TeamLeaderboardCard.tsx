import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Users } from 'lucide-react'
import { cn } from '../../utils/cn'
import { xpApi } from '../../api/index'

type Sort = 'avg' | 'total' | 'challenges'

/** Team-vs-team leaderboard within the caller's club (#156). Collapsible; defaults closed so it
 *  doesn't crowd the members table it sits above. `highlightTeamId` bolds one row (team detail page). */
export function TeamLeaderboardCard({
  clubId,
  highlightTeamId,
  defaultOpen = false,
}: {
  clubId?: number
  highlightTeamId?: number
  defaultOpen?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)
  const [sort, setSort] = useState<Sort>('avg')

  const { data } = useQuery({
    queryKey: ['team-leaderboard', clubId, sort],
    queryFn: () => xpApi.getTeamLeaderboard({ clubId, sort }),
    enabled: open,
  })

  const rows = data?.rows ?? []

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800"
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-500" />
          {t('teamLeaderboard.title')}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="mb-3 inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs">
            {(['avg', 'total', 'challenges'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium transition-colors',
                  sort === s ? 'bg-sky-500 text-white' : 'text-gray-500 hover:text-gray-800'
                )}
              >
                {t(`teamLeaderboard.sort.${s}`)}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="py-2 text-sm text-gray-400">{t('leaderboard.empty')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs font-medium text-gray-500">
                <tr>
                  <th className="py-1.5 text-left">#</th>
                  <th className="py-1.5 text-left">{t('teamLeaderboard.team')}</th>
                  <th className="py-1.5 text-right">{t('teamLeaderboard.avg')}</th>
                  <th className="py-1.5 text-right">{t('teamLeaderboard.total')}</th>
                  <th className="py-1.5 text-right">{t('teamLeaderboard.challenges')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.teamId}
                    className={cn(
                      'border-t border-gray-100',
                      r.teamId === highlightTeamId && 'bg-sky-50 font-semibold'
                    )}
                  >
                    <td className="py-1.5 text-gray-400">{r.position}</td>
                    <td className="py-1.5 text-gray-900">{r.name}</td>
                    <td className="py-1.5 text-right text-gray-900">{r.avgXp}</td>
                    <td className="py-1.5 text-right text-gray-500">{r.seasonXp}</td>
                    <td className="py-1.5 text-right text-gray-500">{r.challengesCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
