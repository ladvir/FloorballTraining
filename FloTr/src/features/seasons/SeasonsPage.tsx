import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { seasonsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { SeasonDto } from '../../types/domain.types'

export function SeasonsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<SeasonDto | null>(null)
  const { activeClubId } = useAuthStore()

  const { data: seasons, isLoading } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => seasonsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] })
      setDeleteTarget(null)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Sezóny"
        action={
          <Button size="sm" onClick={() => navigate('/seasons/new')}>
            <Plus className="h-4 w-4" />
            Nová sezóna
          </Button>
        }
      />

      {!seasons?.length ? (
        <EmptyState
          title="Žádné sezóny"
          description="Zatím nebyla vytvořena žádná sezóna."
          action={
            <Button size="sm" onClick={() => navigate('/seasons/new')}>
              <Plus className="h-4 w-4" />
              Vytvořit první sezónu
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Název</th>
                <th className="px-4 py-3 text-left">Od</th>
                <th className="px-4 py-3 text-left">Do</th>
                <th className="px-4 py-3 text-left">Týmy</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {seasons.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{format(parseISO(s.startDate), 'd. M. yyyy')}</td>
                  <td className="px-4 py-3 text-gray-600">{format(parseISO(s.endDate), 'd. M. yyyy')}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.teams?.length
                      ? s.teams.map((t) => t!.name).join(', ')
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/seasons/${s.id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Smazat sezónu"
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600">
          Opravdu chcete smazat sezónu <strong>{deleteTarget?.name}</strong>? Tato akce je nevratná.
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
