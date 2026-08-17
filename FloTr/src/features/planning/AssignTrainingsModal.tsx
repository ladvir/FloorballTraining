import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { trainingsApi } from '../../api/trainings.api'
import { planningApi } from '../../api/planning.api'
import { toast } from '../../utils/toast'
import type { MicrocycleDto } from '../../types/domain.types'

interface AssignTrainingsModalProps {
  isOpen: boolean
  onClose: () => void
  microcycle: MicrocycleDto
}

interface Item {
  trainingId: number
  note: string
}

/** Attach recommended trainings from the library to a microcycle (replace-set save). */
export function AssignTrainingsModal({ isOpen, onClose, microcycle }: AssignTrainingsModalProps) {
  if (!isOpen) return null
  // Keyed by microcycle so remounting (open/switch) re-initializes the working set
  return <AssignTrainingsInner key={microcycle.id} onClose={onClose} microcycle={microcycle} />
}

function AssignTrainingsInner({
  onClose,
  microcycle,
}: {
  onClose: () => void
  microcycle: MicrocycleDto
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [items, setItems] = useState<Item[]>(() =>
    [...microcycle.recommendedTrainings]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((rt) => ({ trainingId: rt.trainingId, note: rt.note ?? '' }))
  )
  const [search, setSearch] = useState('')

  const { data: trainings } = useQuery({ queryKey: ['trainings'], queryFn: trainingsApi.getAll })

  const trainingById = useMemo(
    () => new Map((trainings ?? []).map((tr) => [tr.id, tr])),
    [trainings]
  )

  const available = useMemo(() => {
    const chosen = new Set(items.map((i) => i.trainingId))
    const q = search.trim().toLowerCase()
    return (trainings ?? [])
      .filter((tr) => !chosen.has(tr.id))
      .filter((tr) => !q || tr.name.toLowerCase().includes(q))
      .slice(0, 30)
  }, [trainings, items, search])

  const add = (trainingId: number) => setItems((prev) => [...prev, { trainingId, note: '' }])
  const remove = (trainingId: number) =>
    setItems((prev) => prev.filter((i) => i.trainingId !== trainingId))
  const move = (index: number, dir: -1 | 1) =>
    setItems((prev) => {
      const target = index + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  const setNote = (trainingId: number, note: string) =>
    setItems((prev) => prev.map((i) => (i.trainingId === trainingId ? { ...i, note } : i)))

  const mutation = useMutation({
    mutationFn: () =>
      planningApi.setMicrocycleTrainings(
        microcycle.id,
        items.map((i, index) => ({
          trainingId: i.trainingId,
          note: i.note || null,
          sortOrder: index + 1,
        }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasonPlan'] })
      toast.success(t('planning.saved'))
      onClose()
    },
    onError: () => toast.error(t('planning.saveFailed')),
  })

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${t('planning.assignTrainings')}: ${microcycle.name}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Selected items */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">
            {t('planning.recommendedTrainings')}
            {items.length > 0 && (
              <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                {items.length}
              </span>
            )}
          </p>
          {!items.length ? (
            <p className="text-sm text-gray-400">{t('planning.noTrainingsAssigned')}</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item, index) => {
                const training = trainingById.get(item.trainingId)
                return (
                  <li
                    key={item.trainingId}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {training?.name ?? `#${item.trainingId}`}
                        {training?.duration ? (
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            {training.duration} min
                          </span>
                        ) : null}
                      </p>
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => setNote(item.trainingId, e.target.value)}
                        placeholder={t('planning.trainingNotePlaceholder')}
                        maxLength={500}
                        className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs placeholder:text-gray-300 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.trainingId)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Library search */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">
            {t('planning.trainingLibrary')}
          </p>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('planning.searchTrainings')}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <ul className="max-h-44 space-y-1 overflow-y-auto">
            {available.map((training) => (
              <li key={training.id}>
                <button
                  type="button"
                  onClick={() => add(training.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sky-50"
                >
                  <Plus className="h-3.5 w-3.5 flex-shrink-0 text-sky-500" />
                  <span className="truncate font-medium text-gray-700">{training.name}</span>
                  {training.duration ? (
                    <span className="ml-auto flex-shrink-0 text-xs text-gray-400">
                      {training.duration} min
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            {!available.length && (
              <li className="px-2 py-1.5 text-sm text-gray-400">
                {t('planning.noTrainingsFound')}
              </li>
            )}
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
