import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { planningApi } from '../../api/planning.api'
import { toast } from '../../utils/toast'
import type { MesocycleDto } from '../../types/domain.types'
import { findOverlap, isOutsideRange, suggestNextStart } from './planningUtils'
import { GoalTagPicker } from './GoalTagPicker'

const PHASES = [0, 1, 2, 3, 4]

interface MesocycleModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: number
  existing: MesocycleDto | null
  siblings: MesocycleDto[]
  seasonStart?: string | null
  seasonEnd?: string | null
}

export function MesocycleModal({
  isOpen,
  onClose,
  teamId,
  existing,
  siblings,
  seasonStart,
  seasonEnd,
}: MesocycleModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [goalTagIds, setGoalTagIds] = useState<number[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t('planning.nameRequired')),
          phase: z.number(),
          startDate: z.string().min(1, t('planning.dateRequired')),
          endDate: z.string().min(1, t('planning.dateRequired')),
          goal: z.string().optional(),
        })
        .refine((d) => d.endDate >= d.startDate, {
          message: t('validation.dateOrder'),
          path: ['endDate'],
        }),
    [t]
  )
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!isOpen) return
    setSaveError(null)
    if (existing) {
      reset({
        name: existing.name,
        phase: existing.phase,
        startDate: existing.startDate.slice(0, 10),
        endDate: existing.endDate.slice(0, 10),
        goal: existing.goal ?? '',
      })
      setGoalTagIds(existing.goalTagIds)
    } else {
      const start = suggestNextStart(siblings, seasonStart ?? new Date().toISOString())
      reset({ name: '', phase: 0, startDate: start, endDate: '', goal: '' })
      setGoalTagIds([])
    }
  }, [isOpen, existing, siblings, seasonStart, reset])

  const watchStart = watch('startDate')
  const watchEnd = watch('endDate')

  const candidate = watchStart && watchEnd ? { startDate: watchStart, endDate: watchEnd } : null
  const overlap = candidate ? findOverlap(siblings, candidate, existing?.id) : undefined
  const outsideSeason = candidate ? isOutsideRange(candidate, seasonStart, seasonEnd) : false

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const dto: Partial<MesocycleDto> = {
        id: existing?.id ?? 0,
        teamId,
        name: data.name,
        phase: data.phase,
        startDate: data.startDate,
        endDate: data.endDate,
        goal: data.goal || null,
        goalTagIds,
      }
      return existing ? planningApi.updateMesocycle(dto) : planningApi.createMesocycle(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasonPlan'] })
      queryClient.invalidateQueries({ queryKey: ['planCalendar'] })
      toast.success(t('planning.saved'))
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('planning.saveFailed')
      setSaveError(msg)
    },
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existing ? t('planning.editMesocycle') : t('planning.addMesocycle')}
      maxWidth="lg"
    >
      <form
        onSubmit={handleSubmit((data) => {
          setSaveError(null)
          mutation.mutate(data)
        })}
        className="space-y-4"
      >
        <Input
          label={t('planning.name')}
          placeholder={t('planning.mesocycleNamePlaceholder')}
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('planning.phase')}
          </label>
          <select
            {...register('phase', { valueAsNumber: true })}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {t(`planning.phase${p}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('planning.startDate')}
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label={t('planning.endDate')}
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        {overlap && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{t('planning.overlapError', { name: overlap.name })}</span>
          </div>
        )}
        {!overlap && outsideSeason && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{t('planning.outsideSeason')}</span>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('planning.goal')}
          </label>
          <textarea
            {...register('goal')}
            rows={2}
            placeholder={t('planning.goalPlaceholder')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <GoalTagPicker selectedIds={goalTagIds} onChange={setGoalTagIds} />

        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!!overlap} loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
