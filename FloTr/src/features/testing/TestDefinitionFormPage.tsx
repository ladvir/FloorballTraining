import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { PageHeader } from '../../components/shared/PageHeader'
import { testDefinitionsApi, ageGroupsApi, playerSkillsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { TEST_CATEGORY_LABELS, GENDER_LABELS } from '../../types/domain.types'

const gradeOptionSchema = z.object({
  label: z.string().min(1, 'testing.requiredField'),
  numericValue: z.coerce.number(),
  colour: z.string().optional(),
  sortOrder: z.coerce.number(),
  skillGrade: z.coerce.number().optional().nullable(),
})

const colourRangeSchema = z.object({
  ageGroupId: z.coerce.number().optional().nullable(),
  gender: z.coerce.number().optional().nullable(),
  greenFrom: z.coerce.number().optional().nullable(),
  greenTo: z.coerce.number().optional().nullable(),
  yellowFrom: z.coerce.number().optional().nullable(),
  yellowTo: z.coerce.number().optional().nullable(),
})

const skillGradeRangeSchema = z.object({
  ageGroupId: z.coerce.number().optional().nullable(),
  gender: z.coerce.number().optional().nullable(),
  grade1From: z.coerce.number().optional().nullable(),
  grade1To: z.coerce.number().optional().nullable(),
  grade2From: z.coerce.number().optional().nullable(),
  grade2To: z.coerce.number().optional().nullable(),
  grade3From: z.coerce.number().optional().nullable(),
  grade3To: z.coerce.number().optional().nullable(),
  grade4From: z.coerce.number().optional().nullable(),
  grade4To: z.coerce.number().optional().nullable(),
})

const schema = z.object({
  name: z.string().min(1, 'validation.nameRequired'),
  description: z.string().optional(),
  testType: z.coerce.number(),
  category: z.coerce.number(),
  unit: z.string().optional(),
  higherIsBetter: z.boolean(),
  sortOrder: z.coerce.number().min(0),
  skillId: z.coerce.number().optional().nullable(),
  gradeOptions: z.array(gradeOptionSchema),
  colourRanges: z.array(colourRangeSchema),
  skillGradeRanges: z.array(skillGradeRangeSchema),
})

type FormData = z.infer<typeof schema>

export function TestDefinitionFormPage() {
  const { t } = useTranslation()
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

  const { data: skillCatalog } = useQuery({
    queryKey: ['skillCatalog'],
    queryFn: () => playerSkillsApi.getCatalog(),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      description: '',
      testType: 0,
      category: 0,
      unit: '',
      higherIsBetter: true,
      sortOrder: 0,
      skillId: null,
      gradeOptions: [],
      colourRanges: [],
      skillGradeRanges: [],
    },
  })

  const gradeFields = useFieldArray({ control, name: 'gradeOptions' })
  const rangeFields = useFieldArray({ control, name: 'colourRanges' })
  const skillRangeFields = useFieldArray({ control, name: 'skillGradeRanges' })
  const testType = watch('testType')
  const skillId = watch('skillId')

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
        skillId: existing.skillId ?? null,
        gradeOptions: existing.gradeOptions.map((g) => ({
          label: g.label,
          numericValue: g.numericValue,
          colour: g.colour ?? '',
          sortOrder: g.sortOrder,
          skillGrade: g.skillGrade ?? null,
        })),
        colourRanges: existing.colourRanges.map((c) => ({
          ageGroupId: c.ageGroupId ?? null,
          gender: c.gender ?? null,
          greenFrom: c.greenFrom ?? null,
          greenTo: c.greenTo ?? null,
          yellowFrom: c.yellowFrom ?? null,
          yellowTo: c.yellowTo ?? null,
        })),
        skillGradeRanges: existing.skillGradeRanges.map((c) => ({
          ageGroupId: c.ageGroupId ?? null,
          gender: c.gender ?? null,
          grade1From: c.grade1From ?? null,
          grade1To: c.grade1To ?? null,
          grade2From: c.grade2From ?? null,
          grade2To: c.grade2To ?? null,
          grade3From: c.grade3From ?? null,
          grade3To: c.grade3To ?? null,
          grade4From: c.grade4From ?? null,
          grade4To: c.grade4To ?? null,
        })),
      })
    }
  }, [existing, reset])

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        clubId: user?.clubId,
        skillId: data.skillId || undefined,
        gradeOptions: data.gradeOptions.map((g, i) => ({ ...g, sortOrder: i + 1 })),
        colourRanges: data.colourRanges.map((c) => ({
          ...c,
          ageGroupId: c.ageGroupId || undefined,
          gender: c.gender !== null && c.gender !== undefined ? c.gender : undefined,
        })),
        skillGradeRanges: data.skillGradeRanges.map((c) => ({
          ...c,
          ageGroupId: c.ageGroupId || undefined,
          gender: c.gender !== null && c.gender !== undefined ? c.gender : undefined,
        })),
      }
      return isEdit
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          testDefinitionsApi.update(Number(id), payload as any)
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          testDefinitionsApi.create(payload as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testDefinitions'] })
      queryClient.invalidateQueries({ queryKey: ['testDefinition'] })
      navigate('/testing')
    },
  })

  const onSubmit = handleSubmit((data) => saveMutation.mutate(data))

  if (isEdit && isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={isEdit ? t('testing.formEditTitle') : t('testing.formNewTitle')}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/testing')}>
            <ArrowLeft className="h-4 w-4" /> {t('common.back')}
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">{t('testing.basicInfo')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t('testing.formName')}
              {...register('name')}
              error={errors.name?.message ? t(errors.name.message) : undefined}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {t('testing.formDescription')}
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('testing.testType')}</label>
                <select
                  {...register('testType')}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value={0}>{t('testing.typeNumeric')}</option>
                  <option value={1}>{t('testing.typeScale')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('testing.category')}</label>
                <select
                  {...register('category')}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                >
                  {Object.entries(TEST_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {Number(testType) === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('testing.formUnit')}
                  placeholder={t('testing.unitPlaceholder')}
                  {...register('unit')}
                />
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="higherIsBetter"
                    {...register('higherIsBetter')}
                    className="rounded"
                  />
                  <label htmlFor="higherIsBetter" className="text-sm text-gray-700">
                    {t('testing.higherIsBetter')}
                  </label>
                </div>
              </div>
            )}
            <Input label={t('testing.sortOrder')} type="number" {...register('sortOrder')} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {t('testing.linkedSkill')}
              </label>
              <select
                {...register('skillId')}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">{t('testing.linkedSkillNone')}</option>
                {(skillCatalog ?? []).map((s) => (
                  <option key={s.skillId} value={s.skillId}>
                    {s.categoryName} — {s.skillName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">{t('testing.linkedSkillHint')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Grade options (only for Grade type) */}
        {Number(testType) === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t('testing.scaleOptions')}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    gradeFields.append({
                      label: '',
                      numericValue: gradeFields.fields.length + 1,
                      colour: '',
                      sortOrder: gradeFields.fields.length + 1,
                      skillGrade: null,
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> {t('common.add')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {gradeFields.fields.length === 0 && (
                <p className="text-sm text-gray-400">{t('testing.addAtLeastOne')}</p>
              )}
              {gradeFields.fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? t('testing.formDescription') : undefined}
                      placeholder={t('testing.gradeLabelPlaceholder')}
                      {...register(`gradeOptions.${index}.label`)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      label={index === 0 ? t('testing.colValue') : undefined}
                      type="number"
                      {...register(`gradeOptions.${index}.numericValue`)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      label={index === 0 ? t('testing.colColour') : undefined}
                      type="color"
                      {...register(`gradeOptions.${index}.colour`)}
                      className="h-9 p-1"
                    />
                  </div>
                  {skillId && (
                    <div className="w-28">
                      <label className={index === 0 ? 'text-xs text-gray-500' : 'sr-only'}>
                        {t('testing.skillGrade')}
                      </label>
                      <select
                        {...register(`gradeOptions.${index}.skillGrade`)}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm"
                      >
                        <option value="">{t('testing.skillGradeNone')}</option>
                        {[1, 2, 3, 4, 5].map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => gradeFields.remove(index)}
                  >
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
                <h2 className="text-sm font-semibold">{t('testing.colourRanges')}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    rangeFields.append({
                      ageGroupId: null,
                      gender: null,
                      greenFrom: null,
                      greenTo: null,
                      yellowFrom: null,
                      yellowTo: null,
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> {t('common.add')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rangeFields.fields.length === 0 && (
                <p className="text-sm text-gray-400">{t('testing.addColourRanges')}</p>
              )}
              {rangeFields.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">{t('testing.ageGroup')}</label>
                      <select
                        {...register(`colourRanges.${index}.ageGroupId`)}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      >
                        <option value="">{t('testing.allFem')}</option>
                        {(ageGroups ?? []).map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">{t('testing.gender')}</label>
                      <select
                        {...register(`colourRanges.${index}.gender`)}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      >
                        <option value="">{t('testing.allNeuter')}</option>
                        {Object.entries(GENDER_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => rangeFields.remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-xs text-green-600">{t('testing.greenFrom')}</label>
                      <Input
                        type="number"
                        step="any"
                        {...register(`colourRanges.${index}.greenFrom`)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-green-600">{t('testing.greenTo')}</label>
                      <Input
                        type="number"
                        step="any"
                        {...register(`colourRanges.${index}.greenTo`)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-yellow-600">{t('testing.yellowFrom')}</label>
                      <Input
                        type="number"
                        step="any"
                        {...register(`colourRanges.${index}.yellowFrom`)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-yellow-600">{t('testing.yellowTo')}</label>
                      <Input
                        type="number"
                        step="any"
                        {...register(`colourRanges.${index}.yellowTo`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Skill-grade age bands (for Number type tests linked to a skill) */}
        {Number(testType) === 0 && !!skillId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t('testing.skillGradeRanges')}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    skillRangeFields.append({
                      ageGroupId: null,
                      gender: null,
                      grade1From: null,
                      grade1To: null,
                      grade2From: null,
                      grade2To: null,
                      grade3From: null,
                      grade3To: null,
                      grade4From: null,
                      grade4To: null,
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> {t('common.add')}
                </Button>
              </div>
              <p className="text-xs text-gray-400">{t('testing.skillGradeRangesHint')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillRangeFields.fields.length === 0 && (
                <p className="text-sm text-gray-400">{t('testing.addSkillGradeRanges')}</p>
              )}
              {skillRangeFields.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">{t('testing.ageGroup')}</label>
                      <select
                        {...register(`skillGradeRanges.${index}.ageGroupId`)}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      >
                        <option value="">{t('testing.allFem')}</option>
                        {(ageGroups ?? []).map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">{t('testing.gender')}</label>
                      <select
                        {...register(`skillGradeRanges.${index}.gender`)}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      >
                        <option value="">{t('testing.allNeuter')}</option>
                        {Object.entries(GENDER_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => skillRangeFields.remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-xs text-green-600">{t('testing.grade1')}</label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.from')}
                          {...register(`skillGradeRanges.${index}.grade1From`)}
                        />
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.to')}
                          {...register(`skillGradeRanges.${index}.grade1To`)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-lime-600">{t('testing.grade2')}</label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.from')}
                          {...register(`skillGradeRanges.${index}.grade2From`)}
                        />
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.to')}
                          {...register(`skillGradeRanges.${index}.grade2To`)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-yellow-600">{t('testing.grade3')}</label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.from')}
                          {...register(`skillGradeRanges.${index}.grade3From`)}
                        />
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.to')}
                          {...register(`skillGradeRanges.${index}.grade3To`)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-orange-600">{t('testing.grade4')}</label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.from')}
                          {...register(`skillGradeRanges.${index}.grade4From`)}
                        />
                        <Input
                          type="number"
                          step="any"
                          placeholder={t('common.to')}
                          {...register(`skillGradeRanges.${index}.grade4To`)}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{t('testing.grade5ImplicitHint')}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {saveMutation.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {t('testing.saveErrorMsg', { msg: (saveMutation.error as Error).message })}
          </div>
        )}
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
            {isEdit ? t('common.save') : t('common.create')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/testing')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
