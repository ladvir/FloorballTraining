import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Trophy, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { tournamentsApi } from '../../api/index'
import { useConfirm } from '../../store/confirmStore'

export function TournamentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const confirm = useConfirm()

  const { data: list, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tournamentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t('tournaments.title')}
        description={t('tournaments.description')}
        action={
          <Button size="sm" onClick={() => navigate('/tournaments/new')}>
            <Plus className="h-4 w-4" /> {t('tournaments.newTournament')}
          </Button>
        }
      />

      {!list || list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            {t('tournaments.noTournaments')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((tournament) => (
            <Card key={tournament.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-gray-900">{tournament.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {tournament.format === 'round-robin-playoff'
                        ? t('tournaments.standings')
                        : t('common.type')}
                    </span>
                    <span>
                      {tournament.teamCount} {t('common.team')}
                    </span>
                    <span>
                      {tournament.playedCount}/{tournament.matchCount} {t('tournaments.addMatch')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('common.updatedAt')}{' '}
                      {format(parseISO(tournament.updatedAt), 'd.M.yyyy HH:mm')}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirm(`${t('tournaments.deleteTournament')} „${tournament.name}"?`, () =>
                      deleteMutation.mutate(tournament.id)
                    )
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title={t('common.delete')}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
