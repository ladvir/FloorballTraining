import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

/** Shows whether a reward is club-wide (teamId null) or team-scoped. Used on every reward display. */
export function RewardScopeBadge({
  teamId,
  className,
}: {
  teamId?: number | null
  className?: string
}) {
  const { t } = useTranslation()
  const isTeam = teamId != null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium',
        isTeam ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700',
        className
      )}
    >
      {isTeam ? t('rewards.scopeTeam') : t('rewards.scopeClub')}
    </span>
  )
}
