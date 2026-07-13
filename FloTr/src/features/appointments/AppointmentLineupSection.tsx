import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Plus, Pencil, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { lineupsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { MatchLineupDto } from '../../types/domain.types'

interface Props {
  appointmentId: number
  teamId: number
}

export function AppointmentLineupSection({ appointmentId, teamId }: Props) {
  const { t } = useTranslation()
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

  // Team lineups — candidates that can be attached to this appointment.
  const { data: teamLineups } = useQuery({
    queryKey: ['lineups', 'team', teamId],
    queryFn: () => lineupsApi.getByTeam(teamId),
    enabled: canEdit,
  })

  const lineup = data ?? null

  const createMutation = useMutation({
    mutationFn: () =>
      lineupsApi.create({
        teamId,
        appointmentId,
        name: t('lineups.newLineup'),
        formationTemplateId: 1,
        formationCount: 3,
        isShared: false,
        roster: [],
        formations: [],
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['appointment-lineup', appointmentId] })
      qc.invalidateQueries({ queryKey: ['lineups', 'team', teamId] })
      navigate(`/lineups/${created.id}/edit`)
    },
  })

  // Attach the chosen lineup to this appointment. Full DTO is sent so roster + formations are
  // preserved; any lineup already attached here is detached first (a lineup links to one event).
  const chooseMutation = useMutation({
    mutationFn: async (chosen: MatchLineupDto) => {
      if (lineup && lineup.id !== chosen.id) {
        await lineupsApi.update(lineup.id, { ...lineup, appointmentId: null })
      }
      return lineupsApi.update(chosen.id, { ...chosen, appointmentId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment-lineup', appointmentId] })
      qc.invalidateQueries({ queryKey: ['lineups', 'team', teamId] })
    },
  })

  if (isLoading) return null

  // Unattached lineups (not tied to another event), excluding the one already attached here.
  const selectableLineups = (teamLineups ?? []).filter(
    (l) => l.appointmentId == null && l.id !== lineup?.id
  )

  const onSelectExisting = (value: string) => {
    const chosen = (teamLineups ?? []).find((l) => l.id === Number(value))
    if (chosen) chooseMutation.mutate(chosen)
  }

  return (
    <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-800">{t('lineups.title')}</span>
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2">
            {selectableLineups.length > 0 && (
              <select
                aria-label={t('lineups.selectExisting')}
                value=""
                onChange={(e) => onSelectExisting(e.target.value)}
                disabled={chooseMutation.isPending}
                className="rounded-md border border-violet-300 bg-white px-2 py-1 text-xs text-violet-800 focus:border-violet-500 focus:outline-none"
              >
                <option value="" disabled>
                  {t('lineups.selectExisting')}
                </option>
                {selectableLineups.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
            {lineup ? (
              <button
                onClick={() => navigate(`/lineups/${lineup.id}/edit`)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                <Pencil className="h-3 w-3" />
                {t('common.edit')}
              </button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
              >
                <Plus className="h-3 w-3" /> {t('common.create')}
              </Button>
            )}
          </div>
        ) : lineup ? (
          <button
            onClick={() => navigate(`/lineups/${lineup.id}`)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
          >
            <Eye className="h-3 w-3" />
            {t('common.view')}
          </button>
        ) : null}
      </div>
      {lineup ? (
        <p className="text-sm text-violet-700">
          {lineup.name} · {lineup.formationCount} formací ·{' '}
          {lineup.roster.filter((r) => r.isAvailable).length} hráčů
        </p>
      ) : (
        <p className="text-xs text-violet-600">
          {canEdit ? t('lineups.noLineupsDesc') : t('lineups.readOnly')}
        </p>
      )}
    </div>
  )
}
