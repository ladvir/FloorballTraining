import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { Home, CheckCircle2, Clock, XCircle, Trash2, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { homeTrainingsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useConfirm } from '../../store/confirmStore'
import { TrainingPicker } from './TrainingPicker'
import type { HomeTrainingLogDto } from '../../types/domain.types'

const STATUS_STYLE: Record<HomeTrainingLogDto['status'], string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Confirmed: 'bg-green-50 text-green-700',
  Rejected: 'bg-gray-100 text-gray-500',
}

function StatusBadge({ status }: { status: HomeTrainingLogDto['status'] }) {
  const { t } = useTranslation()
  const Icon = status === 'Confirmed' ? CheckCircle2 : status === 'Rejected' ? XCircle : Clock
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      <Icon className="h-3 w-3" />
      {t(`homeTraining.status${status}`)}
    </span>
  )
}

interface Props {
  memberId: number
  memberAppUserId?: string | null
}

/** Player self-logs a completed home training (#104) → capped XP after a guardian/coach confirms. */
export function HomeTrainingSection({ memberId, memberAppUserId }: Props) {
  const { t } = useTranslation()
  const { user, isCoach } = useAuthStore()
  const queryClient = useQueryClient()
  const openConfirm = useConfirm()

  const isOwner = !!user?.id && user.id === memberAppUserId
  const canLog = isOwner || isCoach

  const [open, setOpen] = useState(false)
  const [trainingId, setTrainingId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [durationMin, setDurationMin] = useState('')
  // Capture today once (lazy) — new Date() in the render body trips react-hooks/purity.
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [loggedAt, setLoggedAt] = useState(today)
  const [error, setError] = useState<string | null>(null)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['home-trainings', memberId],
    queryFn: () => homeTrainingsApi.getByMember(memberId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['home-trainings', memberId] })
    queryClient.invalidateQueries({ queryKey: ['xp', memberId] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      homeTrainingsApi.create(memberId, {
        trainingId,
        title: title.trim() || null,
        durationMin: durationMin ? Number(durationMin) : null,
        loggedAt,
      }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setTrainingId(null)
      setTitle('')
      setDurationMin('')
      setError(null)
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('common.error')
      setError(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => homeTrainingsApi.delete(id),
    onSuccess: invalidate,
  })

  const canSubmit = (!!trainingId || title.trim().length > 0) && !createMutation.isPending

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Home className="h-4 w-4" />
          {t('homeTraining.title')}
        </h2>
        {canLog && !open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('homeTraining.log')}
          </Button>
        )}
      </div>

      <p className="mb-3 text-xs text-gray-400">{t('homeTraining.hint')}</p>

      {open && (
        <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <TrainingPicker
            onSelect={(tr) => {
              setTrainingId(tr.id)
              setTitle(tr.name)
            }}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('homeTraining.titleField')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setTrainingId(null)
              }}
              placeholder={t('homeTraining.titlePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('homeTraining.dateField')}
              </label>
              <input
                type="date"
                value={loggedAt}
                max={today}
                onChange={(e) => setLoggedAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('homeTraining.durationField')}
              </label>
              <input
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="30"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createMutation.mutate()} disabled={!canSubmit}>
              {t('homeTraining.submit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400">{t('common.loading')}</p>}
      {!isLoading && logs.length === 0 && (
        <p className="text-sm text-gray-400">{t('homeTraining.empty')}</p>
      )}

      {logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((l) => (
            <div
              key={l.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">{l.title}</span>
                  <StatusBadge status={l.status} />
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  <span>{format(parseISO(l.loggedAt), 'd. M. yyyy', { locale: dfLocale() })}</span>
                  {l.durationMin ? (
                    <span>{t('homeTraining.minutes', { n: l.durationMin })}</span>
                  ) : null}
                </div>
                {l.note && <p className="mt-1 text-xs italic text-gray-500">„{l.note}"</p>}
              </div>
              {canLog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openConfirm(t('homeTraining.deleteConfirm'), () => deleteMutation.mutate(l.id))
                  }
                  disabled={deleteMutation.isPending}
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
