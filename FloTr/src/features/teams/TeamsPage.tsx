import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users, Clock, Copy, ClipboardCheck, Eye, LayoutGrid } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { teamsApi, seasonsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TeamDto, SeasonDto } from '../../types/domain.types'

function getCurrentSeason(seasons: SeasonDto[] | undefined): SeasonDto | undefined {
  if (!seasons?.length) return undefined
  const now = new Date().toISOString()
  return seasons.find((s) => s.startDate <= now && s.endDate >= now) ?? seasons[0]
}

export function TeamsPage() {
  const { isAdmin, isHeadCoach, isCoach, activeClubId } = useAuthStore()
  const canManage = isAdmin || isHeadCoach
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<TeamDto | null>(null)
  const [copyTarget, setCopyTarget] = useState<TeamDto | null>(null)

  const { data: teams, isLoading: loadingTeams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const { data: seasons, isLoading: loadingSeasons } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })

  const currentSeason = useMemo(() => getCurrentSeason(seasons), [seasons])
  const [filterSeasonId, setFilterSeasonId] = useState<number | '' | 'all'>('')

  // Default to current season once loaded
  const effectiveSeasonId = filterSeasonId === '' && currentSeason ? currentSeason.id : filterSeasonId

  const filteredTeams = useMemo(() => {
    if (!teams) return []
    if (effectiveSeasonId === 'all') return teams
    if (typeof effectiveSeasonId === 'number') return teams.filter((t) => t.seasonId === effectiveSeasonId)
    return teams
  }, [teams, effectiveSeasonId])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setDeleteTarget(null)
    },
  })

  if (loadingTeams || loadingSeasons) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Týmy"
        action={
          canManage ? (
            <Button size="sm" onClick={() => navigate('/teams/new')}>
              <Plus className="h-4 w-4" />
              Nový tým
            </Button>
          ) : undefined
        }
      />

      {/* Season filter */}
      {seasons && seasons.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Sezóna:</label>
          <select
            value={effectiveSeasonId}
            onChange={(e) => setFilterSeasonId(e.target.value === 'all' ? 'all' : e.target.value ? Number(e.target.value) : '')}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Všechny sezóny</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {effectiveSeasonId !== 'all' && effectiveSeasonId && (
            <span className="text-xs text-gray-400">
              {filteredTeams.length} {filteredTeams.length === 1 ? 'tým' : filteredTeams.length < 5 ? 'týmy' : 'týmů'}
            </span>
          )}
        </div>
      )}

      {!filteredTeams.length ? (
        <EmptyState
          title="Žádné týmy"
          description={effectiveSeasonId !== 'all' ? 'V této sezóně nejsou žádné týmy.' : 'Zatím nebyl vytvořen žádný tým.'}
          action={
            canManage ? (
              <Button size="sm" onClick={() => navigate('/teams/new')}>
                <Plus className="h-4 w-4" />
                Vytvořit první tým
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const season = seasons?.find((s) => s.id === team.seasonId)
            return (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{team.name}</h3>
                    {season && effectiveSeasonId === 'all' && (
                      <span className="ml-2 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {season.name}
                      </span>
                    )}
                  </div>

                  {team.ageGroup && (
                    <p className="mt-1 text-xs text-gray-400">{team.ageGroup.name}</p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                    {(team.personsMin != null || team.personsMax != null) && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.personsMin ?? '?'}–{team.personsMax ?? '?'} hráčů
                      </span>
                    )}
                    {team.defaultTrainingDuration != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {team.defaultTrainingDuration} min
                      </span>
                    )}
                    {team.teamMembers && team.teamMembers.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.teamMembers.length} členů
                      </span>
                    )}
                  </div>

                  {(canManage || isCoach) && (
                    <div className="mt-3 flex gap-2">
                      {canManage ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/teams/${team.id}/edit`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Upravit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/teams/${team.id}`)}
                          title="Detail týmu"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detail
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/testing/team/${team.id}`)}
                        title="Testování týmu"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/teams/${team.id}/lineups`)}
                        title="Sestavy týmu"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCopyTarget(team)}
                            title="Kopírovat do jiné sezóny"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTarget(team)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Smazat tým"
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600">
          Opravdu chcete smazat tým <strong>{deleteTarget?.name}</strong>? Tato akce je nevratná.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Zrušit
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Smazat
          </Button>
        </div>
      </Modal>

      {/* Copy to season */}
      {copyTarget && (
        <CopyToSeasonModal
          team={copyTarget}
          seasons={seasons ?? []}
          onClose={() => setCopyTarget(null)}
        />
      )}
    </div>
  )
}

// ── Copy to Season Modal ───────────────────────────────────────────────────

function CopyToSeasonModal({
  team,
  seasons,
  onClose,
}: {
  team: TeamDto
  seasons: SeasonDto[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [seasonId, setSeasonId] = useState<number | ''>('')
  const [newName, setNewName] = useState(team.name)
  const [copyMembers, setCopyMembers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const otherSeasons = seasons.filter((s) => s.id !== team.seasonId)

  const mutation = useMutation({
    mutationFn: () =>
      teamsApi.copyToSeason(team.id, {
        seasonId: Number(seasonId),
        newName: newName !== team.name ? newName : undefined,
        copyMembers,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      onClose()
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      setError(data?.message ?? 'Kopírování selhalo.')
    },
  })

  return (
    <Modal isOpen onClose={onClose} title="Kopírovat tým do sezóny" maxWidth="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Kopírovat tým <strong>{team.name}</strong> do jiné sezóny.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cílová sezóna</label>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">— vyberte sezónu —</option>
            {otherSeasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <Input
          label="Název nového týmu"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={team.name}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={copyMembers}
            onChange={(e) => setCopyMembers(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
          />
          <span className="text-sm text-gray-700">Kopírovat i hráče</span>
        </label>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Zrušit</Button>
          <Button
            size="sm"
            disabled={!seasonId || !newName.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Kopírování…' : 'Kopírovat'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
