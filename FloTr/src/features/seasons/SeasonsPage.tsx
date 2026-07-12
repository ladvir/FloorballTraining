import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { seasonsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { SeasonDto } from '../../types/domain.types'

export function SeasonsPage() {
  const { t } = useTranslation()
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
        title={t('seasons.title')}
        action={
          <Button size="sm" onClick={() => navigate('/seasons/new')}>
            <Plus className="h-4 w-4" />
            {t('seasons.newSeason')}
          </Button>
        }
      />

      {!seasons?.length ? (
        <EmptyState
          title={t('seasons.emptyTitle')}
          description={t('seasons.emptyDesc')}
          action={
            <Button size="sm" onClick={() => navigate('/seasons/new')}>
              <Plus className="h-4 w-4" />
              {t('seasons.emptyDesc')}
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">{t('seasons.colName')}</th>
                <th className="px-4 py-3 text-left">{t('seasons.colStart')}</th>
                <th className="px-4 py-3 text-left">{t('seasons.colEnd')}</th>
                <th className="px-4 py-3 text-left">{t('seasons.colTeams')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {seasons.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(parseISO(s.startDate), 'd. M. yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(parseISO(s.endDate), 'd. M. yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.teams?.length ? (
                      s.teams.map((tm) => tm!.name).join(', ')
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
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
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}>
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
        title={t('seasons.deleteConfirm')}
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600">
          {t('seasons.deleteConfirm')} <strong>{deleteTarget?.name}</strong>?{' '}
          {t('common.irreversible')}
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
    </div>
  )
}
