import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Coins, HandHeart, Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { xpApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { XpRuleCatalogItemDto } from '../../types/domain.types'

// Layer → how the reward is granted (chip on each row). A automatic, B coach, C home (capped).
const layerVariant: Record<string, 'success' | 'info' | 'violet'> = {
  A: 'success',
  B: 'info',
  C: 'violet',
}

/**
 * Member-facing "How to earn XP" catalog (#107): every earnable reward, its effective club value
 * (#106) and how it is granted, split into "what I can do myself" vs "what a coach/family rewards".
 */
export function HowToEarnXpPage() {
  const { t } = useTranslation()
  const { user, activeClubId } = useAuthStore()
  // Optional own-progress (#107 nice-to-have): only a member who is a player has an XP profile to show.
  const myMembership = user?.clubMemberships?.find((m) => m.clubId === activeClubId)
  const myMemberId = myMembership?.isPlayer ? (myMembership.memberId ?? null) : null

  const { data: rules, isLoading } = useQuery({
    queryKey: ['xp-rules-catalog'],
    queryFn: () => xpApi.getRules(),
  })

  const { data: summary } = useQuery({
    queryKey: ['xp', myMemberId],
    queryFn: () => xpApi.getSummary(myMemberId!),
    enabled: myMemberId != null,
  })

  // Lifetime XP the player has already earned per event code (byType only carries non-zero entries).
  const earnedByCode = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of summary?.byType ?? []) map[b.type] = b.xp
    return map
  }, [summary])

  const [self, granted] = useMemo(() => {
    const items = rules ?? []
    return [items.filter((r) => r.selfActionable), items.filter((r) => !r.selfActionable)]
  }, [rules])

  return (
    <div>
      <PageHeader title={t('xpHowto.title')} description={t('xpHowto.subtitle')} />

      {isLoading || !rules ? (
        <LoadingSpinner />
      ) : rules.length === 0 ? (
        <EmptyState title={t('xpHowto.empty')} description={t('xpHowto.emptyDesc')} />
      ) : (
        <div className="space-y-6">
          <Section
            icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
            title={t('xpHowto.selfSection')}
            hint={t('xpHowto.selfHint')}
            items={self}
            earnedByCode={earnedByCode}
          />
          <Section
            icon={<HandHeart className="h-5 w-5 text-sky-500" />}
            title={t('xpHowto.grantedSection')}
            hint={t('xpHowto.grantedHint')}
            items={granted}
            earnedByCode={earnedByCode}
          />
        </div>
      )}
    </div>
  )
}

function Section({
  icon,
  title,
  hint,
  items,
  earnedByCode,
}: {
  icon: React.ReactNode
  title: string
  hint: string
  items: XpRuleCatalogItemDto[]
  earnedByCode: Record<string, number>
}) {
  if (items.length === 0) return null
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="mb-3 text-sm text-gray-500">{hint}</p>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {items.map((r) => (
              <RuleRow key={r.code} rule={r} earned={earnedByCode[r.code] ?? 0} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function RuleRow({ rule, earned }: { rule: XpRuleCatalogItemDto; earned: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
          {t(`xp.type.${rule.code}`)}
          <Badge variant={layerVariant[rule.layer]} size="sm">
            {t(`xpHowto.layer.${rule.layer}`)}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-gray-500">{t(`xp.howto.desc.${rule.code}`)}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
          <Coins className="h-3.5 w-3.5" />+{rule.points}
        </div>
        {earned > 0 && (
          <span className="text-[11px] font-medium text-emerald-600">
            {t('xpHowto.earned', { xp: earned })}
          </span>
        )}
      </div>
    </div>
  )
}
