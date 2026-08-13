import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Flag, Home, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { xpApi } from '../../api/index'
import type { ChallengeDto } from '../../types/domain.types'

interface Props {
  memberId: number
  /** Only the member themselves can turn a challenge into a home training session. */
  isOwner?: boolean
}

/** Self-completable challenges (#108) — progress card with a one-tap "turn into home training"
 *  action for the HomeTraining-metric challenge, since logging one already counts toward it. */
export function ChallengesCard({ memberId, isOwner }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ['xp-challenges', memberId],
    queryFn: () => xpApi.getChallenges(memberId),
    enabled: Number.isFinite(memberId),
  })

  if (!data || data.active.length === 0) return null

  // Completed first (celebrate), then most progress.
  const rows = [...data.active].sort(
    (a, b) => Number(b.completed) - Number(a.completed) || b.progress - a.progress
  )

  return (
    <Card>
      <CardContent className="py-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Flag className="h-4 w-4" />
          {t('challenge.section')}
        </h3>
        <div className="space-y-3">
          {rows.map((c) => (
            <ChallengeRow
              key={c.code}
              c={c}
              isOwner={isOwner}
              onStart={() => navigate('/me?tab=workouts')}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChallengeRow({
  c,
  isOwner,
  onStart,
}: {
  c: ChallengeDto
  isOwner?: boolean
  onStart: () => void
}) {
  const { t } = useTranslation()
  const pct = Math.round(Math.min(1, Math.max(0, c.progress)) * 100)
  const canStart = isOwner && c.metric === 'HomeTraining' && !c.completed

  return (
    <div className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">{t(`challenge.${c.code}.title`)}</p>
        {c.completed ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('challenge.done', { xp: c.rewardXp })}
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-600">
            {t('challenge.rewardXp', { xp: c.rewardXp })}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">{t(`challenge.${c.code}.desc`)}</p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${c.completed ? 'bg-green-400' : 'bg-sky-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {t(`challenge.window.${c.window}`)} ·{' '}
          {t('challenge.progress', { current: c.current, target: c.target })}
        </span>
        {canStart && (
          <Button variant="ghost" size="sm" onClick={onStart}>
            <Home className="h-3.5 w-3.5" />
            {t('homeTraining.log')}
          </Button>
        )}
      </div>
    </div>
  )
}
