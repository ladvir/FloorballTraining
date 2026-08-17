import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { xpApi } from '../../api/index'
import { cn } from '../../utils/cn'
import type { BadgeStatusDto } from '../../types/domain.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface Props {
  memberId: number
}

export function BadgesCard({ memberId }: Props) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['xp-badges', memberId],
    queryFn: () => xpApi.getBadges(memberId),
    enabled: Number.isFinite(memberId),
  })

  if (isLoading) return <LoadingSpinner />
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-gray-500">
          {t('badge.none')}
        </CardContent>
      </Card>
    )
  }

  const earnedCount = data.filter((b) => b.earned).length

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {t('badge.earnedCount', { earned: earnedCount, total: data.length })}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((b) => (
          <BadgeTile key={b.code} badge={b} />
        ))}
      </div>
    </div>
  )
}

function BadgeTile({ badge }: { badge: BadgeStatusDto }) {
  const { t } = useTranslation()
  const pct = Math.round(badge.progress * 100)
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border p-3 text-center',
        badge.earned ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
      )}
    >
      <img
        src={`${API_BASE_URL}/${badge.icon}`}
        alt=""
        className={cn('h-14 w-14 object-contain', !badge.earned && 'opacity-40 grayscale')}
      />
      <p className="mt-1.5 text-xs font-medium text-gray-800">
        {t(`badge.${badge.code}.name`, { defaultValue: badge.code })}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-400">
        {t(`badge.${badge.code}.desc`, { defaultValue: '' })}
      </p>
      {badge.earned ? (
        <span className="mt-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          {t('badge.earned')}
        </span>
      ) : (
        <div className="mt-2 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[10px] tabular-nums text-gray-400">
            {badge.current} / {badge.threshold}
          </p>
        </div>
      )}
    </div>
  )
}
