import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isAfter, parseISO } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { teamsApi, placesApi, appointmentsApi } from '../../api/index'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import type { TrainingDto } from '../../types/domain.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function addMinutes(datetime: string, minutes: number): string {
  if (!datetime) return ''
  const d = new Date(datetime)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString().slice(0, 16)
}

function formatDatetime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function todayLocalDatetime(): string {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// ── Schemas ───────────────────────────────────────────────────────────────────

// Location is a required FK on Appointment — without it the server rejects the event
const makeNewSchema = (t: (k: string) => string) =>
  z.object({
    start: z.string().min(1),
    end: z.string().min(1),
    teamId: z.coerce.number().optional(),
    locationId: z.coerce.number().min(1, t('appointments.validationPlace')),
    repeatingFrequency: z.coerce.number(),
    interval: z.coerce.number().min(1).max(52).optional(),
    repeatUntil: z.string().optional(),
  })

type NewFormData = z.infer<ReturnType<typeof makeNewSchema>>

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  training: TrainingDto
  isOpen: boolean
  onClose: () => void
  /** Prefill when scheduling from the season plan: 'yyyy-MM-dd' → start at 18:00 that day */
  defaultDate?: string
  defaultTeamId?: number
}

type Tab = 'new' | 'existing'

export function ScheduleTrainingModal({
  training,
  isOpen,
  onClose,
  defaultDate,
  defaultTeamId,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isCoach } = useAuthStore()
  const [tab, setTab] = useState<Tab>('new')
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false)

  const FREQ_OPTIONS = [
    { value: 0, label: t('appointments.freqOnce') },
    { value: 2, label: t('appointments.freqWeekly') },
    { value: 3, label: t('appointments.freqMonthly') },
  ]

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const { data: places } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
  })
  const { data: allTrainings } = useQuery({ queryKey: ['trainings'], queryFn: trainingsApi.getAll })

  // ── New event form ─────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(useMemo(() => makeNewSchema(t), [t])) as any,
    defaultValues: { repeatingFrequency: 0, interval: 1 },
  })

  const startValue = watch('start')
  const freqValue = watch('repeatingFrequency')
  const isRepeating = Number(freqValue) !== 0

  useEffect(() => {
    if (startValue && training.duration) {
      setValue('end', addMinutes(startValue, training.duration))
    }
  }, [startValue, training.duration, setValue])

  useEffect(() => {
    if (isOpen) {
      const defaultStart = defaultDate ? `${defaultDate}T18:00` : todayLocalDatetime()
      reset({
        repeatingFrequency: 0,
        interval: 1,
        start: defaultStart,
        end: training.duration ? addMinutes(defaultStart, training.duration) : '',
        teamId: defaultTeamId ?? 0,
      })
      setTab('new')
      setSelectedAppointmentId(null)
      setOverwriteConfirmed(false)
    }
  }, [isOpen, reset, training.duration, defaultDate, defaultTeamId])

  // ── New event mutation ─────────────────────────────────────────────────────

  const newMutation = useMutation({
    mutationFn: (data: NewFormData) => {
      const isRep = Number(data.repeatingFrequency) !== 0
      return appointmentsApi.create({
        name: training.name,
        trainingId: training.id,
        teamId: data.teamId && data.teamId > 0 ? data.teamId : undefined,
        locationId: data.locationId,
        start: new Date(data.start).toISOString(),
        end: new Date(data.end).toISOString(),
        appointmentType: 0,
        repeatingPattern: isRep
          ? {
              repeatingFrequency: Number(data.repeatingFrequency),
              interval: Number(data.interval) || 1,
              startDate: new Date(data.start).toISOString(),
              endDate: data.repeatUntil ? new Date(data.repeatUntil).toISOString() : undefined,
            }
          : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['seasonPlan'] }) // refresh ScheduledCount badges
      onClose()
    },
  })

  // ── Existing event mutation ────────────────────────────────────────────────

  const existingMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const existing = await appointmentsApi.getById(appointmentId)
      return appointmentsApi.update(appointmentId, {
        ...existing,
        trainingId: training.id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['seasonPlan'] })
      onClose()
    },
  })

  // ── Derived state for existing tab ────────────────────────────────────────

  const selectedAppointment = appointments?.find((a) => a.id === selectedAppointmentId) ?? null
  const conflictingTraining =
    selectedAppointment?.trainingId && selectedAppointment.trainingId !== training.id
      ? allTrainings?.find((tr) => tr.id === selectedAppointment.trainingId)
      : null
  const needsConfirmation = conflictingTraining != null
  const canSubmitExisting =
    selectedAppointmentId != null && (!needsConfirmation || overwriteConfirmed)

  const handleExistingSubmit = () => {
    if (selectedAppointmentId == null) return
    existingMutation.mutate(selectedAppointmentId)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('trainings.schedule')}: ${training.name}`}
      maxWidth="md"
    >
      {/* Tab switcher */}
      <div className="mb-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab('new')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('appointments.newEvent')}
        </button>
        <button
          type="button"
          onClick={() => setTab('existing')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'existing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('trainings.existingEvent')}
        </button>
      </div>

      {/* ── Tab: Nová událost ── */}
      {tab === 'new' && (
        <form onSubmit={handleSubmit((d) => newMutation.mutate(d))} className="space-y-4">
          {isCoach ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('common.team')}
              </label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                {...register('teamId')}
              >
                <option value={0}>{t('appointments.formPersonalEvent')}</option>
                {teams?.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('common.team')}
              </label>
              <p className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                {t('appointments.noTeamPersonal')}
              </p>
              <input type="hidden" {...register('teamId')} value={0} />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('appointments.formPlace')}
            </label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.locationId
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                  : 'border-gray-200 focus:border-sky-400 focus:ring-sky-400'
              }`}
              {...register('locationId')}
            >
              <option value="">{t('appointments.validationPlace')}</option>
              {places?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.locationId && (
              <p className="mt-1 text-xs text-red-500">{errors.locationId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('common.from')}
              type="datetime-local"
              error={errors.start?.message}
              {...register('start')}
            />
            <Input
              label={t('common.to')}
              type="datetime-local"
              error={errors.end?.message}
              {...register('end')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('appointments.formRepeat')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              {...register('repeatingFrequency')}
            >
              {FREQ_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {isRepeating && (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
              <Input
                label={t('appointments.repeatInterval', {
                  unit:
                    Number(freqValue) === 2
                      ? t('appointments.intervalWeeks')
                      : t('appointments.intervalMonths'),
                })}
                type="number"
                min={1}
                max={52}
                error={errors.interval?.message}
                {...register('interval')}
              />
              <Input
                label={t('appointments.repeatUntil')}
                type="date"
                error={errors.repeatUntil?.message}
                {...register('repeatUntil')}
              />
            </div>
          )}

          {newMutation.isError && (
            <p className="text-sm text-red-500">
              {(newMutation.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? t('appointments.saveFailed')}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting || newMutation.isPending}>
              {t('trainings.schedule')}
            </Button>
          </div>
        </form>
      )}

      {/* ── Tab: Existující událost ── */}
      {tab === 'existing' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('common.select')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              value={selectedAppointmentId ?? ''}
              onChange={(e) => {
                setSelectedAppointmentId(e.target.value ? Number(e.target.value) : null)
                setOverwriteConfirmed(false)
              }}
            >
              <option value="">{t('common.select')}</option>
              {(appointments ?? [])
                .filter((a) => isAfter(parseISO(a.end), new Date()))
                .filter((a) => isCoach || !a.teamId)
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((a) => {
                  const team = teams?.find((tr) => tr.id === a.teamId)
                  const existingTraining = a.trainingId
                    ? allTrainings?.find((tr) => tr.id === a.trainingId)
                    : null
                  const label = [
                    formatDatetime(a.start),
                    team?.name,
                    existingTraining ? `⚠ ${existingTraining.name}` : null,
                  ]
                    .filter(Boolean)
                    .join(' – ')
                  return (
                    <option key={a.id} value={a.id}>
                      {label}
                    </option>
                  )
                })}
            </select>
          </div>

          {/* Detail vybrané události */}
          {selectedAppointment && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">{t('trainings.existingEventTime')} </span>
                {formatDatetime(selectedAppointment.start)} –{' '}
                {formatDatetime(selectedAppointment.end)}
              </p>
              {teams?.find((tr) => tr.id === selectedAppointment.teamId) && (
                <p className="text-gray-600">
                  <span className="font-medium">{t('common.team')}: </span>
                  {teams.find((tr) => tr.id === selectedAppointment.teamId)?.name}
                </p>
              )}
              {conflictingTraining && (
                <p className="text-amber-700">
                  <span className="font-medium">
                    {t('trainings.existingEventCurrentTraining')}{' '}
                  </span>
                  {conflictingTraining.name}
                </p>
              )}
            </div>
          )}

          {/* Potvrzení přepsání */}
          {needsConfirmation && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-start gap-2 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{t('trainings.overwriteWarning', { name: conflictingTraining!.name })}</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwriteConfirmed}
                  onChange={(e) => setOverwriteConfirmed(e.target.checked)}
                  className="rounded border-amber-400"
                />
                {t('trainings.overwriteConfirm')}
              </label>
            </div>
          )}

          {existingMutation.isError && (
            <p className="text-sm text-red-500">{t('appointments.saveFailed')}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!canSubmitExisting}
              loading={existingMutation.isPending}
              onClick={handleExistingSubmit}
            >
              {t('trainings.schedule')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
