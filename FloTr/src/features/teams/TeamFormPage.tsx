import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { teamsApi, ageGroupsApi, clubsApi } from '../../api/index'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Název týmu je povinný'),
  ageGroupId: z.coerce.number({ error: 'Vyberte věkovou skupinu' }).min(1, 'Vyberte věkovou skupinu'),
  clubId: z.coerce.number({ error: 'Vyberte klub' }).min(1, 'Vyberte klub'),
  personsMin: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
  personsMax: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
  defaultTrainingDuration: z.coerce.number().min(1).max(240).optional().or(z.literal('')),
  maxTrainingDuration: z.coerce.number().min(1).max(240).optional().or(z.literal('')),
  maxTrainingPartDuration: z.coerce.number().min(1).max(120).optional().or(z.literal('')),
  minPartsDurationPercent: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

// ── Page ─────────────────────────────────────────────────────────────────────

export function TeamFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: existingTeam, isLoading: loadingTeam } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { data: ageGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { name: '', ageGroupId: 0, clubId: 0, personsMin: '', personsMax: '', defaultTrainingDuration: '', maxTrainingDuration: '', maxTrainingPartDuration: '', minPartsDurationPercent: '' },
  })

  useEffect(() => {
    if (existingTeam) {
      reset({
        name: existingTeam.name,
        ageGroupId: existingTeam.ageGroupId ?? 0,
        clubId: existingTeam.clubId ?? 0,
        personsMin: existingTeam.personsMin ?? '',
        personsMax: existingTeam.personsMax ?? '',
        defaultTrainingDuration: existingTeam.defaultTrainingDuration ?? '',
        maxTrainingDuration: existingTeam.maxTrainingDuration ?? '',
        maxTrainingPartDuration: existingTeam.maxTrainingPartDuration ?? '',
        minPartsDurationPercent: existingTeam.minPartsDurationPercent ?? '',
      })
    }
  }, [existingTeam, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const ageGroup = ageGroups?.find((a) => a.id === Number(data.ageGroupId))
      const club = clubs?.find((c) => c.id === Number(data.clubId))

      const dto = {
        id: isEdit ? Number(id) : 0,
        name: data.name,
        ageGroupId: Number(data.ageGroupId),
        ageGroup: ageGroup ?? { id: Number(data.ageGroupId), name: '', description: '' },
        clubId: Number(data.clubId),
        club: club ?? { id: Number(data.clubId), name: '' },
        personsMin: data.personsMin !== '' ? Number(data.personsMin) : undefined,
        personsMax: data.personsMax !== '' ? Number(data.personsMax) : undefined,
        defaultTrainingDuration: data.defaultTrainingDuration !== '' ? Number(data.defaultTrainingDuration) : undefined,
        maxTrainingDuration: data.maxTrainingDuration !== '' ? Number(data.maxTrainingDuration) : undefined,
        maxTrainingPartDuration: data.maxTrainingPartDuration !== '' ? Number(data.maxTrainingPartDuration) : undefined,
        minPartsDurationPercent: data.minPartsDurationPercent !== '' ? Number(data.minPartsDurationPercent) : undefined,
        appointments: [],
        teamMembers: [],
      }

      return isEdit ? teamsApi.update(dto) : teamsApi.create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      navigate('/teams')
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data
      const msg = data?.errors?.join(', ') ?? data?.message ?? 'Uložení selhalo. Zkuste to prosím znovu.'
      setSaveError(msg)
    },
  })

  if (isEdit && loadingTeam) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Upravit tým' : 'Nový tým'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((data) => { setSaveError(null); mutation.mutate(data) })} className="space-y-4">
        <Card>
          <CardContent className="space-y-4 py-4">
            <Input
              label="Název týmu"
              placeholder="např. Junioři A"
              error={errors.name?.message}
              {...register('name')}
            />

            {/* AgeGroup */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Věková skupina</label>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.ageGroupId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                {...register('ageGroupId')}
              >
                <option value={0}>— vyberte —</option>
                {ageGroups?.map((ag) => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
              {errors.ageGroupId && <p className="mt-1 text-xs text-red-500">{errors.ageGroupId.message}</p>}
            </div>

            {/* Club */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Klub</label>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.clubId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                {...register('clubId')}
              >
                <option value={0}>— vyberte —</option>
                {clubs?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clubId && <p className="mt-1 text-xs text-red-500">{errors.clubId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Nastavení hráčů */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <p className="text-sm font-medium text-gray-700">Nastavení hráčů</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hráčů min."
                type="number"
                min={1}
                max={100}
                placeholder="např. 8"
                error={errors.personsMin?.message}
                {...register('personsMin')}
              />
              <Input
                label="Hráčů max."
                type="number"
                min={1}
                max={100}
                placeholder="např. 20"
                error={errors.personsMax?.message}
                {...register('personsMax')}
              />
            </div>
            <Input
              label="Výchozí délka tréninku (min)"
              type="number"
              min={1}
              max={240}
              placeholder="např. 90"
              error={errors.defaultTrainingDuration?.message}
              {...register('defaultTrainingDuration')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max. délka tréninku (min)"
                type="number"
                min={1}
                max={240}
                placeholder="např. 120"
                error={errors.maxTrainingDuration?.message}
                {...register('maxTrainingDuration')}
              />
              <Input
                label="Max. délka části (min)"
                type="number"
                min={1}
                max={120}
                placeholder="např. 40"
                error={errors.maxTrainingPartDuration?.message}
                {...register('maxTrainingPartDuration')}
              />
            </div>
            <Input
              label="Min. pokrytí částmi (%)"
              type="number"
              min={1}
              max={100}
              placeholder={`výchozí: 95`}
              error={errors.minPartsDurationPercent?.message}
              {...register('minPartsDurationPercent')}
            />
          </CardContent>
        </Card>

        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/teams')}>
            Zrušit
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            Uložit tým
          </Button>
        </div>
      </form>
    </div>
  )
}
