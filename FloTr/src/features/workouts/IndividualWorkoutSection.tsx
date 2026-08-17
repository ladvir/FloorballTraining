import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { Plus, Dumbbell, Trash2, CheckCircle2, SkipForward, Clock, Users } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { workoutsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { WorkoutFormModal } from './WorkoutFormModal'
import { BulkWorkoutModal } from './BulkWorkoutModal'
import type { IndividualWorkoutDto } from '../../types/domain.types'
import { useConfirm } from '../../store/confirmStore'

const STATUS_COLORS: Record<number, string> = {
  0: 'bg-sky-50 text-sky-700',
  1: 'bg-green-50 text-green-700',
  2: 'bg-gray-100 text-gray-500',
}

function StatusBadge({ workout }: { workout: IndividualWorkoutDto }) {
  const { t } = useTranslation()
  if (workout.isOverdue && workout.status === 0) {
    return (
      <span
        data-testid="workout-overdue"
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
      >
        <Clock className="h-3 w-3" />
        {t('workouts.formStatus')}
      </span>
    )
  }

  const statusLabel =
    workout.status === 0
      ? t('workouts.statusPlanned')
      : workout.status === 1
        ? t('workouts.statusCompleted')
        : workout.status === 2
          ? t('workouts.statusSkipped')
          : t('workouts.statusPlanned')

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[workout.status] ?? STATUS_COLORS[0]}`}
    >
      {statusLabel}
    </span>
  )
}

interface Props {
  memberId: number
  memberAppUserId?: string | null
}

export function IndividualWorkoutSection({ memberId, memberAppUserId }: Props) {
  const { t } = useTranslation()
  const { isCoach, user } = useAuthStore()
  const queryClient = useQueryClient()
  const openConfirm = useConfirm()
  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const isOwner = !!user?.id && user.id === memberAppUserId

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts', memberId],
    queryFn: () => workoutsApi.getByMember(memberId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workoutsApi.delete(memberId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts', memberId] }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, playerNote }: { id: number; status: number; playerNote?: string }) =>
      workoutsApi.updateStatus(memberId, id, { status, playerNote }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts', memberId] }),
  })

  const handleDelete = (w: IndividualWorkoutDto) => {
    openConfirm(
      `Opravdu chcete smazat cvičení „${w.title}"?`,
      () => deleteMutation.mutate(w.id),
      t('workouts.deleteWorkout')
    )
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Dumbbell className="h-4 w-4" />
          {t('workouts.title')}
        </h2>
        {isCoach && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkOpen(true)}
              title={t('workouts.bulkAdd')}
            >
              <Users className="h-4 w-4" />
              {t('workouts.bulkAdd')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(true)}
              aria-label={t('workouts.addWorkout')}
            >
              <Plus className="h-4 w-4" />
              {t('workouts.addWorkout')}
            </Button>
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-400">{t('common.loading')}</p>}

      {!isLoading && workouts.length === 0 && (
        <p className="text-sm text-gray-400">{t('workouts.noWorkouts')}</p>
      )}

      {workouts.length > 0 && (
        <div className="space-y-2">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 truncate">{w.title}</span>
                    <StatusBadge workout={w} />
                    {w.isTeamWorkout && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        <Users className="h-3 w-3" />
                        {t('common.team')}
                      </span>
                    )}
                  </div>
                  {w.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{w.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      Zadáno {format(parseISO(w.assignedAt), 'd. M. yyyy', { locale: dfLocale() })}
                    </span>
                    {w.dueDate && (
                      <span className={w.isOverdue && w.status === 0 ? 'text-red-500' : ''}>
                        {t('workouts.formDate')}{' '}
                        {format(parseISO(w.dueDate), 'd. M. yyyy', { locale: dfLocale() })}
                      </span>
                    )}
                    {w.completedAt && (
                      <span className="text-green-600">
                        {t('workouts.statusCompleted')}{' '}
                        {format(parseISO(w.completedAt), 'd. M. yyyy', { locale: dfLocale() })}
                      </span>
                    )}
                  </div>
                  {w.playerNote && (
                    <p className="mt-1 text-xs italic text-gray-500">„{w.playerNote}"</p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {w.status === 0 && (isOwner || isCoach) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => statusMutation.mutate({ id: w.id, status: 1 })}
                        disabled={statusMutation.isPending}
                        title={t('workouts.markCompleted')}
                        aria-label={t('workouts.markCompleted')}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => statusMutation.mutate({ id: w.id, status: 2 })}
                        disabled={statusMutation.isPending}
                        title={t('workouts.markSkipped')}
                        aria-label={t('workouts.markSkipped')}
                      >
                        <SkipForward className="h-4 w-4 text-gray-400" />
                      </Button>
                    </>
                  )}
                  {w.status !== 0 && isCoach && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => statusMutation.mutate({ id: w.id, status: 0 })}
                      disabled={statusMutation.isPending}
                      title={t('workouts.statusPlanned')}
                      aria-label={t('workouts.statusPlanned')}
                    >
                      <Clock className="h-4 w-4 text-sky-500" />
                    </Button>
                  )}
                  {isCoach && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(w)}
                      disabled={deleteMutation.isPending}
                      title={t('workouts.deleteWorkout')}
                      aria-label={t('workouts.deleteWorkout')}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && <WorkoutFormModal memberId={memberId} onClose={() => setAddOpen(false)} />}

      {bulkOpen && (
        <BulkWorkoutModal
          onClose={() => setBulkOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['workouts', memberId] })
          }}
        />
      )}
    </div>
  )
}
