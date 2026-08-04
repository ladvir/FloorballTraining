import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { Home, Check, X } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { homeTrainingsApi } from '../../api/index'

/**
 * Guardian/coach counter-sign queue for self-reported home trainings (#104).
 * Renders nothing when there is nothing to confirm.
 */
export function HomeTrainingConfirmations() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: pending = [] } = useQuery({
    queryKey: ['home-training-confirmations'],
    queryFn: homeTrainingsApi.confirmations,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['home-training-confirmations'] })
    queryClient.invalidateQueries({ queryKey: ['home-trainings'] })
    queryClient.invalidateQueries({ queryKey: ['xp'] })
  }

  const confirmMutation = useMutation({
    mutationFn: (id: number) => homeTrainingsApi.confirm(id),
    onSuccess: invalidate,
  })
  const rejectMutation = useMutation({
    mutationFn: (id: number) => homeTrainingsApi.reject(id),
    onSuccess: invalidate,
  })

  if (pending.length === 0) return null
  const busy = confirmMutation.isPending || rejectMutation.isPending

  // Rendered as a dashboard grid column — same width as the other cards (#104).
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
        <Home className="h-4 w-4" />
        {t('homeTraining.confirmQueue')}
      </h2>
      <Card>
        <CardContent className="divide-y divide-gray-100 p-0">
          {pending.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {l.memberName ? `${l.memberName} — ` : ''}
                  {l.title}
                </p>
                <p className="text-xs text-gray-400">
                  {format(parseISO(l.loggedAt), 'd. M. yyyy', { locale: dfLocale() })}
                  {l.durationMin ? ` · ${t('homeTraining.minutes', { n: l.durationMin })}` : ''}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmMutation.mutate(l.id)}
                  disabled={busy}
                  title={t('homeTraining.confirm')}
                  aria-label={t('homeTraining.confirm')}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => rejectMutation.mutate(l.id)}
                  disabled={busy}
                  title={t('homeTraining.reject')}
                  aria-label={t('homeTraining.reject')}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
