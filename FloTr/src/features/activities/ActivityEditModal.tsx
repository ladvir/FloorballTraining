import { useEffect, useCallback, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, Plus } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { activitiesApi } from '../../api/activities.api'
import { tagsApi, ageGroupsApi, equipmentApi } from '../../api/index'
import type { ActivityTagDto, ActivityAgeGroupDto, ActivityEquipmentDto } from '../../types/domain.types'

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

interface Props {
  activityId: number | null
  onClose: () => void
  onSaved: () => void
}

export function ActivityEditModal({ activityId, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newEquipmentName, setNewEquipmentName] = useState('')
  const [savingEquipment, setSavingEquipment] = useState(false)

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => activitiesApi.getById(activityId!),
    enabled: activityId != null,
    refetchOnWindowFocus: false,
  })

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  const { data: allAgeGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: allEquipment } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.getAll })

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
      name: '', description: '', durationMin: 5, durationMax: 20,
      personsMin: 10, personsMax: 30,
      activityTagIds: [], activityAgeGroupIds: [], activityEquipmentIds: [],
    },
  })

  const formInitialized = useRef(false)
  useEffect(() => {
    if (activity && !formInitialized.current) {
      formInitialized.current = true
      reset({
        name: activity.name,
        description: activity.description ?? '',
        durationMin: activity.durationMin ?? 5,
        durationMax: activity.durationMax ?? 20,
        personsMin: activity.personsMin ?? 10,
        personsMax: activity.personsMax ?? 30,
        activityTagIds: (activity.activityTags ?? []).map((t) => t.tagId ?? t.tag?.id ?? 0).filter((id) => id > 0),
        activityAgeGroupIds: (activity.activityAgeGroups ?? []).map((ag) => ag.ageGroupId ?? ag.ageGroup?.id ?? 0).filter((id) => id > 0),
        activityEquipmentIds: (activity.activityEquipments ?? []).map((ae) => ae.equipmentId ?? ae.equipment?.id ?? 0).filter((id) => id > 0),
      })
    }
  }, [activity, reset])

  // Reset when modal opens with different activity
  useEffect(() => {
    formInitialized.current = false
  }, [activityId])

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
        ? [kdokolivId] : data.activityAgeGroupIds
      const ageGroupDtos: ActivityAgeGroupDto[] = ageGroupIds.map((agId) => {
        const ageGroup = allAgeGroups?.find((ag) => ag.id === agId)
        return { id: 0, ageGroupId: agId, ageGroup }
      })
      const equipmentDtos: ActivityEquipmentDto[] = data.activityEquipmentIds.map((eqId) => {
        const equipment = allEquipment?.find((e) => e.id === eqId)
        return { id: 0, equipmentId: eqId, equipment }
      })
      return activitiesApi.update(activityId!, {
        id: activityId!,
        name: data.name,
        description: data.description,
        durationMin: data.durationMin,
        durationMax: data.durationMax,
        personsMin: data.personsMin,
        personsMax: data.personsMax,
        activityTags: tagDtos,
        activityAgeGroups: ageGroupDtos,
        activityEquipments: equipmentDtos,
      }) as Promise<unknown>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] })
      onSaved()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Uložení selhalo.'
      setSaveError(msg)
    },
  })

  if (activityId == null) return null

  return (
    <Modal isOpen={true} onClose={onClose} title={isLoading ? 'Načítání...' : `Upravit: ${activity?.name ?? ''}`} maxWidth="2xl">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleSubmit((data) => { setSaveError(null); mutation.mutate(data) })} className="space-y-4">
          {/* Basic info */}
          <Card>
            <CardContent className="space-y-3 py-3">
              <Input label="Název aktivity" placeholder="Název aktivity" error={errors.name?.message} {...register('name')} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Popis</label>
                <textarea
                  rows={2}
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
            <CardContent className="space-y-3 py-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Délka min. (min)" type="number" min={1} error={errors.durationMin?.message} {...register('durationMin')} />
                <Input label="Délka max. (min)" type="number" min={1} error={errors.durationMax?.message} {...register('durationMax')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Hráčů min." type="number" min={1} max={100} error={errors.personsMin?.message} {...register('personsMin')} />
                <Input label="Hráčů max." type="number" min={1} max={100} error={errors.personsMax?.message} {...register('personsMax')} />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="py-3">
              <p className="mb-2 text-sm font-medium text-gray-700">Štítky</p>
              <div className="flex flex-wrap gap-1.5">
                {(allTags ?? []).map((tag) => {
                  const isSelected = (watchTagIds ?? []).includes(tag.id)
                  return (
                    <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                      }`}
                    >{tag.name}</button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Age groups */}
          <Card>
            <CardContent className="py-3">
              <p className="mb-2 text-sm font-medium text-gray-700">Věkové kategorie</p>
              <div className="flex flex-wrap gap-1.5">
                {(allAgeGroups ?? []).map((ag) => {
                  const isSelected = (watchAgeGroupIds ?? []).includes(ag.id)
                  return (
                    <button key={ag.id} type="button" onClick={() => toggleAgeGroup(ag.id)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                      }`}
                    >{ag.name}</button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardContent className="py-3">
              <p className="mb-2 text-sm font-medium text-gray-700">Pomůcky</p>
              <div className="flex flex-wrap gap-1.5">
                {(allEquipment ?? []).map((eq) => {
                  const isSelected = (watchEquipmentIds ?? []).includes(eq.id)
                  return (
                    <button key={eq.id} type="button" onClick={() => toggleEquipment(eq.id)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                      }`}
                    >{eq.name}</button>
                  )
                })}
              </div>
              <div className="mt-2 flex gap-2">
                <div className="flex-1">
                  <Input placeholder="Nová pomůcka" value={newEquipmentName} onChange={(e) => setNewEquipmentName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEquipment() } }}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddEquipment}
                  loading={savingEquipment} disabled={!newEquipmentName.trim()} className="mt-auto h-9 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Přidat
                </Button>
              </div>
            </CardContent>
          </Card>

          {saveError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {mutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Aktivita uložena.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Zrušit</Button>
            <Button type="submit" loading={isSubmitting || mutation.isPending}>Uložit aktivitu</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
