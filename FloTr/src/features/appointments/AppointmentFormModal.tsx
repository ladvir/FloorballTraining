import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Save, Repeat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { placesApi, seasonsApi, teamsApi, testDefinitionsApi } from '../../api/index'
import { apiClient } from '../../api/axios'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import { useConfirm } from '../../store/confirmStore'

const TESTING_TYPE = 8

type FormData = {
  name?: string
  description?: string
  start: string
  end: string
  appointmentType: number
  teamId?: number
  locationId: number
  locationName?: string
  trainingId?: number
  repeatingFrequency: number
  repeatingInterval?: number
  repeatUntil?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  appointment?: {
    id: number
    name?: string
    description?: string
    start: string
    end: string
    appointmentType?: number
    teamId?: number
    locationId?: number
    trainingId?: number
    repeatingPattern?: {
      repeatingFrequency: number
      interval: number
      startDate: string
      endDate?: string
    }
    parentAppointment?: { id: number }
    futureAppointments?: { id: number }[]
    testDefinitionIds?: number[]
    tests?: { id: number; name: string }[]
    memberAssignments?: { memberId: number }[]
  } | null
  defaultDate?: Date | null
  defaultTeamId?: number
  defaultAppointmentType?: number
  defaultTestIds?: number[]
}

export function AppointmentFormModal({
  isOpen,
  onClose,
  appointment,
  defaultDate,
  defaultTeamId,
  defaultAppointmentType,
  defaultTestIds,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user, isHeadCoach, isCoach, activeClubId } = useAuthStore()
  const isEdit = !!appointment
  const isRecurring = !!(
    (appointment?.repeatingPattern && appointment.repeatingPattern.repeatingFrequency > 0) ||
    appointment?.parentAppointment ||
    (appointment?.futureAppointments?.length ?? 0) > 0
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const confirm = useConfirm()
  const [useCustomLocation, setUseCustomLocation] = useState(false)
  const [savingPlace, setSavingPlace] = useState(false)
  // 'form' = show form, 'chain-edit' = ask single/all for save, 'chain-delete' = ask single/all for delete
  const [step, setStep] = useState<'form' | 'chain-edit' | 'chain-delete'>('form')
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])

  const appointmentTypes = useMemo(
    () => [
      { value: 0, label: t('appointments.typeTraining') },
      { value: 1, label: t('appointments.typeCamp') },
      { value: 2, label: t('appointments.typePromotion') },
      { value: 3, label: t('appointments.typeMatch') },
      { value: 4, label: t('appointments.typeOther') },
      { value: 5, label: t('appointments.typeWorkshop') },
      { value: 6, label: t('appointments.typeOrganizing') },
      { value: 7, label: t('appointments.typePreperation') },
      { value: 8, label: t('appointments.typeTesting') },
    ],
    [t]
  )

  const frequencyOptions = useMemo(
    () => [
      { value: 0, label: t('appointments.freqOnce') },
      { value: 1, label: t('appointments.freqDaily') },
      { value: 2, label: t('appointments.freqWeekly') },
      { value: 3, label: t('appointments.freqMonthly') },
      { value: 4, label: t('appointments.freqYearly') },
    ],
    [t]
  )

  const intervalLabels: Record<number, string> = useMemo(
    () => ({
      1: t('appointments.intervalDays'),
      2: t('appointments.intervalWeeks'),
      3: t('appointments.intervalMonths'),
      4: t('appointments.intervalYears'),
    }),
    [t]
  )

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        start: z.string().min(1, t('appointments.validationStart')),
        end: z.string().min(1, t('appointments.validationEnd')),
        appointmentType: z.coerce.number(),
        teamId: z.coerce.number().optional(),
        locationId: z.coerce.number().min(1, t('appointments.validationPlace')),
        locationName: z.string().optional(),
        trainingId: z.coerce.number().optional(),
        repeatingFrequency: z.coerce.number(),
        repeatingInterval: z.coerce.number().min(1).max(52).optional(),
        repeatUntil: z.string().optional(),
      }),
    [t]
  )

  const { data: places } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const { data: trainings } = useQuery({ queryKey: ['trainings'], queryFn: trainingsApi.getAll })
  const { data: seasons } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })
  const { data: testDefinitions } = useQuery({
    queryKey: ['testDefinitions', activeClubId],
    queryFn: () => testDefinitionsApi.getAll({ clubId: activeClubId || undefined }),
  })

  const sortedTests = useMemo(() => {
    if (!testDefinitions) return []
    return [...testDefinitions].sort((a, b) => a.name.localeCompare(b.name, 'cs'))
  }, [testDefinitions])

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
      appointmentType: defaultAppointmentType ?? 0,
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
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const initialTestIds =
        appointment?.testDefinitionIds ??
        appointment?.tests?.map((t) => t.id) ??
        defaultTestIds ??
        []
      setSelectedTestIds(initialTestIds)
      setSelectedMemberIds(appointment?.memberAssignments?.map((a) => a.memberId) ?? [])
    }
  }, [isOpen, appointment, defaultTeamId, defaultTestIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const customLocationName = watch('locationName')
  const appointmentType = watch('appointmentType')
  const repeatingFrequency = watch('repeatingFrequency')
  const watchedTeamId = Number(watch('teamId')) || null

  const { data: selectedTeam } = useQuery({
    queryKey: ['team', watchedTeamId],
    queryFn: () => teamsApi.getById(watchedTeamId!),
    enabled: isCoach && !!watchedTeamId,
    staleTime: 60_000,
  })

  const teamMembers = useMemo(
    () =>
      selectedTeam?.teamMembers
        ?.filter((tm) => tm.member && !tm.isCoach)
        .map((tm) => ({
          memberId: tm.memberId,
          firstName: tm.member!.firstName ?? '',
          lastName: tm.member!.lastName ?? '',
        }))
        .sort((a, b) => a.lastName.localeCompare(b.lastName, 'cs')) ?? [],
    [selectedTeam]
  )
  const isRepeating = Number(repeatingFrequency) !== 0
  const watchStart = watch('start')

  const matchingSeason = useMemo(() => {
    if (!seasons || !watchStart) return null
    const date = watchStart.slice(0, 10)
    return (
      seasons.find((s) => s.startDate.slice(0, 10) <= date && date <= s.endDate.slice(0, 10)) ??
      null
    )
  }, [seasons, watchStart])

  const availableTeams = useMemo(() => {
    if (!teams || !matchingSeason) return []
    const byRole = teams.filter((t) => isHeadCoach || (user?.coachTeamIds ?? []).includes(t.id))
    // Use the team's own seasonId rather than matchingSeason.teams, which is not
    // populated by the seasons list endpoint and is always undefined in practice.
    return byRole.filter((t) => t.seasonId === matchingSeason.id)
  }, [teams, matchingSeason, isHeadCoach, user])

  const buildBody = (data: FormData) => {
    const teamId = Number(data.teamId) || null
    const locationId = Number(data.locationId)
    const aptType = Number(data.appointmentType)
    const trainingId =
      aptType === 0 && data.trainingId && Number(data.trainingId) > 0
        ? Number(data.trainingId)
        : null
    const freq = Number(data.repeatingFrequency)

    const body: Record<string, unknown> = {
      start: data.start,
      end: data.end,
      appointmentType: aptType,
      locationId,
    }

    if (teamId) body.teamId = teamId
    if (data.name?.trim()) body.name = data.name.trim()
    if (data.description?.trim()) body.description = data.description.trim()
    if (trainingId) body.trainingId = trainingId
    body.testDefinitionIds = aptType === TESTING_TYPE ? selectedTestIds : []
    body.assignedMemberIds = teamId ? selectedMemberIds : []

    if (freq !== 0) {
      body.repeatingPattern = {
        repeatingFrequency: freq,
        interval: Number(data.repeatingInterval) || 1,
        startDate: data.start,
        endDate: data.repeatUntil || undefined,
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
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['appointment', appointment!.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string }
      const responseData = axiosErr?.response?.data
      let msg = t('appointments.formSaveFailed')

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
      queryClient.invalidateQueries({ queryKey: ['appointment', appointment!.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: () => {
      setSaveError(t('appointments.formDeleteFailed'))
      setStep('form')
    },
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
      confirm(t('appointments.deleteEvent'), () => deleteMutation.mutate(false))
    }
  }

  const handleSavePlace = async () => {
    if (!customLocationName?.trim()) return
    setSavingPlace(true)
    try {
      const newPlace = await placesApi.create({
        name: customLocationName.trim(),
        width: 0,
        length: 0,
      })
      await queryClient.invalidateQueries({ queryKey: ['places'] })
      setValue('locationId', newPlace.id)
      setValue('locationName', '')
      setUseCustomLocation(false)
    } catch {
      setSaveError(t('appointments.formPlaceSaveFailed'))
    } finally {
      setSavingPlace(false)
    }
  }

  const locationError = errors.locationId?.message
  const selectClass =
    'h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

  const memberCountLabel = () => {
    const n = selectedMemberIds.length
    if (n === 1) return t('appointments.formSelectedMember', { count: 1 })
    if (n < 5) return t('appointments.formSelectedMembers2', { count: n })
    return t('appointments.formSelectedMembers5', { count: n })
  }

  // ── Chain choice dialogs ───────────────────────────────────────────────
  if (step === 'chain-edit') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setStep('form')
        }}
        title={t('appointments.chainEditTitle')}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t('appointments.chainEditMsg')}</p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() =>
                pendingFormData &&
                mutation.mutate({ data: pendingFormData, updateWholeChain: false })
              }
              loading={mutation.isPending}
              className="justify-center"
            >
              {t('appointments.chainThisOnly')}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                pendingFormData &&
                mutation.mutate({ data: pendingFormData, updateWholeChain: true })
              }
              loading={mutation.isPending}
              className="justify-center"
            >
              {t('appointments.chainThisAndFuture')}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep('form')} className="w-full">
            {t('appointments.chainBackToEdit')}
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
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setStep('form')
        }}
        title={t('appointments.chainDeleteTitle')}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t('appointments.chainDeleteMsg')}</p>
          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(false)}
              loading={deleteMutation.isPending}
              className="justify-center"
            >
              {t('appointments.chainThisOnly')}
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(true)}
              loading={deleteMutation.isPending}
              className="justify-center"
            >
              {t('appointments.chainThisAndFuture')}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep('form')} className="w-full">
            {t('common.back')}
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('appointments.editEvent') : t('appointments.newEvent')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label={t('appointments.formName')}
          placeholder={t('appointments.formNamePlaceholder')}
          {...register('name')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('appointments.formStart')}
            type="datetime-local"
            step="60"
            error={errors.start?.message}
            {...register('start')}
          />
          <Input
            label={t('appointments.formEnd')}
            type="datetime-local"
            step="60"
            error={errors.end?.message}
            {...register('end')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {t('appointments.formType')}
            </label>
            <select className={selectClass} {...register('appointmentType')}>
              {appointmentTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {isCoach ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {t('appointments.formTeam')}{' '}
                <span className="text-xs text-gray-400">
                  (
                  {t('appointments.formTeamOptional').split('(')[1]?.replace(')', '') ??
                    'volitelné'}
                  )
                </span>
              </label>
              <select
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                {...register('teamId')}
              >
                <option value={0}>{t('appointments.formPersonalEventOption')}</option>
                {availableTeams.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
              {!matchingSeason && watchStart && (
                <p className="text-xs text-amber-600">{t('appointments.formNoSeasonWarning')}</p>
              )}
              {matchingSeason && availableTeams.length === 0 && (
                <p className="text-xs text-gray-500">{t('appointments.formNoTeamWarning')}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {t('appointments.formTeam')}
              </label>
              <p className="flex h-9 items-center px-3 text-sm text-gray-500 rounded-lg border border-gray-200 bg-gray-50">
                {t('appointments.formTeamPersonalEvent')}
              </p>
              <input type="hidden" {...register('teamId')} value={0} />
            </div>
          )}
        </div>

        {/* Member assignment (coaches only, when team is selected) */}
        {isCoach && !!watchedTeamId && teamMembers.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {t('appointments.formAssign')}{' '}
              <span className="text-xs font-normal text-gray-400">
                (
                {t('appointments.formAssignOptional').split('(')[1]?.replace(')', '') ??
                  'volitelné'}
                )
              </span>
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {teamMembers.map((m) => (
                <label
                  key={m.memberId}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(m.memberId)}
                    onChange={(e) =>
                      setSelectedMemberIds((prev) =>
                        e.target.checked
                          ? [...prev, m.memberId]
                          : prev.filter((id) => id !== m.memberId)
                      )
                    }
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-gray-700">
                    {m.lastName} {m.firstName}
                  </span>
                </label>
              ))}
            </div>
            {selectedMemberIds.length > 0 && (
              <p className="text-xs text-gray-500">{memberCountLabel()}</p>
            )}
          </div>
        )}

        {/* Training selector */}
        {Number(appointmentType) === 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {t('appointments.formTraining')}
            </label>
            <select className={selectClass} {...register('trainingId')}>
              <option value={0}>{t('appointments.formTrainingNone')}</option>
              {sortedTrainings.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Test selector (Testing event) */}
        {Number(appointmentType) === TESTING_TYPE && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {t('appointments.formTests').split('(')[0].trim()}{' '}
              <span className="text-xs text-gray-400">
                ({t('appointments.formTests').match(/\(([^)]+)\)/)?.[1] ?? 'co se bude testovat'})
              </span>
            </label>
            {sortedTests.length === 0 ? (
              <p className="text-xs text-gray-500">{t('appointments.formTestsNone')}</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {sortedTests.map((tst) => (
                  <label
                    key={tst.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTestIds.includes(tst.id)}
                      onChange={(e) =>
                        setSelectedTestIds((prev) =>
                          e.target.checked ? [...prev, tst.id] : prev.filter((id) => id !== tst.id)
                        )
                      }
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-gray-700">{tst.name}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedTestIds.length > 0 && (
              <p className="text-xs text-gray-500">
                {t('appointments.formTestsSelected', { count: selectedTestIds.length })}
              </p>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('appointments.formPlace')}
            </label>
            <button
              type="button"
              onClick={() => setUseCustomLocation(!useCustomLocation)}
              className="text-xs text-sky-600 hover:text-sky-800"
            >
              {useCustomLocation
                ? t('appointments.formPlaceSelect')
                : t('appointments.formPlaceManual')}
            </button>
          </div>
          {useCustomLocation ? (
            <div className="space-y-1">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={t('appointments.formPlaceName')}
                    {...register('locationName')}
                  />
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
                  {t('appointments.formSavePlace')}
                </Button>
              </div>
              {locationError && (
                <p className="text-xs text-red-500">{t('appointments.formPlaceError')}</p>
              )}
            </div>
          ) : (
            <>
              <select
                className={`h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${locationError ? 'border-red-400' : 'border-gray-300 focus:border-sky-500'}`}
                {...register('locationId')}
              >
                <option value={0}>{t('appointments.formPlaceSelect0')}</option>
                {places?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
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
            {t('appointments.formRepeat')}
          </label>
          <select className={selectClass} {...register('repeatingFrequency')}>
            {frequencyOptions.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {isRepeating && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {t('appointments.formRepeatEvery')}{' '}
                  {intervalLabels[Number(repeatingFrequency)] ?? ''}
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
                <label className="text-sm font-medium text-gray-700">
                  {t('appointments.formRepeatUntil')}
                </label>
                <Input type="date" {...register('repeatUntil')} />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {Number(repeatingFrequency) === 1 &&
                (Number(watch('repeatingInterval')) > 1
                  ? t('appointments.repeatSummaryDayN', { n: watch('repeatingInterval') })
                  : t('appointments.repeatSummaryDay', { s: '' }))}
              {Number(repeatingFrequency) === 2 &&
                (Number(watch('repeatingInterval')) > 1
                  ? t('appointments.repeatSummaryWeekN', { n: watch('repeatingInterval') })
                  : t('appointments.repeatSummaryWeek', { s: '' }))}
              {Number(repeatingFrequency) === 3 &&
                (Number(watch('repeatingInterval')) > 1
                  ? t('appointments.repeatSummaryMonthN', { n: watch('repeatingInterval') })
                  : t('appointments.repeatSummaryMonth', { s: '' }))}
              {Number(repeatingFrequency) === 4 &&
                (Number(watch('repeatingInterval')) > 1
                  ? t('appointments.repeatSummaryYearN', { n: watch('repeatingInterval') })
                  : t('appointments.repeatSummaryYear', { s: '' }))}
              {watch('repeatUntil')
                ? t('appointments.repeatSummaryUntil', { date: watch('repeatUntil') })
                : ` ${t('appointments.repeatNoEnd')}`}
            </p>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {t('appointments.formDescription')}
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            rows={2}
            placeholder={t('appointments.formDescriptionPlaceholder')}
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
                {t('common.delete')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting || mutation.isPending}>
              {isEdit ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
