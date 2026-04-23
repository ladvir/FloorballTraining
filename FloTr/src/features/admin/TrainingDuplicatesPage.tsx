import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, AlertTriangle, ExternalLink, Lock, Eye, GitCompare } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { trainingsApi } from '../../api/trainings.api'
import { TrainingDetailModal } from '../trainings/TrainingDetailModal'
import { TrainingCompareModal } from '../trainings/TrainingCompareModal'
import type { DuplicateGroupDto, SimilarityTier } from '../../types/domain.types'

export function TrainingDuplicatesPage() {
  const [tier, setTier] = useState<SimilarityTier>('A')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [compareIds, setCompareIds] = useState<number[] | null>(null)
  const queryClient = useQueryClient()

  const { data: groups = [], isLoading, isFetching } = useQuery({
    queryKey: ['training-duplicates', tier],
    queryFn: () => trainingsApi.getDuplicates(tier),
  })

  const selectedList = useMemo(() => {
    const all = groups.flatMap((g) => g.trainings)
    return all.filter((t) => selected.has(t.id))
  }, [groups, selected])

  const deletableSelected = useMemo(
    () => selectedList.filter((t) => t.appointmentCount === 0),
    [selectedList],
  )

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await trainingsApi.delete(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-duplicates'] })
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      setSelected(new Set())
      setConfirmOpen(false)
      setDeleteError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Smazání některých tréninků selhalo.'
      setDeleteError(msg)
    },
  })

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectGroupExceptFirst = (group: DuplicateGroupDto) => {
    setSelected((prev) => {
      const next = new Set(prev)
      // Skip the first deletable training (keep it) and all trainings used in appointments
      const deletable = group.trainings.filter((t) => t.appointmentCount === 0)
      deletable.slice(1).forEach((t) => next.add(t.id))
      return next
    })
  }

  const clearGroup = (group: DuplicateGroupDto) => {
    setSelected((prev) => {
      const next = new Set(prev)
      group.trainings.forEach((t) => next.delete(t.id))
      return next
    })
  }

  const switchTier = (newTier: SimilarityTier) => {
    setTier(newTier)
    setSelected(new Set())
    setDeleteError(null)
  }

  if (isLoading) return <LoadingSpinner />

  const tierACount = tier === 'A' ? groups.reduce((sum, g) => sum + g.trainings.length, 0) : null
  const tierBCount = tier === 'B' ? groups.reduce((sum, g) => sum + g.trainings.length, 0) : null

  return (
    <div>
      <PageHeader
        title="Duplicity tréninků"
        description="Přehled podobných tréninků. Zvolené duplicity lze smazat."
      />

      <div className="mb-4 flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => switchTier('A')}
          className={`relative px-4 py-2 text-sm font-medium transition-colors ${
            tier === 'A'
              ? 'text-sky-600 border-b-2 border-sky-500 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Duplicity (A)
          {tierACount != null && tierACount > 0 && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
              {tierACount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => switchTier('B')}
          className={`relative px-4 py-2 text-sm font-medium transition-colors ${
            tier === 'B'
              ? 'text-sky-600 border-b-2 border-sky-500 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Podobné (B)
          {tierBCount != null && tierBCount > 0 && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              {tierBCount}
            </span>
          )}
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {tier === 'A'
            ? 'Tréninky se stejnými aktivitami a délkou v toleranci ±15 %.'
            : 'Tréninky s váženou podobností aktivit ≥ 75 %.'}
          {isFetching && ' · načítání…'}
        </p>
        <div className="flex items-center gap-2">
          {selected.size >= 2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompareIds([...selected])}
            >
              <GitCompare className="h-4 w-4" />
              Porovnat vybrané ({selected.size})
            </Button>
          )}
          {deletableSelected.length > 0 && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Smazat vybrané ({deletableSelected.length})
            </Button>
          )}
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState
          title={tier === 'A' ? 'Žádné duplicity' : 'Žádné podobné tréninky'}
          description={tier === 'A'
            ? 'Nebyly nalezeny tréninky se shodnými aktivitami.'
            : 'Nebyly nalezeny tréninky s podobným rozvržením aktivit.'}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const groupSelectedCount = group.trainings.filter((t) => selected.has(t.id)).length
            return (
              <div key={group.groupKey} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {group.trainings.length} tréninků
                    </span>
                    {tier === 'B' && (
                      <span className="text-xs text-gray-500">
                        podobnost ≥ {Math.round(group.minScore * 100)} %
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {groupSelectedCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => clearGroup(group)}
                        className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                      >
                        Odznačit skupinu
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => selectGroupExceptFirst(group)}
                        className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                        title="Označit všechny kromě prvního jako duplicity"
                      >
                        Označit duplicity
                      </button>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-gray-100">
                  {group.trainings.map((t) => {
                    const locked = t.appointmentCount > 0
                    return (
                      <li key={t.id} className={`flex items-center gap-3 px-4 py-2.5 ${locked ? 'bg-gray-50/60' : 'hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggle(t.id)}
                          title={locked ? 'Lze zahrnout do porovnání, ale nebude smazán' : undefined}
                          className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/trainings/${t.id}/edit`}
                              className="truncate text-sm font-medium text-gray-900 hover:text-sky-600 hover:underline"
                            >
                              {t.name}
                            </Link>
                            {t.isDraft && (
                              <span className="inline-flex items-center rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
                                rozpracovaný
                              </span>
                            )}
                            {locked && (
                              <span
                                className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                                title="Trénink je naplánovaný v události a nelze jej smazat"
                              >
                                <Lock className="h-2.5 w-2.5" />
                                {t.appointmentCount === 1 ? '1 událost' : `${t.appointmentCount} událostí`}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                            <span>{t.duration} min</span>
                            {t.createdByUserName && (
                              <>
                                <span>·</span>
                                <span>{t.createdByUserName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewId(t.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-sky-600"
                          title="Náhled tréninku"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/trainings/${t.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-sky-600"
                          title="Otevřít v novém panelu"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={confirmOpen}
        onClose={() => !deleteMutation.isPending && setConfirmOpen(false)}
        title="Smazat vybrané tréninky?"
        maxWidth="lg"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              Opravdu chcete trvale smazat {deletableSelected.length}{' '}
              {deletableSelected.length === 1 ? 'trénink' : deletableSelected.length < 5 ? 'tréninky' : 'tréninků'}? Tuto akci nelze vrátit.
            </p>
            <ul className="mt-3 max-h-60 space-y-1 overflow-y-auto text-sm">
              {deletableSelected.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <span className="truncate">{t.name}</span>
                  <span className="text-xs text-gray-500">· {t.duration} min</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmOpen(false)}
            disabled={deleteMutation.isPending}
          >
            Zrušit
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deletableSelected.map((t) => t.id))}
          >
            <Trash2 className="h-4 w-4" />
            Smazat ({deletableSelected.length})
          </Button>
        </div>
      </Modal>

      <TrainingDetailModal
        trainingId={previewId}
        onClose={() => setPreviewId(null)}
      />

      {compareIds && compareIds.length >= 2 && (
        <TrainingCompareModal
          trainingIds={compareIds}
          onClose={() => setCompareIds(null)}
          onDeleted={(deletedId) => {
            setSelected((prev) => {
              const next = new Set(prev)
              next.delete(deletedId)
              return next
            })
            setCompareIds((prev) => prev?.filter((id) => id !== deletedId) ?? null)
          }}
        />
      )}
    </div>
  )
}
