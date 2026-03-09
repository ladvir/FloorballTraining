import { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ValidationResultModal } from './ValidationResultModal'
import { ScheduleTrainingModal } from './ScheduleTrainingModal'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, GripVertical, Plus, Trash2, AlertTriangle, CheckCircle, FileDown, ShieldCheck, CalendarPlus, ChevronDown } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { trainingsApi } from '../../api/trainings.api'
import { activitiesApi } from '../../api/activities.api'
import { tagsApi, teamsApi, ageGroupsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TrainingPartDto, TrainingGroupDto, ActivityDto, ActivityMediaDto, TagDto } from '../../types/domain.types'

function getImageSrc(media: ActivityMediaDto): string | null {
  if (media.preview) return media.preview
  if (media.data?.startsWith('data:image')) return media.data
  return null
}

// ── Schema ────────────────────────────────────────────────────────────────────

const groupSchema = z.object({
  id: z.number(),
  activityId: z.number().nullable().optional(),
})

function makeSchema(maxDuration = 120, maxPartDuration = 40) {
  const partSchema = z.object({
    id: z.number(),
    name: z.string().min(1, 'Název části je povinný'),
    description: z.string().optional(),
    duration: z.coerce.number({ invalid_type_error: 'Zadejte číslo' }).min(1, 'Min. 1 min').max(maxPartDuration, `Max. ${maxPartDuration} min`),
    order: z.number(),
    trainingGroups: z.array(groupSchema).default([]),
  })
  return z.object({
    name: z.string().min(1, 'Název tréninku je povinný'),
    duration: z.coerce.number({ invalid_type_error: 'Zadejte číslo' }).min(0).max(maxDuration).optional().or(z.literal('')),
    trainingGoal1Id: z.number().nullable().optional(),
    trainingGoal2Id: z.number().nullable().optional(),
    trainingGoal3Id: z.number().nullable().optional(),
    trainingParts: z.array(partSchema),
    personsMin: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
    personsMax: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
    environment: z.number().min(0).max(2),
    trainingAgeGroupIds: z.array(z.number()),
  })
}

type FormData = z.infer<ReturnType<typeof makeSchema>>

// ── Activity picker ───────────────────────────────────────────────────────────

function ActivityPicker({
  value,
  onChange,
  activities,
}: {
  value: number | null | undefined
  onChange: (id: number | null) => void
  activities: ActivityDto[]
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (name: string) => activitiesApi.create({ name }),
    onSuccess: (newActivity) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      onChange(newActivity.id)
      setOpen(false)
    },
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = activities.find((a) => a.id === value)
  const filtered = activities
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
  const trimmed = search.trim()
  const canCreate = trimmed.length > 0
    && !activities.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:border-sky-300 focus:border-sky-400 focus:outline-none"
      >
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected?.name ?? '— Bez aktivity —'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              type="text"
              placeholder="Hledat aktivitu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-400 hover:bg-gray-50"
            >
              — Bez aktivity —
            </button>
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onChange(a.id); setOpen(false) }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-sky-50 ${
                  value === a.id ? 'bg-sky-50 font-medium text-sky-700' : 'text-gray-700'
                }`}
              >
                {a.name}
              </button>
            ))}
            {filtered.length === 0 && trimmed && !canCreate && (
              <p className="px-3 py-2 text-sm text-gray-400">Nic nenalezeno</p>
            )}
            {canCreate && (
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate(trimmed)}
                className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-sky-600 hover:bg-sky-50 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                {createMutation.isPending ? 'Vytváření…' : `Vytvořit „${trimmed}"`}
              </button>
            )}
            {createMutation.isError && (
              <p className="px-3 pb-2 text-xs text-red-500">Nepodařilo se vytvořit aktivitu.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sortable part row ─────────────────────────────────────────────────────────

function SortablePartRow({
  id,
  index,
  register,
  errors,
  onRemove,
  control,
  allActivities,
  setValue,
  showImages,
  showAllImages,
}: {
  id: number
  index: number
  register: ReturnType<typeof useForm<FormData>>['register']
  errors: ReturnType<typeof useForm<FormData>>['formState']['errors']
  onRemove: () => void
  control: ReturnType<typeof useForm<FormData>>['control']
  allActivities: ActivityDto[]
  setValue: ReturnType<typeof useForm<FormData>>['setValue']
  showImages: boolean
  showAllImages: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: `trainingParts.${index}.trainingGroups` as any,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupValues = useWatch({ control, name: `trainingParts.${index}.trainingGroups` as any }) as Array<{ activityId?: number | null }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPartName = useWatch({ control, name: `trainingParts.${index}.name` as any }) as string

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasMultiple = groupFields.length > 1

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-gray-200 bg-white">
      {/* Part header row */}
      <div className="flex items-start gap-2 p-2">
        <button
          type="button"
          className="mt-2 cursor-grab touch-none text-gray-300 hover:text-gray-500"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex flex-1 gap-2">
          <div className="flex-1">
            <Input
              placeholder="Název části (např. Rozcvička)"
              error={errors.trainingParts?.[index]?.name?.message}
              {...register(`trainingParts.${index}.name`)}
            />
          </div>
          <div className="w-24">
            <Input
              placeholder="min"
              type="number"
              min={1}
              max={120}
              error={errors.trainingParts?.[index]?.duration?.message}
              {...register(`trainingParts.${index}.duration`)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Groups */}
      <div className="space-y-1.5 border-t border-gray-100 px-3 pb-2 pt-2 ml-7">
        {groupFields.map((gField, gIndex) => {
          const activityId = groupValues?.[gIndex]?.activityId
          const activityName = activityId != null ? allActivities.find((a) => a.id === activityId)?.name : undefined
          const activityImages = (() => {
            if (!showImages || activityId == null) return []
            const activity = allActivities.find((a) => a.id === activityId)
            const allImgs = (activity?.activityMedium ?? [])
              .filter((m) => m.mediaType === 0)
              .map((m) => ({ ...m, src: getImageSrc(m) }))
              .filter((m): m is typeof m & { src: string } => m.src != null)
            if (showAllImages) return allImgs
            const thumb = allImgs.find((m) => m.isThumbnail)
            return thumb ? [thumb] : allImgs.slice(0, 1)
          })()

          return (
          <div key={gField.id} className="space-y-1">
            <div className="flex items-center gap-2">
            {hasMultiple && (
              <span className="w-5 flex-shrink-0 text-center text-xs font-medium text-gray-400">
                {String.fromCharCode(65 + gIndex)}
              </span>
            )}
            <Controller
              control={control}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              name={`trainingParts.${index}.trainingGroups.${gIndex}.activityId` as any}
              render={({ field }) => (
                <ActivityPicker
                  value={field.value as number | null | undefined}
                  onChange={(actId) => {
                    field.onChange(actId)
                    if (!currentPartName?.trim() && actId != null) {
                      const name = allActivities.find((a) => a.id === actId)?.name
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      if (name) setValue(`trainingParts.${index}.name` as any, name)
                    }
                  }}
                  activities={allActivities}
                />
              )}
            />
            {activityName && (
              <button
                type="button"
                title={`Použít „${activityName}" jako název části`}
                onClick={() => setValue(`trainingParts.${index}.name`, activityName)}
                className="flex-shrink-0 rounded px-1.5 py-1 text-xs text-gray-400 hover:bg-sky-50 hover:text-sky-600"
              >
                ← název
              </button>
            )}
            {hasMultiple && (
              <button
                type="button"
                onClick={() => removeGroup(gIndex)}
                className="flex-shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            </div>
            {activityImages.length > 0 && (
              <div className={`flex flex-wrap gap-2 pb-0.5 ${hasMultiple ? 'ml-5' : ''}`}>
                {activityImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.src}
                    alt={img.name}
                    title={img.name}
                    className="h-28 w-auto max-w-xs rounded border border-gray-200 object-contain bg-white"
                  />
                ))}
              </div>
            )}
          </div>
          )
        })}
        <button
          type="button"
          onClick={() => appendGroup({ id: -(Date.now()), activityId: null } as any)}
          className="flex items-center gap-1 pt-0.5 text-xs text-sky-500 hover:text-sky-700"
        >
          <Plus className="h-3 w-3" />
          Přidat skupinu
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function TrainingFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showImages, setShowImages] = useState(true)
  const [showAllImages, setShowAllImages] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [validationResult, setValidationResult] = useState<{ isDraft: boolean; errors: string[]; name: string } | null>(null)
  const [fillDefaults, setFillDefaults] = useState<Array<{ label: string; key: keyof FormData; value: string | number | number[] }> | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  const handleDownloadPdf = async () => {
    if (!id || !existingTraining) return
    setDownloadingPdf(true)
    try {
      await trainingsApi.downloadPdf(Number(id), existingTraining.name)
    } finally {
      setDownloadingPdf(false)
    }
  }
  const queryClient = useQueryClient()

  const { data: existingTraining, isLoading: loadingTraining } = useQuery({
    queryKey: ['training', id],
    queryFn: () => trainingsApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  const { data: allAgeGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: allTrainings } = useQuery({ queryKey: ['trainings'], queryFn: trainingsApi.getAll })
  const { data: allActivities = [] } = useQuery({ queryKey: ['activities'], queryFn: activitiesApi.getAll })

  const { data: defaultTeam } = useQuery({
    queryKey: ['team', user?.defaultTeamId],
    queryFn: () => teamsApi.getById(user!.defaultTeamId!),
    enabled: !!user?.defaultTeamId,
  })

  const goalTags = useMemo(
    () => allTags?.filter((t) => t.isTrainingGoal) ?? [],
    [allTags]
  )

  const maxDuration = defaultTeam?.maxTrainingDuration ?? 120
  const maxPartDuration = defaultTeam?.maxTrainingPartDuration ?? 40
  const resolverRef = useRef(zodResolver(makeSchema(maxDuration, maxPartDuration)))
  useEffect(() => {
    resolverRef.current = zodResolver(makeSchema(maxDuration, maxPartDuration))
  }, [maxDuration, maxPartDuration])

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: (values, ctx, options) => resolverRef.current(values, ctx, options),
    defaultValues: {
      name: '', duration: '', trainingParts: [],
      trainingGoal1Id: null, trainingGoal2Id: null, trainingGoal3Id: null,
      personsMin: '' as const, personsMax: '' as const,
      environment: 1,
      trainingAgeGroupIds: [],
    },
  })

  const { fields, append, remove, move } = useFieldArray({ control, name: 'trainingParts' })

  // Pre-fill from existing training (edit mode)
  useEffect(() => {
    if (existingTraining) {
      reset({
        name: existingTraining.name,
        duration: existingTraining.duration || '',
        trainingGoal1Id: existingTraining.trainingGoal1?.id ?? null,
        trainingGoal2Id: existingTraining.trainingGoal2?.id ?? null,
        trainingGoal3Id: existingTraining.trainingGoal3?.id ?? null,
        trainingParts: (existingTraining.trainingParts ?? [])
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((p, i) => ({
            id: p.id || -(i + 1),
            name: p.name ?? '',
            description: p.description ?? '',
            duration: p.duration,
            order: p.order,
            trainingGroups: (p.trainingGroups && p.trainingGroups.length > 0)
              ? p.trainingGroups.map((g, gi) => ({ id: g.id || -(gi + 1), activityId: g.activity?.id ?? null }))
              : [{ id: -(i + 1) * 100, activityId: null }],
          })),
        personsMin: existingTraining.personsMin ?? '',
        personsMax: existingTraining.personsMax ?? '',
        environment: existingTraining.environment ?? 1,
        trainingAgeGroupIds: (existingTraining.trainingAgeGroups ?? []).map((ag) => ag.id),
      })
    }
  }, [existingTraining, reset])

  // Pre-fill from default team (create mode)
  useEffect(() => {
    if (!isEdit) {
      reset((prev) => ({
        ...prev,
        personsMin: defaultTeam?.personsMin ?? 15,
        personsMax: defaultTeam?.personsMax ?? 30,
        duration: defaultTeam?.defaultTrainingDuration ?? 90,
        environment: 1,
        trainingAgeGroupIds: defaultTeam?.ageGroupId ? [defaultTeam.ageGroupId] : [],
      }))
    }
  }, [defaultTeam, isEdit, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const findTag = (tagId: number | null | undefined): TagDto | undefined =>
        tagId != null ? goalTags.find((t) => t.id === tagId) : undefined

      const kdokolivId = allAgeGroups?.find((ag) => ag.name === 'Kdokoliv')?.id
      const ageGroupIds = data.trainingAgeGroupIds.length === 0 && kdokolivId != null
        ? [kdokolivId]
        : data.trainingAgeGroupIds

      const dto = {
        id: isEdit ? Number(id) : 0,
        name: data.name,
        duration: Number(data.duration) || 0,
        trainingGoal1: findTag(data.trainingGoal1Id),
        trainingGoal2: findTag(data.trainingGoal2Id),
        trainingGoal3: findTag(data.trainingGoal3Id),
        trainingParts: data.trainingParts.map((p, i) => ({
          id: p.id > 0 ? p.id : 0,
          name: p.name,
          description: p.description ?? '',
          duration: p.duration,
          order: i + 1,
          trainingGroups: (p.trainingGroups ?? []).map((g) => ({
            id: g.id > 0 ? g.id : 0,
            activity: g.activityId != null ? allActivities.find((a) => a.id === g.activityId) : undefined,
          })) as TrainingGroupDto[],
        })) as TrainingPartDto[],
        personsMin: data.personsMin !== '' ? Number(data.personsMin) : undefined,
        personsMax: data.personsMax !== '' ? Number(data.personsMax) : undefined,
        environment: data.environment,
        trainingAgeGroups: ageGroupIds.map((id) => ({ id, name: '', description: '' })),
      }
      return isEdit ? trainingsApi.update(Number(id), dto) : trainingsApi.create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['training', id] })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        navigate('/trainings')
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Uložení selhalo. Zkuste to prosím znovu.'
      setSaveError(msg)
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    },
  })

  const minPartsDurationPercent = defaultTeam?.minPartsDurationPercent ?? 95

  const validateMutation = useMutation({
    mutationFn: () => trainingsApi.validate(Number(id), minPartsDurationPercent),
    onSuccess: (data) => {
      // Update cached isDraft immediately so badge reflects new state
      queryClient.setQueryData(['training', id], (old: { isDraft: boolean } | undefined) =>
        old ? { ...old, isDraft: data.isDraft } : old
      )
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      setValidationResult({ ...data, name: existingTraining?.name ?? watch('name') })

      if (data.isDraft) {
        const current = getValues()
        const missing: Array<{ label: string; key: keyof FormData; value: string | number | number[] }> = []

        if (!Number(current.personsMin)) {
          const val = defaultTeam?.personsMin ?? 15
          missing.push({ label: `Minimální počet hráčů: ${val}`, key: 'personsMin', value: val })
        }
        if (!Number(current.personsMax)) {
          const val = defaultTeam?.personsMax ?? 30
          missing.push({ label: `Maximální počet hráčů: ${val}`, key: 'personsMax', value: val })
        }
        if (!Number(current.duration)) {
          const val = defaultTeam?.defaultTrainingDuration ?? 90
          missing.push({ label: `Délka tréninku: ${val} min`, key: 'duration', value: val })
        }
        if ((!current.trainingAgeGroupIds || current.trainingAgeGroupIds.length === 0) && defaultTeam?.ageGroupId) {
          const agName = allAgeGroups?.find((ag) => ag.id === defaultTeam.ageGroupId)?.name ?? `ID ${defaultTeam.ageGroupId}`
          missing.push({ label: `Věková kategorie: ${agName}`, key: 'trainingAgeGroupIds', value: [defaultTeam.ageGroupId] })
        }

        if (missing.length > 0) setFillDefaults(missing)
      }
    },
  })

  const handleConfirmFillDefaults = useCallback(() => {
    if (!fillDefaults) return
    fillDefaults.forEach(({ key, value }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(key, value as any)
    })
    setFillDefaults(null)
    handleSubmit((data) => { setSaveError(null); mutation.mutate(data) })()
  }, [fillDefaults, setValue, handleSubmit, mutation])

  // DnD
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      move(oldIndex, newIndex)
    }
  }

  // Live validation state
  const watchedParts = watch('trainingParts')
  const watchedDuration = watch('duration')
  const partsSum = watchedParts.reduce((s, p) => s + (Number(p.duration) || 0), 0)
  const totalDuration = Number(watchedDuration) || 0
  const minPartsSum = totalDuration > 0 ? Math.floor(minPartsDurationPercent / 100 * totalDuration) : 0
  const durationMismatch = totalDuration > 0 && watchedParts.length > 0
    && (partsSum > totalDuration || partsSum < minPartsSum)

  // Goal toggle helpers
  const watchGoal1 = watch('trainingGoal1Id')
  const watchGoal2 = watch('trainingGoal2Id')
  const watchGoal3 = watch('trainingGoal3Id')
  const selectedGoalIds = [watchGoal1, watchGoal2, watchGoal3].filter((x) => x != null) as number[]

  const isComplete = isEdit
    ? existingTraining?.isDraft === false
    : totalDuration > 0 && watchedParts.length > 0 && partsSum === totalDuration
      && watch('name').length > 0 && selectedGoalIds.length > 0

  // Goal coverage calculation (mirrors backend GetTrainingGoalActivitiesDuration)
  const GOAL_MIN_PERCENT = 25
  const goalMatchingDuration = watchedParts.reduce((sum, part) => {
    const hasMatch = (part.trainingGroups ?? []).some((g) => {
      if (!g.activityId) return false
      const activity = allActivities.find((a) => a.id === g.activityId)
      return activity?.activityTags?.some((at) => selectedGoalIds.includes(at.tagId)) ?? false
    })
    return hasMatch ? sum + (Number(part.duration) || 0) : sum
  }, 0)
  const requiredGoalDuration = totalDuration > 0 ? Math.floor((GOAL_MIN_PERCENT / 100) * totalDuration) : 0
  const goalPercent = totalDuration > 0 ? Math.round((goalMatchingDuration / totalDuration) * 100) : 0
  const meetsGoalCoverage = goalMatchingDuration >= requiredGoalDuration
  const showGoalProgress = selectedGoalIds.length > 0 && totalDuration > 0 && watchedParts.length > 0

  const watchEnvironment = watch('environment')
  const watchAgeGroupIds = watch('trainingAgeGroupIds')

  const toggleAgeGroup = useCallback((ageGroupId: number) => {
    const current = watchAgeGroupIds ?? []
    const next = current.includes(ageGroupId)
      ? current.filter((x) => x !== ageGroupId)
      : [...current, ageGroupId]
    setValue('trainingAgeGroupIds', next)
  }, [watchAgeGroupIds, setValue])

  const toggleGoal = useCallback((tagId: number) => {
    const slots = [
      { key: 'trainingGoal1Id' as const, val: watchGoal1 },
      { key: 'trainingGoal2Id' as const, val: watchGoal2 },
      { key: 'trainingGoal3Id' as const, val: watchGoal3 },
    ]
    const existing = slots.find((s) => s.val === tagId)
    if (existing) {
      setValue(existing.key, null)
    } else {
      const free = slots.find((s) => s.val == null)
      if (free) setValue(free.key, tagId)
    }
  }, [watchGoal1, watchGoal2, watchGoal3, setValue])

  const generateName = useCallback(() => {
    const goalNames = [watchGoal1, watchGoal2, watchGoal3]
      .filter((id): id is number => id != null)
      .map((id) => goalTags.find((t) => t.id === id)?.name)
      .filter((n): n is string => !!n)

    const ageNames = (watchAgeGroupIds ?? [])
      .map((id) => allAgeGroups?.find((ag) => ag.id === id)?.name)
      .filter((n): n is string => !!n && n !== 'Kdokoliv')

    const duration = Number(watch('duration')) || 0

    const mainPartName = watchedParts.length > 0
      ? [...watchedParts].sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0))[0]?.name?.trim() || ''
      : ''

    const parts: string[] = []
    if (mainPartName) parts.push(mainPartName)
    if (goalNames.length > 0) parts.push(goalNames.join(', '))
    if (ageNames.length > 0) parts.push(ageNames.join(', '))
    if (duration > 0) parts.push(`${duration} min`)

    const baseName = parts.join(' – ') || 'Nový trénink'

    const toRoman = (n: number): string => {
      const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
      const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']
      let result = ''
      for (let i = 0; i < vals.length; i++) {
        while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
      }
      return result
    }

    const otherTrainings = (allTrainings ?? []).filter((t) => t.id !== (isEdit ? Number(id) : 0))
    const basePattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( [IVXLCDM]+)?$`)
    const matches = otherTrainings.filter((t) => basePattern.test(t.name))

    if (matches.length === 0) {
      setValue('name', baseName)
    } else {
      setValue('name', `${baseName} ${toRoman(matches.length + 1)}`)
    }
  }, [watchGoal1, watchGoal2, watchGoal3, watchAgeGroupIds, watchedParts, goalTags, allAgeGroups, allTrainings, watch, setValue, isEdit, id])

  if (isEdit && loadingTraining) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/trainings')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Upravit trénink' : 'Nový trénink'}
          </h1>
          <div className="flex items-center gap-2">
            {isEdit && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleOpen(true)}
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Naplánovat
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={downloadingPdf}
                  onClick={handleDownloadPdf}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </>
            )}
            {isEdit ? (
              <button
                type="button"
                title="Spustit validaci tréninku"
                disabled={validateMutation.isPending}
                onClick={() => validateMutation.mutate()}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-75 disabled:opacity-50 ${
                  isComplete
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {validateMutation.isPending ? (
                  <ShieldCheck className="h-3.5 w-3.5 animate-pulse" />
                ) : isComplete ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {isComplete ? 'Kompletní' : 'Rozpracovaný'}
              </button>
            ) : isComplete ? (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle className="h-3.5 w-3.5" /> Kompletní
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Rozpracovaný
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Název tréninku"
                    placeholder="Název tréninku"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                </div>
                <button
                  type="button"
                  onClick={generateName}
                  title="Navrhnout název ze zaměření a věkové kategorie"
                  className="mb-[1px] flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors whitespace-nowrap"
                >
                  Navrhnout název
                </button>
              </div>
            </div>
            <Input
              label="Celková délka (min)"
              type="number"
              min={0}
              max={120}
              placeholder="např. 90"
              error={errors.duration?.message}
              {...register('duration')}
            />
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Zaměření (max 3)</p>
            <div className="flex flex-wrap gap-2">
              {goalTags.map((tag) => {
                const isSelected = selectedGoalIds.includes(tag.id)
                const canSelect = isSelected || selectedGoalIds.length < 3
                return (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={!canSelect}
                    onClick={() => toggleGoal(tag.id)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : canSelect
                        ? 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                        : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                )
              })}
              {goalTags.length === 0 && (
                <p className="text-sm text-gray-400">Žádné cíle nenalezeny</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Age groups */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Věkové kategorie</p>
            <div className="flex flex-wrap gap-2">
              {(allAgeGroups ?? []).map((ag) => {
                const isSelected = (watchAgeGroupIds ?? []).includes(ag.id)
                return (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => toggleAgeGroup(ag.id)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                    }`}
                  >
                    {ag.name}
                  </button>
                )
              })}
            </div>
            {(watchAgeGroupIds ?? []).length === 0 && (
              <p className="mt-2 text-xs text-gray-400">Žádná kategorie = trénink pro všechny</p>
            )}
          </CardContent>
        </Card>

        {/* Persons + Environment */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hráčů min."
                type="number"
                min={1}
                max={100}
                placeholder="např. 15"
                error={errors.personsMin?.message}
                {...register('personsMin')}
              />
              <Input
                label="Hráčů max."
                type="number"
                min={1}
                max={100}
                placeholder="např. 30"
                error={errors.personsMax?.message}
                {...register('personsMax')}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Prostředí</p>
              <div className="flex gap-2">
                {([
                  { value: 0, label: 'Kdekoli' },
                  { value: 1, label: 'Uvnitř' },
                  { value: 2, label: 'Venku' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('environment', value)}
                    className={`rounded-lg border px-4 py-1.5 text-sm transition-colors ${
                      watchEnvironment === value
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parts */}
        <Card>
          <CardContent className="py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Části tréninku</p>
                {watchedParts.length > 0 && (
                  <p className="text-xs text-gray-400">Součet: {partsSum} min</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showImages && (
                  <button
                    type="button"
                    onClick={() => setShowAllImages((v) => !v)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 transition-colors hover:border-sky-300 hover:text-sky-600"
                  >
                    {showAllImages ? 'Zobraz výchozí' : 'Zobraz vše'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowImages((v) => !v)}
                  className={`rounded border px-2 py-1 text-xs transition-colors ${
                    showImages
                      ? 'border-sky-400 bg-sky-50 text-sky-700'
                      : 'border-gray-200 text-gray-500 hover:border-sky-300 hover:text-sky-600'
                  }`}
                >
                  {showImages ? 'Skryj obrázky' : 'Zobraz obrázky'}
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ id: -(fields.length + 1), name: '', description: '', duration: 10, order: fields.length + 1, trainingGroups: [{ id: -Date.now(), activityId: null }] })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Přidat část
                </Button>
              </div>
            </div>

            {showGoalProgress && (
              <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-600">Pokrytí zaměřením</span>
                  <span className={meetsGoalCoverage ? 'font-medium text-green-600' : 'text-orange-600'}>
                    {goalMatchingDuration} / {totalDuration} min ({goalPercent}&nbsp;%)
                    {meetsGoalCoverage && <CheckCircle className="ml-1 inline h-3 w-3" />}
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${meetsGoalCoverage ? 'bg-green-400' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(goalPercent, 100)}%` }}
                  />
                  {/* 25% threshold marker */}
                  <div
                    className="absolute top-0 h-2 w-px bg-gray-500"
                    style={{ left: `${GOAL_MIN_PERCENT}%` }}
                    title={`Minimální pokrytí ${GOAL_MIN_PERCENT}%`}
                  />
                </div>
                {!meetsGoalCoverage && requiredGoalDuration > 0 && (
                  <p className="mt-1 text-xs text-orange-500">
                    Potřeba alespoň {requiredGoalDuration} min aktivit se štítky zaměření ({GOAL_MIN_PERCENT}&nbsp;%)
                  </p>
                )}
              </div>
            )}

            {durationMismatch && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {partsSum > totalDuration
                  ? `Součet částí (${partsSum} min) přesahuje délku tréninku (${totalDuration} min).`
                  : `Součet částí (${partsSum} min) pokrývá pouze ${Math.round(partsSum / totalDuration * 100)}% délky tréninku — minimum je ${minPartsDurationPercent}% (${minPartsSum} min).`}
              </div>
            )}

            {fields.length === 0 ? (
              <p className="py-2 text-sm text-gray-400">Zatím žádné části. Klikněte na "Přidat část".</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <SortablePartRow
                        key={field.id}
                        id={field.id}
                        index={index}
                        register={register}
                        errors={errors}
                        onRemove={() => remove(index)}
                        control={control}
                        allActivities={allActivities}
                        setValue={setValue}
                        showImages={showImages}
                        showAllImages={showAllImages}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Save success */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Trénink uložen.
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div ref={errorRef} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/trainings')}>
            Zrušit
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending} onClick={() => setSaveError(null)}>
            Uložit trénink
          </Button>
        </div>
      </form>

      <Modal
        isOpen={!!fillDefaults}
        onClose={() => setFillDefaults(null)}
        title="Doplnit výchozí hodnoty?"
        maxWidth="sm"
      >
        <p className="mb-3 text-sm text-gray-600">
          Trénink je rozpracovaný. Chybí tyto výchozí hodnoty:
        </p>
        <ul className="mb-4 space-y-1">
          {fillDefaults?.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-sky-500">•</span>
              {item.label}
            </li>
          ))}
        </ul>
        <p className="mb-4 text-sm text-gray-600">Doplnit automaticky a uložit trénink?</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setFillDefaults(null)}>
            Ne
          </Button>
          <Button size="sm" onClick={handleConfirmFillDefaults} loading={mutation.isPending}>
            Ano, doplnit a uložit
          </Button>
        </div>
      </Modal>

      <ValidationResultModal
        result={validationResult}
        onClose={() => setValidationResult(null)}
      />

      {isEdit && existingTraining && (
        <ScheduleTrainingModal
          training={existingTraining}
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
        />
      )}
    </div>
  )
}
