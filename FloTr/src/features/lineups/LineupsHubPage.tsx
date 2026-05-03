import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Users, Plus, Trash2, Link2, Eye, EyeOff } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { lineupsApi, teamsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { LineupPositionPreview } from './components/LineupPositionPreview'
import type { MatchLineupDto } from '../../types/domain.types'

const STORAGE_KEY = 'flotr_last_lineup_team'

export function LineupsHubPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()
  const { effectiveRole, user } = useAuthStore()
  const coachTeamIds = user?.coachTeamIds ?? []

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  })

  const visibleTeams = (teams ?? []).filter((t) => {
    if (effectiveRole === 'Admin' || effectiveRole === 'ClubAdmin' || effectiveRole === 'HeadCoach') return true
    if (effectiveRole === 'Coach') return coachTeamIds.includes(t.id)
    return false
  })

  const queryTeamId = searchParams.get('teamId') ? Number(searchParams.get('teamId')) : undefined
  const storedTeamId = (() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      return v ? Number(v) : undefined
    } catch {
      return undefined
    }
  })()
  const validQueryId = queryTeamId && visibleTeams.some((t) => t.id === queryTeamId) ? queryTeamId : undefined
  const validStoredId = storedTeamId && visibleTeams.some((t) => t.id === storedTeamId) ? storedTeamId : undefined
  const selectedTeamId = validQueryId ?? validStoredId ?? visibleTeams[0]?.id

  useEffect(() => {
    if (selectedTeamId) {
      try {
        localStorage.setItem(STORAGE_KEY, String(selectedTeamId))
      } catch {
        // ignore
      }
    }
  }, [selectedTeamId])

  const { data: lineups, isLoading: lineupsLoading } = useQuery({
    queryKey: ['lineups', 'team', selectedTeamId],
    queryFn: () => lineupsApi.getByTeam(selectedTeamId!),
    enabled: !!selectedTeamId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => lineupsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lineups', 'team', selectedTeamId] }),
  })

  const [previewLineup, setPreviewLineup] = useState<MatchLineupDto | null>(null)

  function selectTeam(id: number) {
    const next = new URLSearchParams(searchParams)
    next.set('teamId', String(id))
    setSearchParams(next, { replace: true })
  }

  if (teamsLoading) return <LoadingSpinner />

  if (visibleTeams.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Sestavy" />
        <EmptyState
          title="Žádné týmy"
          description="Sestavy se tvoří pro konkrétní tým. Nejdřív vytvoř nebo se zařaď do týmu."
        />
      </div>
    )
  }

  const selectedTeam = visibleTeams.find((t) => t.id === selectedTeamId)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Sestavy"
        action={
          selectedTeamId ? (
            <Button size="sm" onClick={() => navigate(`/teams/${selectedTeamId}/lineups/new`)}>
              <Plus className="h-4 w-4" /> Nová sestava
            </Button>
          ) : undefined
        }
      />

      {visibleTeams.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {visibleTeams.map((t) => {
            const active = t.id === selectedTeamId
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTeam(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {t.name}
              </button>
            )
          })}
        </div>
      ) : selectedTeam ? (
        <p className="mb-3 text-sm text-gray-500">Tým: <span className="font-medium text-gray-700">{selectedTeam.name}</span></p>
      ) : null}

      {lineupsLoading ? (
        <LoadingSpinner />
      ) : !lineups || lineups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Tým zatím nemá žádné sestavy. Vytvoř novou tlačítkem výše.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lineups.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/lineups/${l.id}/edit`)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-gray-900">{l.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {l.formationTemplate?.name ?? '?'} · {l.formationCount} formací
                    </span>
                    {l.appointmentName && (
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {l.appointmentName}
                        {l.appointmentStart && ` (${format(parseISO(l.appointmentStart), 'd.M.yyyy')})`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {l.isShared ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {l.isShared ? 'Sdíleno s hráči' : 'Soukromé'}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLineup(l)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-sky-50 hover:text-sky-600"
                  title="Náhled formací"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Smazat sestavu „${l.name}"?`)) deleteMutation.mutate(l.id)
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Smazat"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!previewLineup}
        onClose={() => setPreviewLineup(null)}
        title={previewLineup ? `Náhled — ${previewLineup.name}` : ''}
        maxWidth="2xl"
      >
        {previewLineup && <LineupPositionPreview lineup={previewLineup} />}
      </Modal>
    </div>
  )
}
