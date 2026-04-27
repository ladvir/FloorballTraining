import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Users, Link2, Eye, EyeOff } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { lineupsApi, teamsApi } from '../../api/index'

export function LineupsListPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const tid = Number(teamId)

  const { data: team } = useQuery({
    queryKey: ['team', tid],
    queryFn: () => teamsApi.getById(tid),
    enabled: !!tid,
  })

  const { data: lineups, isLoading } = useQuery({
    queryKey: ['lineups', 'team', tid],
    queryFn: () => lineupsApi.getByTeam(tid),
    enabled: !!tid,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => lineupsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lineups', 'team', tid] }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/teams/${tid}`)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Sestavy — {team?.name ?? ''}</h1>
        <Button size="sm" className="ml-auto" onClick={() => navigate(`/teams/${tid}/lineups/new`)}>
          <Plus className="h-4 w-4" /> Nová sestava
        </Button>
      </div>

      {(!lineups || lineups.length === 0) ? (
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
                  onClick={() => {
                    if (confirm(`Smazat sestavu „${l.name}"?`)) deleteMutation.mutate(l.id)
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Smazat"
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
