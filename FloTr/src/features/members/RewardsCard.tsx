import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Gift, Check } from 'lucide-react'
import { rewardsApi } from '../../api/index'
import { RewardScopeBadge } from '../rewards/RewardScopeBadge'
import { cn } from '../../utils/cn'
import type { MemberRewardClaimDto } from '../../types/domain.types'

/**
 * A player's earned real-world rewards (#105) — shown on the member's XP tab. Unfulfilled (earned but
 * not yet handed over) claims sort first and are visually highlighted, so a coach/player sees at a
 * glance what's waiting to be picked up; fulfilled ones sit below, muted, as a history record.
 */
export function RewardsCard({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const { data: claims } = useQuery({
    queryKey: ['reward-claims-member', memberId],
    queryFn: () => rewardsApi.memberClaims(memberId),
  })

  if (!claims) return null

  const sorted = [...claims].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Fulfilled' ? 1 : -1
    return b.earnedAt.localeCompare(a.earnedAt)
  })

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Gift className="h-4 w-4" />
        {t('rewards.myRewards')}
      </h2>
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-gray-200 py-6 text-center text-sm text-gray-400">
          {t('rewards.noMyRewards')}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {sorted.map((c) => (
            <RewardClaimTile key={c.id} claim={c} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Dashboard widget (#105): a player's own rewards that are earned but not yet handed over. Self-hides
 * once there are none — including right after a coach marks the last one fulfilled, since it re-fetches
 * the same claims query RewardsCard uses.
 */
export function PendingRewardsCard({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const { data: claims } = useQuery({
    queryKey: ['reward-claims-member', memberId],
    queryFn: () => rewardsApi.memberClaims(memberId),
  })

  const pending = claims?.filter((c) => c.status !== 'Fulfilled') ?? []
  if (pending.length === 0) return null

  return (
    <div className="mt-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Gift className="h-4 w-4 text-amber-500" />
        {t('rewards.myRewards')}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {pending.map((c) => (
          <RewardClaimTile key={c.id} claim={c} />
        ))}
      </div>
    </div>
  )
}

function RewardClaimTile({ claim: c }: { claim: MemberRewardClaimDto }) {
  const { t } = useTranslation()
  const pending = c.status !== 'Fulfilled'

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3 py-2.5',
        pending
          ? 'border-amber-300 bg-amber-50 shadow-md ring-2 ring-amber-300'
          : 'border-gray-200 bg-gray-50'
      )}
    >
      <Gift
        className={cn('mt-0.5 h-5 w-5 shrink-0', pending ? 'text-amber-500' : 'text-gray-400')}
      />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium text-gray-900">
          {c.rewardName}
          <RewardScopeBadge teamId={c.teamId} />
        </p>
        {c.rewardDescription && (
          <p className={cn('text-xs', pending ? 'text-gray-600' : 'text-gray-400')}>
            {c.rewardDescription}
          </p>
        )}
        <p className="mt-1 text-xs">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              {t('rewards.statusEligible')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-gray-500">
              <Check className="h-3 w-3" />
              {t('rewards.statusFulfilled')}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
