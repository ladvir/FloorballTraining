import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { PageHeader } from '../../components/shared/PageHeader'
import { testDefinitionsApi, ageGroupsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { TEST_CATEGORY_LABELS, GENDER_LABELS } from '../../types/domain.types'

const gradeOptionSchema = z.object({
  label: z.string().min(1, 'Povinné'),
  numericValue: z.coerce.number(),
  colour: z.string().optional(),
  sortOrder: z.coerce.number(),
})

const colourRangeSchema = z.object({
  ageGroupId: z.coerce.number().optional().nullable(),
  gender: z.coerce.number().optional().nullable(),
  greenFrom: z.coerce.number().optional().nullable(),
  greenTo: z.coerce.number().optional().nullable(),
  yellowFrom: z.coerce.number().optional().nullable(),
  yellowTo: z.coerce.number().optional().nullable(),
})

const schema = z.object({
  name: z.string().min(1, 'Název je povinný'),
  description: z.string().optional(),
  testType: z.coerce.number(),
  category: z.coerce.number(),
  unit: z.string().optional(),
  higherIsBetter: z.boolean(),
  sortOrder: z.coerce.number().min(0),
  gradeOptions: z.array(gradeOptionSchema),
  colourRanges: z.array(colourRangeSchema),
})

type FormData = z.infer<typeof schema>

export function TestDefinitionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['testDefinition', id],
    queryFn: () => testDefinitionsApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { data: ageGroups } = useQuery({
    queryKey: ['ageGroups'],
    queryFn: () => ageGroupsApi.getAll(),
  })

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '', description: '', testType: 0, category: 0,
      unit: '', higherIsBetter: true, sortOrder: 0,
      gradeOptions: [], colourRanges: [],
    },
  })

  const gradeFields = useFieldArray({ control, name: 'gradeOptions' })
  const rangeFields = useFieldArray({ control, name: 'colourRanges' })
  const testType = watch('testType')

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description ?? '',
        testType: existing.testType,
        category: existing.category,
        unit: existing.unit ?? '',
        higherIsBetter: existing.higherIsBetter,
        sortOrder: existing.sortOrder,
        gradeOptions: existing.gradeOptions.map((g) => ({
          label: g.label, numericValue: g.numericValue, colour: g.colour ?? '', sortOrder: g.sortOrder,
        })),
        colourRanges: existing.colourRanges.map((c) => ({
          ageGroupId: c.ageGroupId ?? null, gender: c.gender ?? null,
          greenFrom: c.greenFrom ?? null, greenTo: c.greenTo ?? null,
          yellowFrom: c.yellowFrom ?? null, yellowTo: c.yellowTo ?? null,
        })),
      })
    }
  }, [existing, reset])

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        clubId: user?.clubId,
        gradeOptions: data.gradeOptions.map((g, i) => ({ ...g, sortOrder: i + 1 })),
        colourRanges: data.colourRanges.map((c) => ({
          ...c,
          ageGroupId: c.ageGroupId || undefined,
          gender: c.gender !== null && c.gender !== undefined ? c.gender : undefined,
        })),
      }
      return isEdit
        ? testDefinitionsApi.update(Number(id), payload as any)
        : testDefinitionsApi.create(payload as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testDefinitions'] })
      navigate('/testing')
    },
  })

  const onSubmit = handleSubmit((data) => saveMutation.mutate(data))

  if (isEdit && isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={isEdit ? 'Upravit test' : 'Nový test'}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/testing')}>
            <ArrowLeft className="h-4 w-4" /> Zpět
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader><h2 className="text-sm font-semibold">Základní údaje</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Název testu" {...register('name')} error={errors.name?.message} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Popis</label>
              <textarea {...register('description')} rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Typ testu</label>
                <select {...register('testType')} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm">
                  <option value={0}>Číselný</option>
                  <option value={1}>Škála</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Kategorie</label>
                <select {...register('category')} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm">
                  {Object.entries(TEST_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {Number(testType) === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Jednotka" placeholder="s, cm, kg, počet..." {...register('unit')} />
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="higherIsBetter" {...register('higherIsBetter')} className="rounded" />
                  <label htmlFor="higherIsBetter" className="text-sm text-gray-700">Vyšší hodnota je lepší</label>
                </div>
              </div>
            )}
            <Input label="Pořadí" type="number" {...register('sortOrder')} />
          </CardContent>
        </Card>

        {/* Grade options (only for Grade type) */}
        {Number(testType) === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Možnosti škály</h2>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => gradeFields.append({ label: '', numericValue: gradeFields.fields.length + 1, colour: '', sortOrder: gradeFields.fields.length + 1 })}
                >
                  <Plus className="h-4 w-4" /> Přidat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {gradeFields.fields.length === 0 && (
                <p className="text-sm text-gray-400">Přidejte alespoň jednu možnost.</p>
              )}
              {gradeFields.fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label={index === 0 ? 'Popis' : undefined} placeholder="např. OK"
                      {...register(`gradeOptions.${index}.label`)} />
                  </div>
                  <div className="w-20">
                    <Input label={index === 0 ? 'Hodnota' : undefined} type="number"
                      {...register(`gradeOptions.${index}.numericValue`)} />
                  </div>
                  <div className="w-20">
                    <Input label={index === 0 ? 'Barva' : undefined} type="color"
                      {...register(`gradeOptions.${index}.colour`)} className="h-9 p-1" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => gradeFields.remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Colour ranges (for Number type) */}
        {Number(testType) === 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Barevné rozsahy</h2>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => rangeFields.append({ ageGroupId: null, gender: null, greenFrom: null, greenTo: null, yellowFrom: null, yellowTo: null })}
                >
                  <Plus className="h-4 w-4" /> Přidat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rangeFields.fields.length === 0 && (
                <p className="text-sm text-gray-400">Přidejte barevné rozsahy pro hodnocení výsledků.</p>
              )}
              {rangeFields.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Věková kategorie</label>
                      <select {...register(`colourRanges.${index}.ageGroupId`)}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
                        <option value="">Všechny</option>
                        {(ageGroups ?? []).map((ag) => (
                          <option key={ag.id} value={ag.id}>{ag.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Pohlaví</label>
                      <select {...register(`colourRanges.${index}.gender`)}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
                        <option value="">Všechna</option>
                        {Object.entries(GENDER_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => rangeFields.remove(index)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-xs text-green-600">Zelená od</label>
                      <Input type="number" step="any" {...register(`colourRanges.${index}.greenFrom`)} />
                    </div>
                    <div>
                      <label className="text-xs text-green-600">Zelená do</label>
                      <Input type="number" step="any" {...register(`colourRanges.${index}.greenTo`)} />
                    </div>
                    <div>
                      <label className="text-xs text-yellow-600">Žlutá od</label>
                      <Input type="number" step="any" {...register(`colourRanges.${index}.yellowFrom`)} />
                    </div>
                    <div>
                      <label className="text-xs text-yellow-600">Žlutá do</label>
                      <Input type="number" step="any" {...register(`colourRanges.${index}.yellowTo`)} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {saveMutation.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Chyba při ukládání: {(saveMutation.error as Error).message}
          </div>
        )}
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
            {isEdit ? 'Uložit' : 'Vytvořit'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/testing')}>
            Zrušit
          </Button>
        </div>
      </form>
    </div>
  )
}
