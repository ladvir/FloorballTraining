import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, Users } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { seasonsApi, teamsApi, clubsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Název sezóny je povinný'),
  startDate: z.string().min(1, 'Datum začátku je povinné'),
  endDate: z.string().min(1, 'Datum konce je povinné'),
  clubId: z.number({ error: 'Klub je povinný' }).min(1, 'Klub je povinný'),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: 'Datum konce musí být po datu začátku',
  path: ['endDate'],
})

type FormData = z.infer<typeof schema>

// ── Page ─────────────────────────────────────────────────────────────────────

export function SeasonFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([])
  const { isAdmin, activeClubId } = useAuthStore()

  const { data: existingSeason, isLoading: loadingSeason } = useQuery({
    queryKey: ['season', id],
    queryFn: () => seasonsApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
    enabled: isAdmin,
  })

  const { data: allTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', startDate: '', endDate: '', clubId: activeClubId ?? 0 },
  })

  const watchClubId = watch('clubId')

  useEffect(() => {
    if (existingSeason) {
      reset({
        name: existingSeason.name,
        startDate: existingSeason.startDate.slice(0, 10),
        endDate: existingSeason.endDate.slice(0, 10),
        clubId: existingSeason.clubId ?? activeClubId ?? 0,
      })
      setSelectedTeamIds((existingSeason.teams ?? []).map((t) => t!.id))
    }
  }, [existingSeason, reset, activeClubId])

  // Filter teams by selected club
  const filteredTeams = allTeams?.filter((t) => t.clubId === watchClubId) ?? []

  const toggleTeam = (teamId: number) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((x) => x !== teamId) : [...prev, teamId]
    )
  }

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const teams = (allTeams ?? [])
        .filter((t) => selectedTeamIds.includes(t.id))
        .map((t) => ({
          id: t.id,
          name: t.name,
          ageGroupId: t.ageGroupId ?? 0,
          ageGroup: t.ageGroup ?? { id: t.ageGroupId ?? 0, name: '', description: '' },
          clubId: t.clubId ?? 0,
          club: { id: t.clubId ?? 0, name: '' },
          appointments: [],
          teamMembers: [],
        }))

      const dto = {
        id: isEdit ? Number(id) : 0,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        clubId: data.clubId,
        teams,
      }

      return isEdit ? seasonsApi.update(dto) : seasonsApi.create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      navigate('/seasons')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Uložení selhalo. Zkuste to prosím znovu.'
      setSaveError(msg)
    },
  })

  if (isEdit && loadingSeason) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/seasons')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Upravit sezónu' : 'Nová sezóna'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((data) => { setSaveError(null); mutation.mutate(data) })} className="space-y-4">
        <Card>
          <CardContent className="space-y-4 py-4">
            {/* Club selector */}
            {isAdmin && clubs ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Klub</label>
                <select
                  value={watchClubId || ''}
                  onChange={(e) => {
                    const newClubId = Number(e.target.value)
                    setValue('clubId', newClubId)
                    // Clear team selection when club changes
                    setSelectedTeamIds([])
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Vyberte klub</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.clubId && (
                  <p className="mt-1 text-xs text-red-500">{errors.clubId.message}</p>
                )}
              </div>
            ) : (
              <input type="hidden" {...register('clubId', { valueAsNumber: true })} />
            )}

            <Input
              label="Název sezóny"
              placeholder="např. 2025/2026"
              error={errors.name?.message}
              {...register('name')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Začátek"
                type="date"
                error={errors.startDate?.message}
                {...register('startDate')}
              />
              <Input
                label="Konec"
                type="date"
                error={errors.endDate?.message}
                {...register('endDate')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Teams */}
        <Card>
          <CardContent className="py-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Týmy v sezóně
                {selectedTeamIds.length > 0 && (
                  <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                    {selectedTeamIds.length}
                  </span>
                )}
              </p>
            </div>

            {!filteredTeams.length ? (
              <p className="text-sm text-gray-400">
                {watchClubId ? 'Žádné týmy k dispozici pro vybraný klub.' : 'Nejdříve vyberte klub.'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredTeams.map((team) => {
                  const selected = selectedTeamIds.includes(team.id)
                  return (
                    <label
                      key={team.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                        selected ? 'bg-sky-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        checked={selected}
                        onChange={() => toggleTeam(team.id)}
                      />
                      <span className={`text-sm ${selected ? 'font-medium text-sky-700' : 'text-gray-700'}`}>
                        {team.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {saveError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/seasons')}>
            Zrušit
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            Uložit sezónu
          </Button>
        </div>
      </form>
    </div>
  )
}
