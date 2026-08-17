import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { xpApi } from '../../api/index'
import { latestSeasonStars } from './xpUtils'
import type { CareerXpDto } from '../../types/domain.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface Props {
  memberId: number
  /** Compact header variant (single row). Full variant adds the rank-progress line. */
  compact?: boolean
}

/** Localized rank name from the rank index, falling back to the server string. */
function useRankName() {
  const { t } = useTranslation()
  return (career: CareerXpDto) => t(`xp.rank${career.rankIndex}`, { defaultValue: career.rank })
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= value ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4 text-gray-300'}
        />
      ))}
    </div>
  )
}

export function XpCareerCard({ memberId, compact }: Props) {
  const { t } = useTranslation()
  const rankName = useRankName()
  const { data } = useQuery({
    queryKey: ['xp', memberId],
    queryFn: () => xpApi.getSummary(memberId),
    enabled: Number.isFinite(memberId),
  })

  // Seasonal form = stars of the latest season on record (0 when none).
  const stars = useMemo(() => (data ? latestSeasonStars(data.bySeason) : 0), [data])

  if (!data) return null
  const c = data.career
  const levelPct = Math.round(c.levelProgress * 100)

  return (
    <Card>
      <CardContent className={compact ? 'py-3' : 'py-4'}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Rank + level */}
          <div className="flex items-center gap-3">
            <img
              src={`${API_BASE_URL}/badges/rank${c.rankIndex}.png`}
              alt=""
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">{rankName(c)}</p>
              <p className="text-xs text-gray-500">{t('xp.level', { level: c.level })}</p>
            </div>
          </div>

          {/* XP progress to next level */}
          <div className="min-w-[10rem] flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>{t('xp.xpTotal', { xp: data.totalXp })}</span>
              {c.nextRank ? (
                <span>{t('xp.toNextLevel', { xp: c.xpToNextLevel })}</span>
              ) : (
                <span className="font-medium text-amber-600">{t('xp.maxRank')}</span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all"
                style={{ width: `${levelPct}%` }}
              />
            </div>
            {!compact && c.nextRank && (
              <p className="mt-1 text-xs text-gray-400">
                {t('xp.toNextRank', {
                  rank: t(`xp.rank${c.rankIndex + 1}`, { defaultValue: c.nextRank }),
                  xp: c.xpToNextRank ?? 0,
                })}
              </p>
            )}
          </div>

          {/* Seasonal form */}
          <div className="text-right">
            <p className="mb-1 text-xs text-gray-500">{t('xp.seasonForm')}</p>
            <Stars value={stars} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
