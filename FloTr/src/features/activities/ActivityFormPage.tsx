import { useEffect, useCallback, useMemo, useState, useRef, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '../../utils/toast'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Upload,
  Pencil,
  Star,
  Trash2,
  X,
  FileDown,
  User,
  Plus,
  ListPlus,
  HelpCircle,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { PdfOptionsModal } from '../../components/shared/PdfOptionsModal'
import type { PdfOptions } from '../../components/shared/PdfOptionsModal'
import { SafeDeleteModal } from '../../components/shared/SafeDeleteModal'
import { activitiesApi } from '../../api/activities.api'
import { tagsApi, ageGroupsApi, equipmentApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useAiActivityStore } from '../../store/aiActivityStore'
import { useActivitySelectionStore } from '../../store/activitySelectionStore'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '../../components/shared/UnsavedChangesDialog'
import DrawingComponent, {
  type DrawingSaveData,
} from '../../components/ui/drawing/DrawingComponent'
import { ActivityHelpModal } from './ActivityHelpModal'
import type {
  ActivityTagDto,
  ActivityAgeGroupDto,
  ActivityEquipmentDto,
  ActivityMediaDto,
} from '../../types/domain.types'

// ── Validation result modal ───────────────────────────────────────────────────

function ValidationResultModal({
  result,
  onClose,
}: {
  result: { isDraft: boolean; errors: string[]; name: string } | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  if (!result) return null
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('activities.validationTitle', { name: result.name })}
      maxWidth="md"
    >
      {result.isDraft ? (
        <div className="space-y-3">
          <p className="text-sm text-yellow-700">{t('activities.validationDraftMsg')}</p>
          <ul className="space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 text-red-400">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-green-700">{t('activities.validationCompleteMsg')}</p>
      )}
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  )
}

// ── Drawing modal (full-screen with DrawingComponent) ────────────────────────

function DrawingModal({
  initialStateJson,
  onSave,
  onClose,
}: {
  initialStateJson?: string
  onSave: (data: DrawingSaveData) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <h2 className="text-base font-semibold text-gray-900">{t('drawing.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <DrawingComponent
          initialStateJson={initialStateJson}
          onSave={(data) => {
            onSave(data)
            onClose()
          }}
        />
      </div>
    </div>,
    document.body
  )
}

// ── Image lightbox ────────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-white hover:text-gray-300"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt=""
        className="max-h-[90vh] max-w-[90vw] rounded object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// ── Images section — manages images via API directly ──────────────────────────

function isDrawingImage(img: ActivityMediaDto): boolean {
  if (img.name.endsWith('.svg')) return true
  // Any JSON object in `data` is drawing state (Konva stage / field), never an image.
  try {
    if (img.data?.startsWith('{') && typeof JSON.parse(img.data) === 'object') return true
  } catch {
    /* not JSON */
  }
  // Legacy SVG format
  return img.data?.startsWith('<?xml') || img.data?.includes('src="flotr"') || false
}

/** Transparent 1×1 GIF — safe placeholder that never triggers a network request. */
const BLANK_IMG_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

function svgToDataUrl(svg: string): string {
  if (svg.startsWith('data:')) return svg
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function getDisplaySrc(img: ActivityMediaDto): string {
  // For drawings: preview holds the SVG, data holds the Konva JSON state (not an image).
  if (isDrawingImage(img)) {
    const svg = [img.preview, img.data].find((s) => s?.startsWith('<?xml') || s?.startsWith('<svg'))
    if (svg) return svgToDataUrl(svg)
    if (img.preview && !img.preview.startsWith('{')) return img.preview
    // No renderable image (e.g. legacy drawing with only Konva state) — avoid a bad <img src>.
    return BLANK_IMG_SRC
  }
  return img.data
}

function ImagesSection({
  activityId,
  initialImages,
}: {
  activityId: number
  initialImages: ActivityMediaDto[]
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [images, setImages] = useState<ActivityMediaDto[]>(initialImages)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [drawingState, setDrawingState] = useState<{
    open: boolean
    editingImage?: ActivityMediaDto
  }>({ open: false })
  const [lightbox, setLightbox] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['activity', String(activityId)] })
    queryClient.invalidateQueries({ queryKey: ['activities'] })
  }

  const addMutation = useMutation({
    mutationFn: (image: Pick<ActivityMediaDto, 'name' | 'data' | 'preview' | 'isThumbnail'>) =>
      activitiesApi.addImage(activityId, image),
    onSuccess: (saved) => {
      setImages((prev) => [...prev, saved])
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      imageId,
      image,
    }: {
      imageId: number
      image: Pick<ActivityMediaDto, 'name' | 'data' | 'preview'>
    }) => activitiesApi.updateImage(activityId, imageId, image),
    onSuccess: (saved) => {
      setImages((prev) => prev.map((img) => (img.id === saved.id ? saved : img)))
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => activitiesApi.deleteImage(activityId, imageId),
    onSuccess: (_, imageId) => {
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      invalidate()
    },
  })

  const thumbnailMutation = useMutation({
    mutationFn: (imageId: number) => activitiesApi.setThumbnail(activityId, imageId),
    onSuccess: (_, imageId) => {
      setImages((prev) => prev.map((img) => ({ ...img, isThumbnail: img.id === imageId })))
      invalidate()
    },
  })

  const handleDrawingSave = (saveData: DrawingSaveData) => {
    if (drawingState.editingImage) {
      // Update existing drawing
      updateMutation.mutate({
        imageId: drawingState.editingImage.id,
        image: { name: 'kresba.svg', data: saveData.stateJson, preview: saveData.svgString },
      })
    } else {
      // New drawing
      const isFirst = images.length === 0
      addMutation.mutate({
        name: 'kresba.svg',
        data: saveData.stateJson,
        preview: saveData.svgString,
        isThumbnail: isFirst,
      })
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let w = img.width,
          h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w)
            w = MAX
          } else {
            w = Math.round((w * MAX) / h)
            h = MAX
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const isFirst = images.length === 0
        addMutation.mutate({
          name: file.name,
          data: canvas.toDataURL('image/jpeg', 0.85),
          preview: '',
          isThumbnail: isFirst,
        })
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const isPending =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    thumbnailMutation.isPending

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{t('activities.formImages')}</p>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {t('common.upload')}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setDrawingState({ open: true })}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('activities.drawBtn')}
            </button>
          </div>
        </div>

        {(addMutation.isPending || updateMutation.isPending) && (
          <p className="mb-2 text-xs text-sky-600">{t('activities.savingImage')}</p>
        )}

        {images.length === 0 ? (
          <p className="text-sm text-gray-400">{t('activities.noImagesUpload')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img) => {
              const isDrawing = isDrawingImage(img)
              const displaySrc = getDisplaySrc(img)
              return (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <img
                    src={displaySrc}
                    alt={img.name}
                    className="h-full w-full cursor-zoom-in object-cover"
                    onClick={() => setLightbox(displaySrc)}
                  />
                  {img.isThumbnail && (
                    <div className="absolute left-1 top-1 rounded-full bg-amber-400 p-0.5">
                      <Star className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title={
                          img.isThumbnail
                            ? t('activities.thumbnailLabel')
                            : t('activities.setThumbnail')
                        }
                        disabled={isPending}
                        onClick={() => thumbnailMutation.mutate(img.id)}
                        className={`rounded p-1 transition-colors ${img.isThumbnail ? 'bg-amber-400 text-white' : 'bg-white/80 text-gray-600 hover:bg-amber-50 hover:text-amber-600'} disabled:opacity-50`}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      {isDrawing && (
                        <button
                          type="button"
                          title={t('activities.editDrawing')}
                          disabled={isPending}
                          onClick={() => setDrawingState({ open: true, editingImage: img })}
                          className="rounded bg-white/80 p-1 text-gray-600 hover:bg-sky-50 hover:text-sky-600 disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      title={t('common.delete')}
                      disabled={isPending}
                      onClick={() => deleteMutation.mutate(img.id)}
                      className="rounded bg-white/80 p-1 text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {images.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            <Star className="mb-0.5 mr-1 inline h-3 w-3 text-amber-400" />
            {t('activities.thumbnailHint')}
          </p>
        )}
      </CardContent>

      {drawingState.open && (
        <DrawingModal
          initialStateJson={drawingState.editingImage?.data}
          onSave={handleDrawingSave}
          onClose={() => setDrawingState({ open: false })}
        />
      )}
      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </Card>
  )
}

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z.string().min(1, 'activities.nameRequired').max(50, 'activities.max50'),
    description: z.string().max(1000, 'activities.max1000').optional(),
    durationMin: z.coerce.number().min(1, 'activities.min1min'),
    durationMax: z.coerce.number().min(1, 'activities.min1min'),
    personsMin: z.coerce.number().min(1, 'activities.min1').max(100, 'activities.max100'),
    personsMax: z.coerce.number().min(1, 'activities.min1').max(100, 'activities.max100'),
    activityTagIds: z.array(z.number()),
    activityAgeGroupIds: z.array(z.number()),
    activityEquipmentIds: z.array(z.number()),
  })
  .refine((d) => d.durationMin <= d.durationMax, {
    message: 'activities.durationOrderError',
    path: ['durationMin'],
  })
  .refine((d) => d.personsMin <= d.personsMax, {
    message: 'activities.personsOrderError',
    path: ['personsMin'],
  })

type FormData = z.infer<typeof schema>

// ── Main page ─────────────────────────────────────────────────────────────────

export function ActivityFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin, user } = useAuthStore()
  const { selectedActivities, addActivity } = useActivitySelectionStore()

  const [selectionMessage, setSelectionMessage] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<{
    isDraft: boolean
    errors: string[]
    name: string
  } | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showPdfOptions, setShowPdfOptions] = useState(false)
  const [newEquipmentName, setNewEquipmentName] = useState('')
  const [savingEquipment, setSavingEquipment] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const { data: existingActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activitiesApi.getById(Number(id)),
    enabled: isEdit,
    refetchOnWindowFocus: false,
  })

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  const { data: allAgeGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: allEquipment } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.getAll })
  const { data: allActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
    enabled: isEdit,
  })

  const { prevId, nextId } = useMemo(() => {
    if (!isEdit || !allActivities || allActivities.length === 0)
      return { prevId: null as number | null, nextId: null as number | null }
    const sorted = [...allActivities].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'cs')
    )
    const idx = sorted.findIndex((a) => a.id === Number(id))
    if (idx === -1) return { prevId: null as number | null, nextId: null as number | null }
    return {
      prevId: idx > 0 ? sorted[idx - 1].id : null,
      nextId: idx < sorted.length - 1 ? sorted[idx + 1].id : null,
    }
  }, [allActivities, id, isEdit])

  const handleDownloadPdf = async (options: PdfOptions) => {
    if (!id || !existingActivity) return
    setDownloadingPdf(true)
    setShowPdfOptions(false)
    try {
      await activitiesApi.downloadPdf(Number(id), existingActivity.name, options)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      description: '',
      durationMin: 5,
      durationMax: 20,
      personsMin: 10,
      personsMax: 30,
      activityTagIds: [],
      activityAgeGroupIds: [],
      activityEquipmentIds: [],
    },
  })

  const unsavedGuard = useUnsavedChangesGuard()

  // Track unsaved changes via watch subscription
  const formReady = useRef(!isEdit) // create mode is ready immediately
  useEffect(() => {
    const sub = watch(() => {
      if (formReady.current) unsavedGuard.markDirty()
    })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, unsavedGuard.markDirty])

  // Pre-fill form fields from existing activity (edit mode).
  // Track the id we've initialized for so navigating prev/next (id changes while component stays mounted)
  // re-runs reset() against the freshly loaded activity.
  const initializedIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (existingActivity && initializedIdRef.current !== existingActivity.id) {
      initializedIdRef.current = existingActivity.id
      formReady.current = false
      reset({
        name: existingActivity.name,
        description: existingActivity.description ?? '',
        durationMin: existingActivity.durationMin ?? 5,
        durationMax: existingActivity.durationMax ?? 20,
        personsMin: existingActivity.personsMin ?? 10,
        personsMax: existingActivity.personsMax ?? 30,
        activityTagIds: (existingActivity.activityTags ?? [])
          .map((t) => t.tagId ?? t.tag?.id ?? 0)
          .filter((id) => id > 0),
        activityAgeGroupIds: (existingActivity.activityAgeGroups ?? [])
          .map((ag) => ag.ageGroupId ?? ag.ageGroup?.id ?? 0)
          .filter((id) => id > 0),
        activityEquipmentIds: (existingActivity.activityEquipments ?? [])
          .map((ae) => ae.equipmentId ?? ae.equipment?.id ?? 0)
          .filter((id) => id > 0),
      })
      requestAnimationFrame(() => {
        formReady.current = true
      })
    }
  }, [existingActivity, reset])

  // Pre-fill from an AI import suggestion (consume-once handoff from /activities/ai-import).
  const [aiSuggestion] = useState(() =>
    !id ? useAiActivityStore.getState().consumeSuggestion() : null
  )
  useEffect(() => {
    if (!isEdit && aiSuggestion) {
      formReady.current = false
      reset({
        name: aiSuggestion.name,
        description: aiSuggestion.description,
        durationMin: aiSuggestion.durationMin,
        durationMax: aiSuggestion.durationMax,
        personsMin: aiSuggestion.personsMin,
        personsMax: aiSuggestion.personsMax,
        activityTagIds: aiSuggestion.tagIds,
        activityAgeGroupIds: aiSuggestion.ageGroupIds,
        activityEquipmentIds: aiSuggestion.equipmentIds,
      })
      requestAnimationFrame(() => {
        formReady.current = true
      })
    }
  }, [isEdit, aiSuggestion, reset])

  const watchTagIds = watch('activityTagIds')
  const watchAgeGroupIds = watch('activityAgeGroupIds')
  const watchEquipmentIds = watch('activityEquipmentIds')

  const toggleTag = useCallback(
    (tagId: number) => {
      const current = watchTagIds ?? []
      setValue(
        'activityTagIds',
        current.includes(tagId) ? current.filter((x) => x !== tagId) : [...current, tagId]
      )
    },
    [watchTagIds, setValue]
  )

  const toggleAgeGroup = useCallback(
    (agId: number) => {
      const current = watchAgeGroupIds ?? []
      setValue(
        'activityAgeGroupIds',
        current.includes(agId) ? current.filter((x) => x !== agId) : [...current, agId]
      )
    },
    [watchAgeGroupIds, setValue]
  )

  const toggleEquipment = useCallback(
    (eqId: number) => {
      const current = watchEquipmentIds ?? []
      setValue(
        'activityEquipmentIds',
        current.includes(eqId) ? current.filter((x) => x !== eqId) : [...current, eqId]
      )
    },
    [watchEquipmentIds, setValue]
  )

  const handleAddEquipment = async () => {
    const name = newEquipmentName.trim()
    if (!name) return
    setSavingEquipment(true)
    try {
      const created = await equipmentApi.create({ name })
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      const current = watchEquipmentIds ?? []
      setValue('activityEquipmentIds', [...current, created.id])
      setNewEquipmentName('')
    } catch {
      toast.error(t('activities.saveEquipmentFailed'))
    } finally {
      setSavingEquipment(false)
    }
  }

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const tagDtos: ActivityTagDto[] = data.activityTagIds.map((tagId) => {
        const tag = allTags?.find((x) => x.id === tagId)
        return { id: 0, tagId, tag }
      })
      const kdokolivId = allAgeGroups?.find((ag) => ag.name === 'Kdokoliv')?.id
      const ageGroupIds =
        data.activityAgeGroupIds.length === 0 && kdokolivId != null
          ? [kdokolivId]
          : data.activityAgeGroupIds
      const ageGroupDtos: ActivityAgeGroupDto[] = ageGroupIds.map((agId) => {
        const ageGroup = allAgeGroups?.find((ag) => ag.id === agId)
        return { id: 0, ageGroupId: agId, ageGroup }
      })
      const equipmentDtos: ActivityEquipmentDto[] = data.activityEquipmentIds.map((eqId) => {
        const equipment = allEquipment?.find((e) => e.id === eqId)
        return { id: 0, equipmentId: eqId, equipment }
      })
      const dto = {
        id: isEdit ? Number(id) : 0,
        name: data.name,
        description: data.description,
        durationMin: data.durationMin,
        durationMax: data.durationMax,
        personsMin: data.personsMin,
        personsMax: data.personsMax,
        activityTags: tagDtos,
        activityAgeGroups: ageGroupDtos,
        activityEquipments: equipmentDtos,
      }
      return (
        isEdit ? activitiesApi.update(Number(id), dto) : activitiesApi.create(dto)
      ) as Promise<unknown>
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      unsavedGuard.markClean()

      // Create mode: switch to edit mode of the freshly created activity. Otherwise the
      // form stays in create mode and a second "Uložit" click creates a duplicate.
      if (!isEdit) {
        const createdId = (result as { id?: number } | undefined)?.id
        navigate(createdId ? `/activities/${createdId}/edit` : '/activities', { replace: true })
        return
      }

      formReady.current = false
      requestAnimationFrame(() => {
        formReady.current = true
      })
      toast.success(t('activities.saved'))
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('activities.saveFailedRetry')
      toast.error(msg)
    },
  })

  const validateMutation = useMutation({
    mutationFn: () => activitiesApi.validate(Number(id)),
    onSuccess: (data) => {
      queryClient.setQueryData(['activity', id], (old: { isDraft?: boolean } | undefined) =>
        old ? { ...old, isDraft: data.isDraft } : old
      )
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setValidationResult({ ...data, name: existingActivity?.name ?? watch('name') })
    },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: deleteUsage, isLoading: deleteUsageLoading } = useQuery({
    queryKey: ['activity-usage', id],
    queryFn: () => activitiesApi.getUsage(Number(id)),
    enabled: deleteOpen && isEdit,
  })

  const deleteActivityMutation = useMutation({
    mutationFn: () => activitiesApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setDeleteOpen(false)
      navigate('/activities')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setDeleteError(e?.response?.data?.message ?? e?.message ?? t('activities.deleteFailedRetry'))
    },
  })

  const isComplete = isEdit ? existingActivity?.isDraft === false : false

  if (isEdit && loadingActivity) return <LoadingSpinner />

  // Only admin or the author can edit
  if (isEdit && existingActivity && !isAdmin && existingActivity.createdByUserId !== user?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('activities.formPermissions')}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate('/activities')}
        >
          {t('activities.backToList')}
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-3">
        {/* Title row */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('activities.backToListTitle')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {isEdit && (
            <>
              <button
                type="button"
                disabled={prevId == null}
                onClick={() => prevId != null && navigate(`/activities/${prevId}/edit`)}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                title={t('activities.formPrevActivity')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                disabled={nextId == null}
                onClick={() => nextId != null && navigate(`/activities/${nextId}/edit`)}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                title={t('activities.formNextActivity')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-gray-900">
              {isEdit ? t('activities.editActivity') : t('activities.newActivity')}
            </h1>
            {isEdit && existingActivity?.createdByUserName && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
                <User className="h-3 w-3 flex-shrink-0" />
                {existingActivity.createdByUserName}
              </p>
            )}
          </div>
        </div>

        {/* Actions row — wraps within page width */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isEdit && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!existingActivity) return
                  if (selectedActivities.some((a) => a.id === existingActivity.id)) {
                    setSelectionMessage(t('activities.alreadyInSelection'))
                  } else {
                    addActivity(existingActivity)
                    setSelectionMessage(t('activities.addedToSelection'))
                  }
                  setTimeout(() => setSelectionMessage(null), 3000)
                }}
                title={t('activities.selectForTraining')}
                className="whitespace-nowrap"
              >
                <ListPlus className="h-3.5 w-3.5" />
                {t('activities.selectForTraining')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={downloadingPdf}
                onClick={() => setShowPdfOptions(true)}
                className="whitespace-nowrap"
              >
                <FileDown className="h-3.5 w-3.5" />
                PDF
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteError(null)
                    setDeleteOpen(true)
                  }}
                  title={t('activities.deleteActivity')}
                  className="whitespace-nowrap text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('common.delete')}
                </Button>
              )}
              <button
                type="button"
                title={t('activities.formValidateTitle')}
                disabled={validateMutation.isPending}
                onClick={() => validateMutation.mutate()}
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-75 disabled:opacity-50 ${
                  isComplete ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {validateMutation.isPending ? (
                  <ShieldCheck className="h-3.5 w-3.5 animate-pulse" />
                ) : isComplete ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {isComplete ? t('activities.statusCompleteFem') : t('activities.statusDraftFem')}
              </button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHelpOpen(true)}
            className="whitespace-nowrap"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {t('common.help')}
          </Button>

          <div className="h-5 w-px bg-gray-200" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
            onClick={() => navigate('/activities')}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="activity-form"
            size="sm"
            className="whitespace-nowrap"
            loading={isSubmitting || mutation.isPending}
          >
            {isEdit ? t('common.saveChanges') : t('activities.formSave')}
          </Button>
        </div>
      </div>

      {selectionMessage && (
        <div className="mb-4 rounded-lg bg-sky-50 px-4 py-2.5 text-sm text-sky-700">
          {selectionMessage}
        </div>
      )}

      <form
        id="activity-form"
        onSubmit={handleSubmit((data: FormData) => {
          mutation.mutate(data)
        })}
        className="space-y-6"
      >
        {/* Basic info */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <Input
              label={t('activities.formActivityName')}
              placeholder={t('activities.formActivityName')}
              error={errors.name?.message ? t(errors.name.message) : undefined}
              {...register('name')}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('activities.formDescription')}
              </label>
              <textarea
                rows={3}
                placeholder={t('activities.formDescPlaceholder')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{t(errors.description.message ?? '')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Duration + Persons */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-end gap-3 sm:gap-4">
              <div className="w-36">
                <Input
                  label={t('activities.durationMinLabel')}
                  type="number"
                  min={1}
                  placeholder={t('activities.egValue', { n: 5 })}
                  error={errors.durationMin?.message ? t(errors.durationMin.message) : undefined}
                  {...register('durationMin')}
                />
              </div>
              <div className="w-36">
                <Input
                  label={t('activities.durationMaxLabel')}
                  type="number"
                  min={1}
                  placeholder={t('activities.egValue', { n: 20 })}
                  error={errors.durationMax?.message ? t(errors.durationMax.message) : undefined}
                  {...register('durationMax')}
                />
              </div>
              <div className="w-px self-stretch bg-gray-200 hidden sm:block mx-2" />
              <div className="w-36">
                <Input
                  label={t('activities.playersMin')}
                  type="number"
                  min={1}
                  max={100}
                  placeholder={t('activities.egValue', { n: 10 })}
                  error={errors.personsMin?.message ? t(errors.personsMin.message) : undefined}
                  {...register('personsMin')}
                />
              </div>
              <div className="w-36">
                <Input
                  label={t('activities.playersMax')}
                  type="number"
                  min={1}
                  max={100}
                  placeholder={t('activities.egValue', { n: 30 })}
                  error={errors.personsMax?.message ? t(errors.personsMax.message) : undefined}
                  {...register('personsMax')}
                />
              </div>
              <div className="w-px self-stretch bg-gray-200 hidden sm:block mx-2" />
              <div>
                <p className="mb-1 text-sm font-medium text-gray-700">
                  {t('activities.formAgeGroups')}
                </p>
                <div className="flex flex-wrap gap-1.5">
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
                  {(watchAgeGroupIds ?? []).length === 0 && (
                    <p className="self-center text-xs text-gray-400">
                      {t('activities.ageGroupsAll')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              {t('activities.formTagsLabel')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(allTags ?? []).map((tag) => {
                const isSelected = (watchTagIds ?? []).includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                )
              })}
              {(allTags ?? []).length === 0 && (
                <p className="text-sm text-gray-400">{t('activities.noTags')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              {t('activities.formEquipment')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(allEquipment ?? []).map((eq) => {
                const isSelected = (watchEquipmentIds ?? []).includes(eq.id)
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleEquipment(eq.id)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                    }`}
                  >
                    {eq.name}
                  </button>
                )
              })}
              {(allEquipment ?? []).length === 0 && (watchEquipmentIds ?? []).length === 0 && (
                <p className="text-sm text-gray-400">{t('activities.noEquipment')}</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={t('activities.formEquipmentPlaceholder')}
                  value={newEquipmentName}
                  onChange={(e) => setNewEquipmentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddEquipment()
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEquipment}
                loading={savingEquipment}
                disabled={!newEquipmentName.trim()}
                className="mt-auto h-9 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('activities.addEquipment')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Images — at the end */}
        {isEdit ? (
          <ImagesSection
            activityId={Number(id)}
            initialImages={existingActivity?.activityMedium ?? []}
          />
        ) : (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm font-medium text-gray-700">{t('activities.formImages')}</p>
              <p className="mt-1 text-sm text-gray-400">{t('activities.imagesAfterSave')}</p>
            </CardContent>
          </Card>
        )}

        <div className="pb-8" />
      </form>

      <ValidationResultModal result={validationResult} onClose={() => setValidationResult(null)} />

      <PdfOptionsModal
        isOpen={showPdfOptions}
        onClose={() => setShowPdfOptions(false)}
        onConfirm={handleDownloadPdf}
        loading={downloadingPdf}
        type="activity"
      />

      <SafeDeleteModal
        isOpen={deleteOpen}
        title={t('activities.deleteActivity')}
        itemLabel={existingActivity?.name ?? ''}
        isUsageLoading={deleteUsageLoading}
        blocked={!!deleteUsage && deleteUsage.trainingCount > 0}
        blockedReason={
          deleteUsage && deleteUsage.trainingCount > 0
            ? t('activities.deleteBlockedMsg', {
                count: deleteUsage.trainingCount,
                noun:
                  deleteUsage.trainingCount === 1
                    ? t('activities.inTraining')
                    : t('activities.inTrainings'),
                names: deleteUsage.trainings.map((tr) => tr.trainingName).join(', '),
              })
            : undefined
        }
        isDeleting={deleteActivityMutation.isPending}
        serverError={deleteError}
        onClose={() => {
          setDeleteOpen(false)
          setDeleteError(null)
        }}
        onConfirm={() => deleteActivityMutation.mutate()}
      />

      <UnsavedChangesDialog
        isOpen={unsavedGuard.isBlocked}
        onConfirm={unsavedGuard.confirm}
        onCancel={unsavedGuard.cancel}
      />

      <ActivityHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
