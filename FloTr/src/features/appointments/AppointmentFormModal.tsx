import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Save, Repeat } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { placesApi, teamsApi } from '../../api/index'
import { apiClient } from '../../api/axios'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'

const appointmentTypes = [
  { value: 0, label: 'Trénink' },
  { value: 1, label: 'Soustředění' },
  { value: 2, label: 'Propagace' },
  { value: 3, label: 'Zápas' },
  { value: 4, label: 'Ostatní' },
  { value: 5, label: 'Školení' },
  { value: 6, label: 'Pořádání akce' },
]

const frequencyOptions = [
  { value: 0, label: 'Jednou (bez opakování)' },
  { value: 1, label: 'Denně' },
  { value: 2, label: 'Týdně' },
  { value: 3, label: 'Měsíčně' },
  { value: 4, label: 'Ročně' },
]

const intervalLabels: Record<number, string> = {
  1: 'dní',
  2: 'týdnů',
  3: 'měsíců',
  4: 'let',
}

const schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  start: z.string().min(1, 'Zadejte začátek'),
  end: z.string().min(1, 'Zadejte konec'),
  appointmentType: z.coerce.number(),
  teamId: z.coerce.number().optional(),
  locationId: z.coerce.number().min(1, 'Vyberte místo'),
  locationName: z.string().optional(),
  trainingId: z.coerce.number().optional(),
  repeatingFrequency: z.coerce.number(),
  repeatingInterval: z.coerce.number().min(1).max(52).optional(),
  repeatUntil: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  appointment?: {
    id: number; name?: string; description?: string; start: string; end: string
    appointmentType?: number; teamId?: number; locationId?: number; trainingId?: number
    repeatingPattern?: { repeatingFrequency: number; interval: number; startDate: string; endDate?: string }
    parentAppointment?: { id: number }
    futureAppointments?: { id: number }[]
  } | null
  defaultDate?: Date | null
  defaultTeamId?: number
}

export function AppointmentFormModal({ isOpen, onClose, appointment, defaultDate, defaultTeamId }: Props) {
  const queryClient = useQueryClient()
  const { isCoach } = useAuthStore()
  const isEdit = !!appointment
  const isRecurring = !!(
    (appointment?.repeatingPattern && appointment.repeatingPattern.repeatingFrequency > 0) ||
    appointment?.parentAppointment ||
    (appointment?.futureAppointments?.length ?? 0) > 0
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [useCustomLocation, setUseCustomLocation] = useState(false)
  const [savingPlace, setSavingPlace] = useState(false)
  // 'form' = show form, 'chain-edit' = ask single/all for save, 'chain-delete' = ask single/all for delete
  const [step, setStep] = useState<'form' | 'chain-edit' | 'chain-delete'>('form')
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const { data: places } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const { data: trainings } = useQuery({ queryKey: ['trainings'], queryFn: trainingsApi.getAll })

  const sortedTrainings = useMemo(() => {
    if (!trainings) return []
    return [...trainings].sort((a, b) => a.name.localeCompare(b.name, 'cs'))
  }, [trainings])

  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  const toLocalDate = (iso: string) => {
    const d = new Date(iso)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60000)
    return local.toISOString().slice(0, 10)
  }

  const getDefaults = (): FormData => {
    if (appointment) {
      const rp = appointment.repeatingPattern
      return {
        name: appointment.name ?? '',
        description: appointment.description ?? '',
        start: toLocalDatetime(appointment.start),
        end: toLocalDatetime(appointment.end),
        appointmentType: appointment.appointmentType ?? 0,
        teamId: appointment.teamId ?? 0,
        locationId: appointment.locationId ?? 0,
        locationName: '',
        trainingId: appointment.trainingId ?? 0,
        repeatingFrequency: rp?.repeatingFrequency ?? 0,
        repeatingInterval: rp?.interval ?? 1,
        repeatUntil: rp?.endDate ? toLocalDate(rp.endDate) : '',
      }
    }
    const base = defaultDate ?? new Date()
    const y = base.getFullYear()
    const m = String(base.getMonth() + 1).padStart(2, '0')
    const d = String(base.getDate()).padStart(2, '0')
    return {
      name: '',
      description: '',
      start: `${y}-${m}-${d}T17:00`,
      end: `${y}-${m}-${d}T18:30`,
      appointmentType: 0,
      teamId: isCoach ? (defaultTeamId ?? 0) : 0,
      locationId: 0,
      locationName: '',
      trainingId: 0,
      repeatingFrequency: 0,
      repeatingInterval: 1,
      repeatUntil: '',
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: getDefaults(),
  })

  useEffect(() => {
    if (isOpen) {
      reset(getDefaults())
      setSaveError(null)
      setUseCustomLocation(false)
      setStep('form')
      setPendingFormData(null)
    }
  }, [isOpen, appointment, defaultTeamId])

  const customLocationName = watch('locationName')
  const appointmentType = watch('appointmentType')
  const repeatingFrequency = watch('repeatingFrequency')
  const isRepeating = Number(repeatingFrequency) !== 0

  const buildBody = (data: FormData) => {
    const teamId = Number(data.teamId) || null
    const locationId = Number(data.locationId)
    const aptType = Number(data.appointmentType)
    const trainingId = aptType === 0 && data.trainingId && Number(data.trainingId) > 0
      ? Number(data.trainingId)
      : null
    const freq = Number(data.repeatingFrequency)

    const body: Record<string, unknown> = {
      start: new Date(data.start).toISOString(),
      end: new Date(data.end).toISOString(),
      appointmentType: aptType,
      locationId,
    }

    if (teamId) body.teamId = teamId
    if (data.name?.trim()) body.name = data.name.trim()
    if (data.description?.trim()) body.description = data.description.trim()
    if (trainingId) body.trainingId = trainingId

    if (freq !== 0) {
      body.repeatingPattern = {
        repeatingFrequency: freq,
        interval: Number(data.repeatingInterval) || 1,
        startDate: new Date(data.start).toISOString(),
        endDate: data.repeatUntil ? new Date(data.repeatUntil).toISOString() : undefined,
      }
    }

    return body
  }

  const doSave = (data: FormData, updateWholeChain: boolean) => {
    const body = buildBody(data)
    if (isEdit) {
      body.id = appointment!.id
      return apiClient.put('/appointments', body, {
        params: updateWholeChain ? { updateWholeChain: true } : undefined,
      })
    }
    return apiClient.post('/appointments', body)
  }

  const mutation = useMutation({
    mutationFn: ({ data, updateWholeChain }: { data: FormData; updateWholeChain: boolean }) =>
      doSave(data, updateWholeChain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string }
      const responseData = axiosErr?.response?.data
      let msg = 'Uložení selhalo.'

      if (responseData && typeof responseData === 'object') {
        const d = responseData as Record<string, unknown>
        if (Array.isArray(d.errors)) {
          msg = (d.errors as string[]).join(', ')
        } else if (typeof d.message === 'string') {
          msg = d.message
        } else if (typeof d.details === 'string') {
          msg = d.details
        }
      }

      if (axiosErr?.response?.status) {
        msg += ` (HTTP ${axiosErr.response.status})`
      }

      console.error('Appointment save error:', axiosErr?.response?.status, responseData)
      setSaveError(msg)
      setStep('form')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (alsoFuture: boolean) =>
      apiClient.delete('/appointments', {
        data: appointment!.id,
        params: alsoFuture ? { alsoFutureAppointments: true } : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: () => { setSaveError('Smazání selhalo.'); setStep('form') },
  })

  const onFormSubmit = (data: FormData) => {
    setSaveError(null)
    if (isEdit && isRecurring) {
      setPendingFormData(data)
      setStep('chain-edit')
      return
    }
    mutation.mutate({ data, updateWholeChain: false })
  }

  const handleDelete = () => {
    if (isRecurring) {
      setStep('chain-delete')
    } else {
      if (confirm('Opravdu smazat tuto událost?')) deleteMutation.mutate(false)
    }
  }

  const handleSavePlace = async () => {
    if (!customLocationName?.trim()) return
    setSavingPlace(true)
    try {
      const newPlace = await placesApi.create({ name: customLocationName.trim(), width: 0, length: 0 })
      await queryClient.invalidateQueries({ queryKey: ['places'] })
      setValue('locationId', newPlace.id)
      setValue('locationName', '')
      setUseCustomLocation(false)
    } catch {
      setSaveError('Nepodařilo se uložit místo.')
    } finally {
      setSavingPlace(false)
    }
  }

  const locationError = errors.locationId?.message
  const selectClass = 'h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

  // ── Chain choice dialogs ───────────────────────────────────────────────
  if (step === 'chain-edit') {
    return (
      <Modal isOpen={isOpen} onClose={() => { setStep('form'); }} title="Upravit opakující se událost" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tato událost se opakuje. Jak chcete uložit změny?
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => pendingFormData && mutation.mutate({ data: pendingFormData, updateWholeChain: false })}
              loading={mutation.isPending}
              className="justify-center"
            >
              Jen tento výskyt
            </Button>
            <Button
              variant="outline"
              onClick={() => pendingFormData && mutation.mutate({ data: pendingFormData, updateWholeChain: true })}
              loading={mutation.isPending}
              className="justify-center"
            >
              Tento a všechny budoucí
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep('form')} className="w-full">
            Zpět k úpravám
          </Button>
          {saveError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </div>
      </Modal>
    )
  }

  if (step === 'chain-delete') {
    return (
      <Modal isOpen={isOpen} onClose={() => { setStep('form'); }} title="Smazat opakující se událost" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tato událost se opakuje. Co chcete smazat?
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(false)}
              loading={deleteMutation.isPending}
              className="justify-center"
            >
              Jen tento výskyt
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(true)}
              loading={deleteMutation.isPending}
              className="justify-center"
            >
              Tento a všechny budoucí
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep('form')} className="w-full">
            Zpět
          </Button>
          {saveError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </div>
      </Modal>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Upravit událost' : 'Nová událost'} maxWidth="lg">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Název"
          placeholder="např. Trénink juniorů"
          {...register('name')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Začátek"
            type="datetime-local"
            error={errors.start?.message}
            {...register('start')}
          />
          <Input
            label="Konec"
            type="datetime-local"
            error={errors.end?.message}
            {...register('end')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Typ události</label>
            <select className={selectClass} {...register('appointmentType')}>
              {appointmentTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {isCoach ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Tým <span className="text-xs text-gray-400">(volitelné)</span>
              </label>
              <select
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                {...register('teamId')}
              >
                <option value={0}>-- osobní událost --</option>
                {teams?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tým</label>
              <p className="flex h-9 items-center px-3 text-sm text-gray-500 rounded-lg border border-gray-200 bg-gray-50">Osobní událost</p>
              <input type="hidden" {...register('teamId')} value={0} />
            </div>
          )}
        </div>

        {/* Training selector */}
        {Number(appointmentType) === 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Trénink</label>
            <select className={selectClass} {...register('trainingId')}>
              <option value={0}>-- bez tréninku --</option>
              {sortedTrainings.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Location */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Místo</label>
            <button
              type="button"
              onClick={() => setUseCustomLocation(!useCustomLocation)}
              className="text-xs text-sky-600 hover:text-sky-800"
            >
              {useCustomLocation ? 'Vybrat z nabídky' : 'Zadat ručně'}
            </button>
          </div>
          {useCustomLocation ? (
            <div className="space-y-1">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input placeholder="Název místa" {...register('locationName')} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSavePlace}
                  loading={savingPlace}
                  disabled={!customLocationName?.trim()}
                  className="mt-auto h-9 shrink-0"
                >
                  <Save className="h-3.5 w-3.5" />
                  Uložit místo
                </Button>
              </div>
              {locationError && <p className="text-xs text-red-500">Nejprve uložte místo tlačítkem výše</p>}
            </div>
          ) : (
            <>
              <select
                className={`h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${locationError ? 'border-red-400' : 'border-gray-300 focus:border-sky-500'}`}
                {...register('locationId')}
              >
                <option value={0}>-- vyberte --</option>
                {places?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {locationError && <p className="text-xs text-red-500">{locationError}</p>}
            </>
          )}
        </div>

        {/* Repeating pattern */}
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Repeat className="h-3.5 w-3.5" />
            Opakování
          </label>
          <select className={selectClass} {...register('repeatingFrequency')}>
            {frequencyOptions.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {isRepeating && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Každých N {intervalLabels[Number(repeatingFrequency)] ?? ''}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  error={errors.repeatingInterval?.message}
                  {...register('repeatingInterval')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Opakovat do</label>
                <Input
                  type="date"
                  {...register('repeatUntil')}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {Number(repeatingFrequency) === 1 && `Každý${Number(watch('repeatingInterval')) > 1 ? `ch ${watch('repeatingInterval')}` : ''} den`}
              {Number(repeatingFrequency) === 2 && `Každý${Number(watch('repeatingInterval')) > 1 ? `ch ${watch('repeatingInterval')}` : ''} týden`}
              {Number(repeatingFrequency) === 3 && `Každý${Number(watch('repeatingInterval')) > 1 ? `ch ${watch('repeatingInterval')}` : ''} měsíc`}
              {Number(repeatingFrequency) === 4 && `Každý${Number(watch('repeatingInterval')) > 1 ? `ch ${watch('repeatingInterval')}` : ''} rok`}
              {watch('repeatUntil') ? ` do ${watch('repeatUntil')}` : ' (bez konce)'}
            </p>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Popis</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            rows={2}
            placeholder="Volitelný popis události"
            {...register('description')}
          />
        </div>

        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <div>
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleteMutation.isPending}
              >
                Smazat
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Zrušit
            </Button>
            <Button type="submit" loading={isSubmitting || mutation.isPending}>
              {isEdit ? 'Uložit' : 'Vytvořit'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
