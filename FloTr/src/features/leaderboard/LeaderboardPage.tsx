import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Trophy, Star } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { PageHeader } from '../../components/shared/PageHeader'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { xpApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'
import type { LeaderboardRowDto } from '../../types/domain.types'

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderboardPage() {
  const { t } = useTranslation()
  const { user, activeClubId } = useAuthStore()
  const [sort, setSort] = useState<'season' | 'career'>('season')

  const myMemberId = user?.clubMemberships?.find((m) => m.clubId === activeClubId)?.memberId ?? null

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', activeClubId, sort],
    queryFn: () => xpApi.getLeaderboard({ clubId: activeClubId, sort }),
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('leaderboard.title')} description={t('leaderboard.subtitle')} />

      {/* Season / career toggle */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
        {(['season', 'career'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              sort === s ? 'bg-sky-500 text-white' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {t(`leaderboard.sort.${s}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-500">
            {t('leaderboard.empty')}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Player of the month */}
          {data.playerOfMonth && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-center gap-3 py-4">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                    {t('leaderboard.playerOfMonth')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">{data.playerOfMonth.name}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  +{data.playerOfMonth.recentXp} XP
                </span>
              </CardContent>
            </Card>
          )}

          {/* Rows */}
          <Card>
            <CardContent className="divide-y divide-gray-100 px-0 py-0">
              {data.rows.map((row) => (
                <Row key={row.memberId} row={row} sort={sort} isMe={row.memberId === myMemberId} />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function Row({
  row,
  sort,
  isMe,
}: {
  row: LeaderboardRowDto
  sort: 'season' | 'career'
  isMe: boolean
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5',
        isMe && 'bg-sky-50 ring-1 ring-inset ring-sky-200'
      )}
    >
      <span className="w-7 shrink-0 text-center text-sm font-semibold text-gray-500">
        {MEDALS[row.position] ?? row.position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {row.name}
          {isMe && <span className="ml-1.5 text-xs text-sky-600">({t('leaderboard.you')})</span>}
        </p>
        <p className="text-xs text-gray-400">
          {t(`xp.rank${row.careerRankIndex}`, { defaultValue: row.careerRank })}
          {sort === 'season' && ` · ${t('xp.xpTotal', { xp: row.lifetimeXp })}`}
        </p>
      </div>
      {sort === 'season' ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-amber-500">
            {row.stars}
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </span>
          <span className="w-16 text-right text-sm font-semibold tabular-nums text-gray-900">
            {row.seasonXp} XP
          </span>
        </div>
      ) : (
        <span className="w-20 text-right text-sm font-semibold tabular-nums text-gray-900">
          {row.lifetimeXp} XP
        </span>
      )}
    </div>
  )
}
