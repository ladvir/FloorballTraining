import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { teamsApi, placesApi, appointmentsApi } from '../../api/index'
import { trainingsApi } from '../../api/trainings.api'
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
  return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const FREQ_OPTIONS = [
  { value: 0, label: 'Jednou' },
  { value: 2, label: 'Týdně' },
  { value: 3, label: 'Měsíčně' },
]

const newSchema = z.object({
  start: z.string().min(1, 'Datum zahájení je povinné'),
  end: z.string().min(1, 'Datum ukončení je povinné'),
  teamId: z.coerce.number({ invalid_type_error: 'Vyberte tým' }).min(1, 'Vyberte tým'),
  locationId: z.coerce.number().optional(),
  repeatingFrequency: z.coerce.number(),
  interval: z.coerce.number().min(1).max(52).optional(),
  repeatUntil: z.string().optional(),
})

type NewFormData = z.infer<typeof newSchema>

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  training: TrainingDto
  isOpen: boolean
  onClose: () => void
}

type Tab = 'new' | 'existing'

export function ScheduleTrainingModal({ training, isOpen, onClose }: Props) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('new')
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false)

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const { data: places } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  const { data: appointments } = useQuery({ queryKey: ['appointments'], queryFn: () => appointmentsApi.getAll() })
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
    resolver: zodResolver(newSchema),
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
      reset({ repeatingFrequency: 0, interval: 1 })
      setTab('new')
      setSelectedAppointmentId(null)
      setOverwriteConfirmed(false)
    }
  }, [isOpen, reset])

  // ── New event mutation ─────────────────────────────────────────────────────

  const newMutation = useMutation({
    mutationFn: (data: NewFormData) => {
      const isRep = Number(data.repeatingFrequency) !== 0
      return appointmentsApi.create({
        trainingId: training.id,
        teamId: data.teamId,
        locationId: data.locationId || undefined,
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
      onClose()
    },
  })

  // ── Existing event mutation ────────────────────────────────────────────────

  const existingMutation = useMutation({
    mutationFn: (appointmentId: number) =>
      appointmentsApi.update(appointmentId, { trainingId: training.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  // ── Derived state for existing tab ────────────────────────────────────────

  const selectedAppointment = appointments?.find((a) => a.id === selectedAppointmentId) ?? null
  const conflictingTraining = selectedAppointment?.trainingId && selectedAppointment.trainingId !== training.id
    ? allTrainings?.find((t) => t.id === selectedAppointment.trainingId)
    : null
  const needsConfirmation = conflictingTraining != null
  const canSubmitExisting = selectedAppointmentId != null && (!needsConfirmation || overwriteConfirmed)

  const handleExistingSubmit = () => {
    if (selectedAppointmentId == null) return
    existingMutation.mutate(selectedAppointmentId)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Naplánovat: ${training.name}`} maxWidth="md">
      {/* Tab switcher */}
      <div className="mb-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab('new')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Nová událost
        </button>
        <button
          type="button"
          onClick={() => setTab('existing')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Existující událost
        </button>
      </div>

      {/* ── Tab: Nová událost ── */}
      {tab === 'new' && (
        <form onSubmit={handleSubmit((d) => newMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tým</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              {...register('teamId')}
            >
              <option value="">— Vyberte tým —</option>
              {teams?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.teamId && <p className="mt-1 text-xs text-red-500">{errors.teamId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Místo (nepovinné)</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              {...register('locationId')}
            >
              <option value="">— Bez místa —</option>
              {places?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Od" type="datetime-local" error={errors.start?.message} {...register('start')} />
            <Input label="Do" type="datetime-local" error={errors.end?.message} {...register('end')} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Opakování</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              {...register('repeatingFrequency')}
            >
              {FREQ_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {isRepeating && (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
              <Input
                label={`Každých N ${Number(freqValue) === 2 ? 'týdnů' : 'měsíců'}`}
                type="number"
                min={1}
                max={52}
                error={errors.interval?.message}
                {...register('interval')}
              />
              <Input
                label="Opakovat do"
                type="date"
                error={errors.repeatUntil?.message}
                {...register('repeatUntil')}
              />
            </div>
          )}

          {newMutation.isError && (
            <p className="text-sm text-red-500">Nepodařilo se naplánovat trénink.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Zrušit</Button>
            <Button type="submit" loading={isSubmitting || newMutation.isPending}>Naplánovat</Button>
          </div>
        </form>
      )}

      {/* ── Tab: Existující událost ── */}
      {tab === 'existing' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vyberte událost</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              value={selectedAppointmentId ?? ''}
              onChange={(e) => {
                setSelectedAppointmentId(e.target.value ? Number(e.target.value) : null)
                setOverwriteConfirmed(false)
              }}
            >
              <option value="">— Vyberte událost —</option>
              {(appointments ?? [])
                .slice()
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((a) => {
                  const team = teams?.find((t) => t.id === a.teamId)
                  const existingTraining = a.trainingId ? allTrainings?.find((t) => t.id === a.trainingId) : null
                  const label = [
                    formatDatetime(a.start),
                    team?.name,
                    existingTraining ? `⚠ ${existingTraining.name}` : null,
                  ].filter(Boolean).join(' – ')
                  return (
                    <option key={a.id} value={a.id}>{label}</option>
                  )
                })}
            </select>
          </div>

          {/* Detail vybrané události */}
          {selectedAppointment && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">Čas: </span>
                {formatDatetime(selectedAppointment.start)} – {formatDatetime(selectedAppointment.end)}
              </p>
              {teams?.find((t) => t.id === selectedAppointment.teamId) && (
                <p className="text-gray-600">
                  <span className="font-medium">Tým: </span>
                  {teams.find((t) => t.id === selectedAppointment.teamId)?.name}
                </p>
              )}
              {conflictingTraining && (
                <p className="text-amber-700">
                  <span className="font-medium">Aktuální trénink: </span>
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
                <span>
                  Tato událost již má přiřazen trénink <strong>„{conflictingTraining!.name}"</strong>.
                  Přiřazením bude nahrazen aktuálním tréninkem.
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwriteConfirmed}
                  onChange={(e) => setOverwriteConfirmed(e.target.checked)}
                  className="rounded border-amber-400"
                />
                Ano, chci přepsat stávající trénink
              </label>
            </div>
          )}

          {existingMutation.isError && (
            <p className="text-sm text-red-500">Nepodařilo se přiřadit trénink.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Zrušit</Button>
            <Button
              type="button"
              disabled={!canSubmitExisting}
              loading={existingMutation.isPending}
              onClick={handleExistingSubmit}
            >
              Přiřadit k události
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
