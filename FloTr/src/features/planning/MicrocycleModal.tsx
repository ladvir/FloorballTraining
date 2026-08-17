import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format, addDays, parseISO } from 'date-fns'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { planningApi } from '../../api/planning.api'
import { toast } from '../../utils/toast'
import type { MesocycleDto, MicrocycleDto } from '../../types/domain.types'
import { findOverlap, suggestNextStart } from './planningUtils'
import { GoalTagPicker } from './GoalTagPicker'

const TYPES = [0, 1, 2, 3, 4]

interface MicrocycleModalProps {
  isOpen: boolean
  onClose: () => void
  mesocycle: MesocycleDto
  existing: MicrocycleDto | null
}

export function MicrocycleModal({ isOpen, onClose, mesocycle, existing }: MicrocycleModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [goalTagIds, setGoalTagIds] = useState<number[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [shiftFollowing, setShiftFollowing] = useState(false)

  const mesoStart = mesocycle.startDate.slice(0, 10)
  const mesoEnd = mesocycle.endDate.slice(0, 10)

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t('planning.nameRequired')),
          type: z.number(),
          startDate: z.string().min(1, t('planning.dateRequired')),
          endDate: z.string().min(1, t('planning.dateRequired')),
          goal: z.string().optional(),
        })
        .refine((d) => d.endDate >= d.startDate, {
          message: t('validation.dateOrder'),
          path: ['endDate'],
        })
        .refine((d) => !d.startDate || d.startDate >= mesoStart, {
          message: t('planning.insideMesocycle'),
          path: ['startDate'],
        })
        .refine((d) => !d.endDate || d.endDate <= mesoEnd, {
          message: t('planning.insideMesocycle'),
          path: ['endDate'],
        }),
    [t, mesoStart, mesoEnd]
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
    setShiftFollowing(false)
    if (existing) {
      reset({
        name: existing.name,
        type: existing.type,
        startDate: existing.startDate.slice(0, 10),
        endDate: existing.endDate.slice(0, 10),
        goal: existing.goal ?? '',
      })
      setGoalTagIds(existing.goalTagIds)
    } else {
      // Suggest the next free week inside the mesocycle
      const start = suggestNextStart(mesocycle.microcycles, mesoStart)
      const suggestedEnd = format(addDays(parseISO(start), 6), 'yyyy-MM-dd')
      const end = suggestedEnd <= mesoEnd ? suggestedEnd : mesoEnd
      reset({
        name: t('planning.weekPrefix', { n: mesocycle.microcycles.length + 1 }),
        type: 0,
        startDate: start <= mesoEnd ? start : mesoStart,
        endDate: end,
        goal: '',
      })
      setGoalTagIds([])
    }
  }, [isOpen, existing, mesocycle, mesoStart, mesoEnd, reset, t])

  const watchStart = watch('startDate')
  const watchEnd = watch('endDate')
  const candidate = watchStart && watchEnd ? { startDate: watchStart, endDate: watchEnd } : null
  // With the ripple option on, later siblings will be shifted, so only earlier ones can collide
  const relevantSiblings =
    shiftFollowing && existing
      ? mesocycle.microcycles.filter(
          (s) => s.startDate.slice(0, 10) <= existing.endDate.slice(0, 10)
        )
      : mesocycle.microcycles
  const overlap = candidate ? findOverlap(relevantSiblings, candidate, existing?.id) : undefined
  const hasFollowing =
    !!existing &&
    mesocycle.microcycles.some((s) => s.startDate.slice(0, 10) > existing.endDate.slice(0, 10))

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const dto: Partial<MicrocycleDto> = {
        id: existing?.id ?? 0,
        mesocycleId: mesocycle.id,
        name: data.name,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        goal: data.goal || null,
        goalTagIds,
      }
      return existing
        ? planningApi.updateMicrocycle(dto, shiftFollowing)
        : planningApi.createMicrocycle(dto)
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
      title={existing ? t('planning.editMicrocycle') : t('planning.addMicrocycle')}
      maxWidth="lg"
    >
      <p className="mb-3 text-xs text-gray-500">
        {t('planning.inMesocycle', { name: mesocycle.name })} ({mesoStart} – {mesoEnd})
      </p>
      <form
        onSubmit={handleSubmit((data) => {
          setSaveError(null)
          mutation.mutate(data)
        })}
        className="space-y-4"
      >
        <Input
          label={t('planning.name')}
          placeholder={t('planning.weekPrefix', { n: 1 })}
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('planning.type')}
          </label>
          <select
            {...register('type', { valueAsNumber: true })}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {t(`planning.type${tp}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('planning.startDate')}
            type="date"
            min={mesoStart}
            max={mesoEnd}
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label={t('planning.endDate')}
            type="date"
            min={mesoStart}
            max={mesoEnd}
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        {hasFollowing && (
          <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <input
              type="checkbox"
              checked={shiftFollowing}
              onChange={(e) => setShiftFollowing(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm text-gray-700">
              {t('planning.shiftFollowing')}
              <span className="block text-xs text-gray-400">
                {t('planning.shiftFollowingMicroHint')}
              </span>
            </span>
          </label>
        )}

        {overlap && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{t('planning.overlapError', { name: overlap.name })}</span>
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
