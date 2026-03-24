import { useEffect, useCallback, useState, useRef, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, CheckCircle, ShieldCheck, Upload, Pencil, Star, Trash2, X, FileDown, User, Plus, ListPlus } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { PdfOptionsModal } from '../../components/shared/PdfOptionsModal'
import type { PdfOptions } from '../../components/shared/PdfOptionsModal'
import { activitiesApi } from '../../api/activities.api'
import { tagsApi, ageGroupsApi, equipmentApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useActivitySelectionStore } from '../../store/activitySelectionStore'
import DrawingComponent, { type DrawingSaveData } from '../../components/ui/drawing/DrawingComponent'
import type { ActivityTagDto, ActivityAgeGroupDto, ActivityEquipmentDto, ActivityMediaDto } from '../../types/domain.types'

// ── Validation result modal ───────────────────────────────────────────────────

function ValidationResultModal({
  result,
  onClose,
}: {
  result: { isDraft: boolean; errors: string[]; name: string } | null
  onClose: () => void
}) {
  if (!result) return null
  return (
    <Modal isOpen={true} onClose={onClose} title={`Validace: ${result.name}`} maxWidth="md">
      {result.isDraft ? (
        <div className="space-y-3">
          <p className="text-sm text-yellow-700">Aktivita je <strong>rozpracovaná</strong> — nalezeny problémy:</p>
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
        <p className="text-sm text-green-700">
          Aktivita je <strong>kompletní</strong> a splňuje všechny požadavky.
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onClose}>Zavřít</Button>
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <h2 className="text-base font-semibold text-gray-900">Kreslení</h2>
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
          onSave={(data) => { onSave(data); onClose() }}
        />
      </div>
    </div>,
    document.body
  )
}

// ── Image lightbox ────────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-white hover:text-gray-300">
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
  // JSON state starts with { and has "fieldId"
  try {
    if (img.data?.startsWith('{')) {
      const parsed = JSON.parse(img.data)
      if (parsed && 'fieldId' in parsed) return true
    }
  } catch { /* not JSON */ }
  // Legacy SVG format
  return img.data?.startsWith('<?xml') || img.data?.includes('src="flotr"') || false
}

function svgToDataUrl(svg: string): string {
  if (svg.startsWith('data:')) return svg
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function getDisplaySrc(img: ActivityMediaDto): string {
  // For drawings: preview holds the SVG, data holds the JSON state
  if (isDrawingImage(img) && img.preview) {
    return img.preview.startsWith('<?xml') || img.preview.startsWith('<svg')
      ? svgToDataUrl(img.preview)
      : img.preview
  }
  return img.data
}

function ImagesSection({ activityId, initialImages }: { activityId: number; initialImages: ActivityMediaDto[] }) {
  const queryClient = useQueryClient()
  const [images, setImages] = useState<ActivityMediaDto[]>(initialImages)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [drawingState, setDrawingState] = useState<{ open: boolean; editingImage?: ActivityMediaDto }>({ open: false })
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
    mutationFn: ({ imageId, image }: { imageId: number; image: Pick<ActivityMediaDto, 'name' | 'data' | 'preview'> }) =>
      activitiesApi.updateImage(activityId, imageId, image),
    onSuccess: (saved) => {
      setImages((prev) => prev.map((img) => img.id === saved.id ? saved : img))
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
      addMutation.mutate({ name: 'kresba.svg', data: saveData.stateJson, preview: saveData.svgString, isThumbnail: isFirst })
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
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX }
          else { w = Math.round(w * MAX / h); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const isFirst = images.length === 0
        addMutation.mutate({ name: file.name, data: canvas.toDataURL('image/jpeg', 0.85), preview: '', isThumbnail: isFirst })
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending || thumbnailMutation.isPending

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Obrázky</p>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Nahrát
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setDrawingState({ open: true })}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Kreslit
            </button>
          </div>
        </div>

        {(addMutation.isPending || updateMutation.isPending) && (
          <p className="mb-2 text-xs text-sky-600">Ukládám obrázek…</p>
        )}

        {images.length === 0 ? (
          <p className="text-sm text-gray-400">Žádné obrázky — nahrajte soubor nebo nakreslete.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img) => {
              const isDrawing = isDrawingImage(img)
              const displaySrc = getDisplaySrc(img)
              return (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
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
                        title={img.isThumbnail ? 'Náhledový obrázek' : 'Nastavit jako náhled'}
                        disabled={isPending}
                        onClick={() => thumbnailMutation.mutate(img.id)}
                        className={`rounded p-1 transition-colors ${img.isThumbnail ? 'bg-amber-400 text-white' : 'bg-white/80 text-gray-600 hover:bg-amber-50 hover:text-amber-600'} disabled:opacity-50`}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      {isDrawing && (
                        <button
                          type="button"
                          title="Upravit kresbu"
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
                      title="Smazat"
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
            Hvězdičkou označený obrázek se zobrazí jako náhled v přehledu aktivit.
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
      {lightbox && (
        <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
      )}
    </Card>
  )
}

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Název je povinný').max(50, 'Max. 50 znaků'),
  description: z.string().max(1000, 'Max. 1000 znaků').optional(),
  durationMin: z.coerce.number().min(1, 'Min. 1 min'),
  durationMax: z.coerce.number().min(1, 'Min. 1 min'),
  personsMin: z.coerce.number().min(1, 'Min. 1').max(100, 'Max. 100'),
  personsMax: z.coerce.number().min(1, 'Min. 1').max(100, 'Max. 100'),
  activityTagIds: z.array(z.number()),
  activityAgeGroupIds: z.array(z.number()),
  activityEquipmentIds: z.array(z.number()),
}).refine((d) => d.durationMin <= d.durationMax, {
  message: 'Délka min. nesmí být delší než délka max.',
  path: ['durationMin'],
}).refine((d) => d.personsMin <= d.personsMax, {
  message: 'Počet osob min. nesmí být větší než počet osob max.',
  path: ['personsMin'],
})

type FormData = z.infer<typeof schema>

// ── Main page ─────────────────────────────────────────────────────────────────

export function ActivityFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin, user } = useAuthStore()
  const { selectedActivities, addActivity } = useActivitySelectionStore()

  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<{ isDraft: boolean; errors: string[]; name: string } | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showPdfOptions, setShowPdfOptions] = useState(false)
  const [newEquipmentName, setNewEquipmentName] = useState('')
  const [savingEquipment, setSavingEquipment] = useState(false)

  const { data: existingActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activitiesApi.getById(Number(id)),
    enabled: isEdit,
    refetchOnWindowFocus: false,
  })

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  const { data: allAgeGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: allEquipment } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.getAll })

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

  // Pre-fill form fields from existing activity (edit mode)
  const formInitialized = useRef(false)
  useEffect(() => {
    if (existingActivity && !formInitialized.current) {
      formInitialized.current = true
      reset({
        name: existingActivity.name,
        description: existingActivity.description ?? '',
        durationMin: existingActivity.durationMin ?? 5,
        durationMax: existingActivity.durationMax ?? 20,
        personsMin: existingActivity.personsMin ?? 10,
        personsMax: existingActivity.personsMax ?? 30,
        activityTagIds: (existingActivity.activityTags ?? []).map((t) => t.tagId ?? t.tag?.id ?? 0).filter((id) => id > 0),
        activityAgeGroupIds: (existingActivity.activityAgeGroups ?? []).map((ag) => ag.ageGroupId ?? ag.ageGroup?.id ?? 0).filter((id) => id > 0),
        activityEquipmentIds: (existingActivity.activityEquipments ?? []).map((ae) => ae.equipmentId ?? ae.equipment?.id ?? 0).filter((id) => id > 0),
      })
    }
  }, [existingActivity, reset])

  const watchTagIds = watch('activityTagIds')
  const watchAgeGroupIds = watch('activityAgeGroupIds')
  const watchEquipmentIds = watch('activityEquipmentIds')

  const toggleTag = useCallback((tagId: number) => {
    const current = watchTagIds ?? []
    setValue('activityTagIds', current.includes(tagId) ? current.filter((x) => x !== tagId) : [...current, tagId])
  }, [watchTagIds, setValue])

  const toggleAgeGroup = useCallback((agId: number) => {
    const current = watchAgeGroupIds ?? []
    setValue('activityAgeGroupIds', current.includes(agId) ? current.filter((x) => x !== agId) : [...current, agId])
  }, [watchAgeGroupIds, setValue])

  const toggleEquipment = useCallback((eqId: number) => {
    const current = watchEquipmentIds ?? []
    setValue('activityEquipmentIds', current.includes(eqId) ? current.filter((x) => x !== eqId) : [...current, eqId])
  }, [watchEquipmentIds, setValue])

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
      setSaveError('Nepodařilo se vytvořit pomůcku.')
    } finally {
      setSavingEquipment(false)
    }
  }

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const tagDtos: ActivityTagDto[] = data.activityTagIds.map((tagId) => {
        const tag = allTags?.find((t) => t.id === tagId)
        return { id: 0, tagId, tag }
      })
      const kdokolivId = allAgeGroups?.find((ag) => ag.name === 'Kdokoliv')?.id
      const ageGroupIds = data.activityAgeGroupIds.length === 0 && kdokolivId != null
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
      return (isEdit ? activitiesApi.update(Number(id), dto) : activitiesApi.create(dto)) as Promise<unknown>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      if (isEdit) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        navigate('/activities')
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Uložení selhalo. Zkuste to prosím znovu.'
      setSaveError(msg)
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

  const isComplete = isEdit ? existingActivity?.isDraft === false : false

  if (isEdit && loadingActivity) return <LoadingSpinner />

  // Only admin or the author can edit
  if (isEdit && existingActivity && !isAdmin && existingActivity.createdByUserId !== user?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nemáte oprávnění upravovat tuto aktivitu.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/activities')}>
          Zpět na aktivity
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/activities')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Upravit aktivitu' : 'Nová aktivita'}
            </h1>
            {isEdit && existingActivity?.createdByUserName && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                <User className="h-3 w-3" />
                {existingActivity.createdByUserName}
              </p>
            )}
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!existingActivity) return
                  if (selectedActivities.some((a) => a.id === existingActivity.id)) {
                    setSelectionMessage('Aktivita je již ve výběru pro tvorbu tréninku.')
                  } else {
                    addActivity(existingActivity)
                    setSelectionMessage('Aktivita byla přidána do výběru pro trénink.')
                  }
                  setTimeout(() => setSelectionMessage(null), 3000)
                }}
                title="Vyber pro trénink"
              >
                <ListPlus className="h-3.5 w-3.5" />
                Vyber pro trénink
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={downloadingPdf}
                onClick={() => setShowPdfOptions(true)}
              >
                <FileDown className="h-3.5 w-3.5" />
                PDF
              </Button>
            <button
              type="button"
              title="Spustit validaci aktivity"
              disabled={validateMutation.isPending}
              onClick={() => validateMutation.mutate()}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-75 disabled:opacity-50 ${
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
              {isComplete ? 'Kompletní' : 'Rozpracovaná'}
            </button>
            </div>
          )}
        </div>
      </div>

      {selectionMessage && (
        <div className="mb-4 rounded-lg bg-sky-50 px-4 py-2.5 text-sm text-sky-700">
          {selectionMessage}
        </div>
      )}

      <form onSubmit={handleSubmit((data: FormData) => { setSaveError(null); mutation.mutate(data) })} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <Input
              label="Název aktivity"
              placeholder="Název aktivity"
              error={errors.name?.message}
              {...register('name')}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Popis</label>
              <textarea
                rows={3}
                placeholder="Popis aktivity (nepovinné)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                {...register('description')}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Duration + Persons */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Délka min. (min)"
                type="number"
                min={1}
                placeholder="např. 5"
                error={errors.durationMin?.message}
                {...register('durationMin')}
              />
              <Input
                label="Délka max. (min)"
                type="number"
                min={1}
                placeholder="např. 20"
                error={errors.durationMax?.message}
                {...register('durationMax')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hráčů min."
                type="number"
                min={1}
                max={100}
                placeholder="např. 10"
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
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Štítky</p>
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
                <p className="text-sm text-gray-400">Žádné štítky nenalezeny</p>
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
              <p className="mt-2 text-xs text-gray-400">Žádná kategorie = aktivita pro všechny</p>
            )}
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Pomůcky</p>
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
                <p className="text-sm text-gray-400">Žádné pomůcky — přidejte novou níže</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Název nové pomůcky"
                  value={newEquipmentName}
                  onChange={(e) => setNewEquipmentName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEquipment() } }}
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
                Přidat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Images — only available in edit mode (activity must exist first) */}
        {isEdit ? (
          <ImagesSection
            activityId={Number(id)}
            initialImages={existingActivity?.activityMedium ?? []}
          />
        ) : (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm font-medium text-gray-700">Obrázky</p>
              <p className="mt-1 text-sm text-gray-400">
                Obrázky lze přidat po prvním uložení aktivity.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Save success */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Aktivita uložena.
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/activities')}>
            Zrušit
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending} onClick={() => setSaveError(null)}>
            Uložit aktivitu
          </Button>
        </div>
      </form>

      <ValidationResultModal
        result={validationResult}
        onClose={() => setValidationResult(null)}
      />

      <PdfOptionsModal
        isOpen={showPdfOptions}
        onClose={() => setShowPdfOptions(false)}
        onConfirm={handleDownloadPdf}
        loading={downloadingPdf}
        type="activity"
      />
    </div>
  )
}
