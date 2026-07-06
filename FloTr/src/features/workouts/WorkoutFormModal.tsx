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
    <Modal isOpen onClose={onClose} title="Přidat individuální cvičení" maxWidth="sm">
      <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
        <TrainingPicker
          onSelect={(t) => {
            setValue('title', t.name, { shouldValidate: true })
            setValue('description', t.description ?? '')
          }}
        />

        <hr className="border-gray-100" />

        <div>
          <label htmlFor="workout-title" className="block text-sm font-medium text-gray-700 mb-1">
            Název <span className="text-red-500">*</span>
          </label>
          <Input id="workout-title" {...register('title')} placeholder="Název cvičení" />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="workout-desc" className="block text-sm font-medium text-gray-700 mb-1">
            Popis
          </label>
          <textarea
            id="workout-desc"
            {...register('description')}
            rows={3}
            placeholder="Podrobný popis cvičení..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label htmlFor="workout-due" className="block text-sm font-medium text-gray-700 mb-1">
            Splnit do
          </label>
          <Input id="workout-due" type="date" {...register('dueDate')} />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600">Chyba při ukládání. Zkuste to znovu.</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending}>
            Uložit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
