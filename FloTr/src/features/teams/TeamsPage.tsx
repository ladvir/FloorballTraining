import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users, Clock } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { teamsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TeamDto } from '../../types/domain.types'

export function TeamsPage() {
  const { isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<TeamDto | null>(null)

  const { data: teams, isLoading } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setDeleteTarget(null)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Týmy"
        action={
          isAdmin ? (
            <Button size="sm" onClick={() => navigate('/teams/new')}>
              <Plus className="h-4 w-4" />
              Nový tým
            </Button>
          ) : undefined
        }
      />

      {!teams?.length ? (
        <EmptyState
          title="Žádné týmy"
          description="Zatím nebyl vytvořen žádný tým."
          action={
            isAdmin ? (
              <Button size="sm" onClick={() => navigate('/teams/new')}>
                <Plus className="h-4 w-4" />
                Vytvořit první tým
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <h3 className="font-medium text-gray-900">{team.name}</h3>

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
                </div>

                {isAdmin && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/teams/${team.id}/edit`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Upravit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTarget(team)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
    </div>
  )
}
