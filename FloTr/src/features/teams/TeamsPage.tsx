import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Clock,
  Copy,
  ClipboardCheck,
  Eye,
  LayoutGrid,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

// Remember the chosen season across navigation (e.g. opening a team detail and
// coming back) so the list doesn't snap back to the current season.
const SEASON_FILTER_KEY = 'flotr_teams_season'

function readStoredSeason(): number | '' | 'all' {
  const raw = sessionStorage.getItem(SEASON_FILTER_KEY)
  if (raw === 'all') return 'all'
  if (raw && !Number.isNaN(Number(raw))) return Number(raw)
  return ''
}

export function TeamsPage() {
  const { t } = useTranslation()
  const { isAdmin, isHeadCoach, isCoach, activeClubId } = useAuthStore()
  const canManage = isAdmin || isHeadCoach
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<TeamDto | null>(null)
  const [copyTarget, setCopyTarget] = useState<TeamDto | null>(null)

  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  })
  const { data: seasons, isLoading: loadingSeasons } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })

  const currentSeason = useMemo(() => getCurrentSeason(seasons), [seasons])
  const [filterSeasonId, setFilterSeasonId] = useState<number | '' | 'all'>(() =>
    readStoredSeason()
  )

  const updateSeasonFilter = (val: number | '' | 'all') => {
    setFilterSeasonId(val)
    if (val === '') sessionStorage.removeItem(SEASON_FILTER_KEY)
    else sessionStorage.setItem(SEASON_FILTER_KEY, String(val))
  }

  // A persisted season may belong to a club the user has since switched away from;
  // ignore it if it isn't among the loaded seasons.
  const selectedSeasonValid =
    filterSeasonId === '' ||
    filterSeasonId === 'all' ||
    (seasons?.some((s) => s.id === filterSeasonId) ?? false)

  // When an invalid stored season is detected after seasons load, clear it from
  // sessionStorage so it doesn't re-appear on the next navigation.
  useEffect(() => {
    if (!selectedSeasonValid && seasons) {
      sessionStorage.removeItem(SEASON_FILTER_KEY)
    }
  }, [selectedSeasonValid, seasons])

  // Default to current season on first load (filterSeasonId === '') and when the
  // stored season is no longer valid (stale ID from a previous club/sync).
  const effectiveSeasonId =
    (filterSeasonId === '' || !selectedSeasonValid) && currentSeason
      ? currentSeason.id
      : filterSeasonId

  const filteredTeams = useMemo(() => {
    if (!teams) return []
    if (effectiveSeasonId === 'all') return teams
    if (typeof effectiveSeasonId === 'number')
      return teams.filter((team) => team.seasonId === effectiveSeasonId)
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
        title={t('teams.title')}
        action={
          canManage ? (
            <Button size="sm" onClick={() => navigate('/teams/new')}>
              <Plus className="h-4 w-4" />
              {t('teams.newTeam')}
            </Button>
          ) : undefined
        }
      />

      {/* Season filter */}
      {seasons && seasons.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">{t('teams.formSeason')}:</label>
          <select
            value={effectiveSeasonId}
            onChange={(e) =>
              updateSeasonFilter(
                e.target.value === 'all' ? 'all' : e.target.value ? Number(e.target.value) : ''
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">{t('teams.allSeasons')}</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {effectiveSeasonId !== 'all' && effectiveSeasonId && (
            <span className="text-xs text-gray-400">
              {filteredTeams.length}{' '}
              {filteredTeams.length === 1
                ? t('teams.teamCountSingular')
                : filteredTeams.length < 5
                  ? t('teams.teamCountFew')
                  : t('teams.teamCountMany')}
            </span>
          )}
        </div>
      )}

      {!filteredTeams.length ? (
        <EmptyState
          title={t('teams.emptyTitle')}
          description={effectiveSeasonId !== 'all' ? t('teams.noTeamsDesc') : t('teams.emptyDesc')}
          action={
            canManage ? (
              <Button size="sm" onClick={() => navigate('/teams/new')}>
                <Plus className="h-4 w-4" />
                {t('teams.newTeam')}
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
                        {team.personsMin ?? '?'}–{team.personsMax ?? '?'}{' '}
                        {t('teams.colMembers').toLowerCase()}
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
                        {team.teamMembers.length} {t('teams.colMembers').toLowerCase()}
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
                          {t('common.edit')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/teams/${team.id}/edit`)}
                          title={t('teams.openTeam')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t('teams.openTeam')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/testing/team/${team.id}`)}
                        title={t('teams.testingTeam')}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/teams/${team.id}/lineups`)}
                        title={t('teams.lineupsTeam')}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCopyTarget(team)}
                            title={t('teams.copyToSeason')}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeleteTarget(team)}>
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
        title={t('teams.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600">
          {t('teams.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {t('common.delete')}
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
  const { t } = useTranslation()
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
      setError(data?.message ?? t('teams.copyFailed'))
    },
  })

  return (
    <Modal isOpen onClose={onClose} title={t('teams.copyTeamToSeason')} maxWidth="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('teams.copyIntro')} <strong>{team.name}</strong>
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('teams.targetSeason')}
          </label>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">{t('teams.selectSeason')}</option>
            {otherSeasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label={t('teams.formName')}
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
          <span className="text-sm text-gray-700">{t('teams.copyMembers')}</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            disabled={!seasonId || !newName.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t('teams.copying') : t('teams.copyBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
