import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { teamsApi, ageGroupsApi, seasonsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { TeamSettingsFields } from './teamSettingsForm'
import { buildTeamSchema, type TeamFormData } from './teamSettingsSchema'

// Create a new team. Editing an existing team happens in place on the merged detail page
// (TeamDetailPage) — /teams/:id/edit redirects there.
export function TeamFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeClubId } = useAuthStore()
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: ageGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: seasons } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(buildTeamSchema(t)) as any,
    defaultValues: {
      name: '',
      ageGroupId: 0,
      clubId: activeClubId ?? 0,
      seasonId: '',
      personsMin: '',
      personsMax: '',
      defaultTrainingDuration: '',
      maxTrainingDuration: '',
      maxTrainingPartDuration: '',
      minPartsDurationPercent: '',
      iCalUrl: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TeamFormData) => {
      const ageGroup = ageGroups?.find((a) => a.id === Number(data.ageGroupId))
      return teamsApi.create({
        id: 0,
        name: data.name,
        ageGroupId: Number(data.ageGroupId),
        ageGroup: ageGroup ?? { id: Number(data.ageGroupId), name: '', description: '' },
        clubId: Number(data.clubId),
        seasonId: data.seasonId !== '' ? Number(data.seasonId) : null,
        personsMin: data.personsMin !== '' ? Number(data.personsMin) : undefined,
        personsMax: data.personsMax !== '' ? Number(data.personsMax) : undefined,
        defaultTrainingDuration:
          data.defaultTrainingDuration !== '' ? Number(data.defaultTrainingDuration) : undefined,
        maxTrainingDuration:
          data.maxTrainingDuration !== '' ? Number(data.maxTrainingDuration) : undefined,
        maxTrainingPartDuration:
          data.maxTrainingPartDuration !== '' ? Number(data.maxTrainingPartDuration) : undefined,
        minPartsDurationPercent:
          data.minPartsDurationPercent !== '' ? Number(data.minPartsDurationPercent) : undefined,
        iCalUrl: data.iCalUrl || undefined,
        appointments: [],
        teamMembers: [],
      })
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      navigate(`/teams/${saved.id}`)
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })
        ?.response?.data
      setSaveError(data?.errors?.join(', ') ?? data?.message ?? t('teams.saveFailed'))
    },
  })

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{t('teams.newTeam')}</h1>
      </div>

      <form
        onSubmit={handleSubmit((data) => {
          setSaveError(null)
          mutation.mutate(data)
        })}
        className="space-y-4"
      >
        <TeamSettingsFields
          t={t}
          register={register}
          errors={errors}
          ageGroups={ageGroups}
          seasons={seasons}
        />

        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-2">
          <Button type="button" variant="outline" onClick={() => navigate('/teams')}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            {t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}
