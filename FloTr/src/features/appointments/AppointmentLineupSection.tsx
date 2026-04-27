import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Plus, Pencil, Eye } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { lineupsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

interface Props {
  appointmentId: number
  teamId: number
}

export function AppointmentLineupSection({ appointmentId, teamId }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { effectiveRole, user } = useAuthStore()
  const coachTeamIds = user?.coachTeamIds ?? []

  const canEdit =
    effectiveRole === 'Admin' ||
    effectiveRole === 'ClubAdmin' ||
    effectiveRole === 'HeadCoach' ||
    (effectiveRole === 'Coach' && coachTeamIds.includes(teamId))

  const { data, isLoading } = useQuery({
    queryKey: ['appointment-lineup', appointmentId],
    queryFn: () => lineupsApi.getByAppointment(appointmentId),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: () => lineupsApi.create({
      teamId,
      appointmentId,
      name: 'Sestava na zápas',
      formationTemplateId: 1,
      formationCount: 3,
      isShared: false,
      roster: [],
      formations: [],
    }),
    onSuccess: (lineup) => {
      qc.invalidateQueries({ queryKey: ['appointment-lineup', appointmentId] })
      navigate(`/lineups/${lineup.id}/edit`)
    },
  })

  if (isLoading) return null

  const lineup = data ?? null

  return (
    <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-800">Sestava</span>
        </div>
        {lineup ? (
          <div className="flex items-center gap-2">
            {canEdit ? (
              <button
                onClick={() => navigate(`/lineups/${lineup.id}/edit`)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                <Pencil className="h-3 w-3" />
                Upravit
              </button>
            ) : (
              <button
                onClick={() => navigate(`/lineups/${lineup.id}`)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                <Eye className="h-3 w-3" />
                Zobrazit
              </button>
            )}
          </div>
        ) : canEdit ? (
          <Button size="sm" variant="outline" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
            <Plus className="h-3 w-3" /> Vytvořit
          </Button>
        ) : null}
      </div>
      {lineup ? (
        <p className="text-sm text-violet-700">
          {lineup.name} · {lineup.formationCount} formací · {lineup.roster.filter((r) => r.isAvailable).length} hráčů
        </p>
      ) : (
        <p className="text-xs text-violet-600">{canEdit ? 'Sestava zatím nebyla vytvořena.' : 'Sestava není připravená.'}</p>
      )}
    </div>
  )
}
