import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Gift, Check } from 'lucide-react'
import { rewardsApi } from '../../api/index'
import { RewardScopeBadge } from '../rewards/RewardScopeBadge'

/** A player's earned real-world rewards (#105) — shown on the member's XP tab. */
export function RewardsCard({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const { data: claims } = useQuery({
    queryKey: ['reward-claims-member', memberId],
    queryFn: () => rewardsApi.memberClaims(memberId),
  })

  if (!claims) return null

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Gift className="h-4 w-4" />
        {t('rewards.myRewards')}
      </h2>
      {claims.length === 0 ? (
        <p className="rounded-lg border border-gray-200 py-6 text-center text-sm text-gray-400">
          {t('rewards.noMyRewards')}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {claims.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
            >
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium text-gray-900">
                  {c.rewardName}
                  <RewardScopeBadge teamId={c.teamId} />
                </p>
                {c.rewardDescription && (
                  <p className="text-xs text-gray-500">{c.rewardDescription}</p>
                )}
                <p className="mt-1 text-xs">
                  {c.status === 'Fulfilled' ? (
                    <span className="inline-flex items-center gap-1 font-medium text-green-700">
                      <Check className="h-3 w-3" />
                      {t('rewards.statusFulfilled')}
                    </span>
                  ) : (
                    <span className="font-medium text-amber-700">
                      {t('rewards.statusEligible')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
