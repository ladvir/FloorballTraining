import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { statTrackersApi, teamsApi } from '../../api/index'

interface Props {
  tournamentMatchId: number
  /** A persisted match id is required (positive). Pass 0/negative if tournament is not yet saved. */
  disabled?: boolean
}

export function TournamentMatchStatsButton({ tournamentMatchId, disabled }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, isAdmin, isHeadCoach } = useAuthStore()
  const [open, setOpen] = useState(false)

  const teamIds = user?.coachTeamIds ?? []

  const { data: teams } = useQuery({
    queryKey: ['teams-all'],
    queryFn: teamsApi.getAll,
    enabled: open && (isAdmin || isHeadCoach || teamIds.length === 0),
  })

  const myTeams = (() => {
    if (isAdmin || isHeadCoach) return teams ?? []
    if (!teams) return []
    return teams.filter((t) => teamIds.includes(t.id))
  })()

  const { data: existing } = useQuery({
    queryKey: ['stat-tracker-match', tournamentMatchId],
    queryFn: () => statTrackersApi.getForEvent({ type: 'tournamentMatch', id: tournamentMatchId }),
    enabled: open && tournamentMatchId > 0,
  })

  const createMutation = useMutation({
    mutationFn: (teamId: number) =>
      statTrackersApi.create({
        eventCategory: 0,
        tournamentMatchId,
        teamId,
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['stat-tracker-match', tournamentMatchId] })
      setOpen(false)
      navigate(`/stats/${created.id}/setup`)
    },
  })

  if (tournamentMatchId <= 0 || disabled) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1 rounded p-1 text-[11px] text-gray-300"
        title="Ulož turnaj nejprve"
      >
        <BarChart3 className="h-3 w-3" /> Statistiky
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-sky-600 hover:bg-sky-50"
      >
        <BarChart3 className="h-3 w-3" /> Statistiky
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Statistiky zápasu" maxWidth="sm">
        {existing && existing.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Existující statistiky:</p>
            {existing.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/stats/${t.id}/live`)}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-sky-50"
              >
                <span className="font-medium text-gray-900">{t.teamName}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {t.participants.length} hráčů • {t.metrics.length} údajů
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="mb-2 text-sm text-gray-600">Vytvořit pro tým:</p>
          <div className="space-y-1.5">
            {myTeams.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Nemáš dostupný žádný tým.</p>
            ) : (
              myTeams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => createMutation.mutate(t.id)}
                  disabled={createMutation.isPending}
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-emerald-50"
                >
                  <span className="font-medium text-gray-900">{t.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Zavřít
          </Button>
        </div>
      </Modal>
    </>
  )
}
