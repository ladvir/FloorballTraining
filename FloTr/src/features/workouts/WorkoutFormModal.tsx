import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { workoutsApi } from '../../api/index'
import { TrainingPicker } from './TrainingPicker'

const schema = z.object({
  title: z.string().min(1, 'Název je povinný').max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  memberId: number
  onClose: () => void
}

export function WorkoutFormModal({ memberId, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      workoutsApi.create(memberId, {
        title: values.title,
        description: values.description || null,
        dueDate: values.dueDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', memberId] })
      onClose()
    },
  })

  return (
    <Modal isOpen onClose={onClose} title={t('workouts.addWorkout')} maxWidth="sm">
      <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
        <TrainingPicker
          onSelect={(tr) => {
            setValue('title', tr.name, { shouldValidate: true })
            setValue('description', tr.description ?? '')
          }}
        />

        <hr className="border-gray-100" />

        <div>
          <label htmlFor="workout-title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('activities.formName')} <span className="text-red-500">*</span>
          </label>
          <Input id="workout-title" {...register('title')} placeholder={t('activities.formName')} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="workout-desc" className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.description')}
          </label>
          <textarea
            id="workout-desc"
            {...register('description')}
            rows={3}
            placeholder={t('activities.formDescription')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label htmlFor="workout-due" className="block text-sm font-medium text-gray-700 mb-1">
            {t('workouts.formDate')}
          </label>
          <Input id="workout-due" type="date" {...register('dueDate')} />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600">{t('workouts.saveFailed')}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
