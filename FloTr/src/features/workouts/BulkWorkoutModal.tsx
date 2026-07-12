import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users, CheckSquare, Square } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { teamsApi, workoutsApi } from '../../api/index'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { TrainingPicker } from './TrainingPicker'

const schema = z.object({
  title: z.string().min(1, 'Název je povinný').max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onClose: () => void
  /** If provided, pre-selects this team and skips the team picker */
  defaultTeamId?: number
  /** Called after successful bulk create so parent can invalidate queries */
  onCreated?: (memberIds: number[]) => void
}

export function BulkWorkoutModal({ onClose, defaultTeamId, onCreated }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(defaultTeamId ?? null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [success, setSuccess] = useState(false)

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  })

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', selectedTeamId],
    queryFn: () => teamsApi.getById(selectedTeamId!),
    enabled: selectedTeamId !== null,
  })

  const members = useMemo(
    () =>
      team?.teamMembers
        ?.filter((tm) => tm.member && tm.isPlayer)
        .map((tm) => tm.member!)
        .sort((a, b) => a.lastName.localeCompare(b.lastName, 'cs')) ?? [],
    [team]
  )

  const allSelected = members.length > 0 && members.every((m) => selectedIds.has(m.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)))
    }
  }

  const toggleMember = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const bulkMutation = useMutation({
    mutationFn: (values: FormValues) =>
      workoutsApi.bulk({
        title: values.title,
        description: values.description || null,
        dueDate: values.dueDate || null,
        memberIds: [...selectedIds],
      }),
    onSuccess: () => {
      const ids = [...selectedIds]
      ids.forEach((memberId) => queryClient.invalidateQueries({ queryKey: ['workouts', memberId] }))
      onCreated?.(ids)
      setSuccess(true)
    },
  })

  if (success) {
    return (
      <Modal isOpen onClose={onClose} title={t('workouts.editWorkout')} maxWidth="sm">
        <p className="text-sm text-gray-700 mb-4">
          Trénink byl úspěšně přiřazen {selectedIds.size} členům.
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>{t('common.close')}</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen onClose={onClose} title={t('workouts.bulkAdd')} maxWidth="md">
      <form onSubmit={handleSubmit((v) => bulkMutation.mutate(v))} className="space-y-5">
        {/* Team picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.team')} <span className="text-red-500">*</span>
          </label>
          {teamsLoading ? (
            <LoadingSpinner />
          ) : (
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={selectedTeamId ?? ''}
              onChange={(e) => {
                setSelectedTeamId(e.target.value ? Number(e.target.value) : null)
                setSelectedIds(new Set())
              }}
            >
              <option value="">– {t('common.select')} –</option>
              {teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Member list */}
        {selectedTeamId !== null && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t('common.member')}
                {members.length > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({selectedIds.size}/{members.length} vybráno)
                  </span>
                )}
              </label>
              {members.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {allSelected ? t('common.deselect') : t('common.select')}
                </button>
              )}
            </div>

            {teamLoading ? (
              <LoadingSpinner />
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">{t('teams.noMembers')}</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-800">
                      {m.lastName} {m.firstName}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Training picker */}
        <TrainingPicker
          onSelect={(tr) => {
            setValue('title', tr.name, { shouldValidate: true })
            setValue('description', tr.description ?? '')
          }}
        />

        <hr className="border-gray-100" />

        {/* Workout details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('activities.formName')} <span className="text-red-500">*</span>
          </label>
          <Input {...register('title')} placeholder={t('activities.formName')} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.description')}
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder={t('activities.formDescription')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('workouts.formDate')}
          </label>
          <Input type="date" {...register('dueDate')} />
        </div>

        {bulkMutation.isError && <p className="text-sm text-red-600">{t('workouts.saveFailed')}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={selectedIds.size === 0 || bulkMutation.isPending}
          >
            {bulkMutation.isPending
              ? t('common.loading')
              : `${t('common.add')}${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
