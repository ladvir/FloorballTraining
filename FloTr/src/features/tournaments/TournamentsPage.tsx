import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Trophy, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { tournamentsApi } from '../../api/index'

export function TournamentsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

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
        title="Turnaje"
        description="Plánuj rozlosování, zaznamenávej výsledky a sleduj pořadí. Turnaje se ukládají a můžeš se k nim vracet."
        action={
          <Button size="sm" onClick={() => navigate('/tournaments/new')}>
            <Plus className="h-4 w-4" /> Nový turnaj
          </Button>
        }
      />

      {!list || list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Zatím žádné turnaje. Vytvoř první tlačítkem výše.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {t.format === 'round-robin-playoff' ? 'Skupina + playoff' : 'Skupina'}
                    </span>
                    <span>{t.teamCount} týmů</span>
                    <span>{t.playedCount}/{t.matchCount} zápasů</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Upraveno {format(parseISO(t.updatedAt), 'd.M.yyyy HH:mm')}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Smazat turnaj „${t.name}"?`)) deleteMutation.mutate(t.id)
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
    </div>
  )
}
