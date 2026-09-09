import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Award, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { xpApi } from '../../api/index'
import type { RecentAchievementDto } from '../../types/domain.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const DAYS = 14

/** Coach+ dashboard feed: who earned a badge / crossed a level or rank in the last 14 days,
 *  and for what. Self-hides while loading; shows an empty-state line otherwise. */
export function RecentAchievementsCard({ clubId }: { clubId?: number | null }) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['recentAchievements', clubId ?? null, DAYS],
    queryFn: () => xpApi.getRecentAchievements({ days: DAYS, clubId }),
  })

  if (isLoading) return null
  const items = data ?? []

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        {t('dashboard.recentAchievements')}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t('dashboard.recentAchievementsNone', { days: DAYS })}
        </p>
      ) : (
        <Card>
          <CardContent className="py-2">
            <ul className="divide-y divide-gray-100">
              {items.map((a, i) => (
                <li key={`${a.memberId}-${a.kind}-${i}`} className="flex items-center gap-3 py-2">
                  <AchievementIcon a={a} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{a.memberName}</p>
                    <p className="truncate text-xs text-gray-500">{describe(a, t)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AchievementIcon({ a }: { a: RecentAchievementDto }) {
  if (a.kind === 'badge' && a.badgeIcon) {
    return (
      <img
        src={`${API_BASE_URL}/${a.badgeIcon}`}
        alt=""
        className="h-9 w-9 flex-shrink-0 object-contain"
      />
    )
  }
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
      {a.kind === 'badge' ? <Award className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
    </span>
  )
}

function describe(
  a: RecentAchievementDto,
  t: (k: string, o?: Record<string, unknown>) => string
): string {
  if (a.kind === 'badge' && a.badgeCode) {
    const name = t(`badge.${a.badgeCode}.name`, { defaultValue: a.badgeCode })
    const desc = t(`badge.${a.badgeCode}.desc`, { defaultValue: '' })
    return desc ? `${name} — ${desc}` : name
  }
  if (a.kind === 'rank') {
    return t('dashboard.achievementRankUp', {
      from: t(`xp.rank${a.fromRankIndex ?? 0}`),
      to: t(`xp.rank${a.toRankIndex ?? 0}`),
    })
  }
  return t('dashboard.achievementLevelUp', { from: a.fromLevel ?? 0, to: a.toLevel ?? 0 })
}
