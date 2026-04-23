import { useMemo, useState, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, User, Target, Dumbbell, Trash2, ShieldCheck, Lock, AlertTriangle } from 'lucide-react'
import type { AxiosError } from 'axios'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import type { TrainingDto, TrainingPartDto } from '../../types/domain.types'

interface Props {
  trainingIds: number[]
  onClose: () => void
  onDeleted?: (id: number) => void
  /**
   * Optional in-memory training prepended to the comparison (e.g. an unsaved
   * draft from a form). Use id=0 to mark it as unsaved. Delete/safety badges
   * are suppressed for this entry.
   */
  draftTraining?: TrainingDto
  /** Label shown on the draft column header instead of "Rozpracovaný/Kompletní". */
  draftLabel?: string
}

const envLabels: Record<number, string> = { 0: 'Kdekoliv', 1: 'Hala', 2: 'Venku' }
const difficultyLabels = ['', 'Začátečník', 'Mírně pokročilý', 'Pokročilý', 'Expert']
const intensityLabels = ['', 'Nízká', 'Střední', 'Vysoká', 'Maximální']

function allEqual<T>(values: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
  if (values.length < 2) return true
  for (let i = 1; i < values.length; i++) if (!eq(values[0], values[i])) return false
  return true
}

function sameSortedIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false
  return true
}

function partsEqual(a: TrainingPartDto | undefined, b: TrainingPartDto | undefined): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  if ((a.name ?? '') !== (b.name ?? '')) return false
  if ((a.duration ?? 0) !== (b.duration ?? 0)) return false
  if ((a.description ?? '') !== (b.description ?? '')) return false
  const aIds = (a.trainingGroups ?? []).map((g) => g.activity?.id ?? 0).filter((x) => x > 0)
  const bIds = (b.trainingGroups ?? []).map((g) => g.activity?.id ?? 0).filter((x) => x > 0)
  return sameSortedIds(aIds, bIds)
}

export function TrainingCompareModal({ trainingIds, onClose, onDeleted, draftTraining, draftLabel }: Props) {
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { isCoach } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useQueries({
    queries: trainingIds.map((id) => ({
      queryKey: ['training', id],
      queryFn: () => trainingsApi.getById(id),
    })),
  })

  const countsKey = useMemo(
    () => ['trainings-appointment-counts', [...trainingIds].sort((a, b) => a - b).join(',')],
    [trainingIds],
  )

  const {
    data: appointmentCounts,
    isSuccess: countsLoaded,
    isError: countsErrored,
  } = useQuery({
    queryKey: countsKey,
    queryFn: () => trainingsApi.getAppointmentCounts(trainingIds),
    enabled: trainingIds.length > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainingsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      queryClient.invalidateQueries({ queryKey: ['training-duplicates'] })
      queryClient.invalidateQueries({ queryKey: countsKey })
      setConfirmDeleteId(null)
      setDeleteError(null)
      onDeleted?.(id)
    },
    onError: (err: AxiosError<{ message?: string; statusCode?: number }>) => {
      const status = err.response?.status
      const serverMessage = err.response?.data?.message
      if (status === 409) {
        setDeleteError(
          serverMessage ??
            'Trénink je naplánován v událostech a nelze jej smazat. Nejprve odstraňte nebo přeplánujte tyto události.',
        )
        // Refetch counts so the UI reflects the real state.
        queryClient.invalidateQueries({ queryKey: countsKey })
      } else {
        setDeleteError(serverMessage ?? 'Smazání selhalo. Zkuste to prosím znovu.')
      }
    },
  })

  const isLoading = results.some((r) => r.isLoading)
  const fetchedTrainings = results.map((r) => r.data).filter((t): t is TrainingDto => !!t)
  const trainings = useMemo(
    () => (draftTraining ? [draftTraining, ...fetchedTrainings] : fetchedTrainings),
    [draftTraining, fetchedTrainings],
  )
  const totalColumns = trainings.length

  const maxParts = useMemo(
    () => trainings.reduce((m, t) => Math.max(m, t.trainingParts?.length ?? 0), 0),
    [trainings],
  )

  const gridStyle = { gridTemplateColumns: `minmax(140px, 180px) repeat(${totalColumns}, minmax(200px, 1fr))` }

  const body = (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-gray-900">
            Porovnání {totalColumns} tréninků
          </h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showOnlyDiffs}
              onChange={(e) => setShowOnlyDiffs(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            Jen rozdíly
          </label>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Zavřít"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {confirmDeleteId != null && (() => {
        const target = trainings.find((t) => t.id === confirmDeleteId)
        if (!target) return null
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h3 className="mb-2 text-base font-semibold text-gray-900">Smazat trénink?</h3>
              <p className="text-sm text-gray-700">
                Opravdu chcete trvale smazat trénink <strong>{target.name}</strong>? Tuto akci nelze vrátit.
              </p>
              {deleteError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="font-medium">Trénink nelze smazat</p>
                    <p className="mt-0.5 text-xs">{deleteError}</p>
                  </div>
                </div>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setConfirmDeleteId(null)
                    setDeleteError(null)
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteError ? 'Zavřít' : 'Zrušit'}
                </Button>
                {!deleteError && (
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(target.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Smazat
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : trainings.length === 0 ? (
          <p className="text-sm text-gray-500">Žádná data k porovnání.</p>
        ) : (
          <div className="grid gap-0" style={gridStyle}>
            {/* Header row: training names + status + author */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Trénink
            </div>
            {trainings.map((t, idx) => {
              const isDraftEntry = draftTraining != null && idx === 0
              const apptCount = appointmentCounts?.[t.id] ?? 0
              const canDelete = !isDraftEntry && countsLoaded && apptCount === 0
              return (
                <div key={isDraftEntry ? 'draft' : t.id} className="sticky top-0 z-10 bg-white border-b border-gray-300 px-3 py-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {t.name || (isDraftEntry ? '(bez názvu)' : '')}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {isDraftEntry ? (
                      <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 font-medium text-sky-700">
                        {draftLabel ?? 'Aktuálně editovaný (neuloženo)'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-600">
                        <span className={`h-2 w-2 rounded-full ${t.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`} />
                        {t.isDraft ? 'Rozpracovaný' : 'Kompletní'}
                      </span>
                    )}
                    {t.createdByUserName && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <User className="h-3 w-3" />
                        {t.createdByUserName}
                      </span>
                    )}
                    {!isDraftEntry && !countsLoaded && !countsErrored && (
                      <span className="inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 font-medium text-gray-400">
                        Ověřuji plánování…
                      </span>
                    )}
                    {!isDraftEntry && countsErrored && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700"
                        title="Nepodařilo se ověřit, zda je trénink naplánován v události."
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Stav nezjištěn
                      </span>
                    )}
                    {!isDraftEntry && countsLoaded && canDelete && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 font-medium text-green-700"
                        title="Trénink není naplánován v žádné události a lze jej bezpečně smazat."
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Lze bezpečně smazat
                      </span>
                    )}
                    {!isDraftEntry && countsLoaded && !canDelete && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600"
                        title="Trénink je naplánován v události a nelze jej smazat."
                      >
                        <Lock className="h-3 w-3" />
                        {apptCount === 1 ? '1 událost' : `${apptCount} událostí`}
                      </span>
                    )}
                  </div>
                  {!isDraftEntry && isCoach && canDelete && (
                    <Button
                      size="sm"
                      variant="danger"
                      className="mt-2"
                      loading={deleteMutation.isPending && confirmDeleteId === t.id}
                      onClick={() => {
                        setDeleteError(null)
                        setConfirmDeleteId(t.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Smazat
                    </Button>
                  )}
                </div>
              )
            })}

            {/* Simple value rows */}
            {renderSimpleRow('Trvání', trainings, (t) => (t.duration > 0 ? `${t.duration} min` : '—'), showOnlyDiffs)}
            {renderSimpleRow(
              'Hráči',
              trainings,
              (t) =>
                t.personsMin && t.personsMin > 0
                  ? `${t.personsMin}${t.personsMax ? `–${t.personsMax}` : '+'}`
                  : '—',
              showOnlyDiffs,
            )}
            {renderSimpleRow(
              'Brankáři',
              trainings,
              (t) =>
                t.goaliesMin && t.goaliesMin > 0
                  ? `${t.goaliesMin}${t.goaliesMax ? `–${t.goaliesMax}` : '+'}`
                  : '—',
              showOnlyDiffs,
            )}
            {renderSimpleRow(
              'Obtížnost',
              trainings,
              (t) => (t.difficulty ? difficultyLabels[t.difficulty] || String(t.difficulty) : '—'),
              showOnlyDiffs,
            )}
            {renderSimpleRow(
              'Intenzita',
              trainings,
              (t) => (t.intensity ? intensityLabels[t.intensity] || String(t.intensity) : '—'),
              showOnlyDiffs,
            )}
            {renderSimpleRow(
              'Prostředí',
              trainings,
              (t) => (t.environment != null ? envLabels[t.environment] ?? String(t.environment) : '—'),
              showOnlyDiffs,
            )}

            {/* Goals */}
            {renderGoalsRow(trainings, showOnlyDiffs)}

            {/* Age groups */}
            {renderAgeGroupsRow(trainings, showOnlyDiffs)}

            {/* Description */}
            {renderLongTextRow('Popis', trainings, (t) => t.description ?? '', showOnlyDiffs)}

            {/* Comments */}
            {renderLongTextRow('Poznámka před', trainings, (t) => t.commentBefore ?? '', showOnlyDiffs)}
            {renderLongTextRow('Poznámka po', trainings, (t) => t.commentAfter ?? '', showOnlyDiffs)}

            {/* Parts section */}
            {maxParts > 0 && (
              <>
                <div className="col-span-full mt-4 border-b border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
                     style={{ gridColumn: `1 / span ${totalColumns + 1}` }}>
                  Části tréninku
                </div>
                {Array.from({ length: maxParts }).map((_, idx) => {
                  const partsAtIdx = trainings.map((t) =>
                    (t.trainingParts ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[idx],
                  )
                  const partsMatch = allEqual(partsAtIdx, partsEqual)
                  if (showOnlyDiffs && partsMatch) return null
                  return (
                    <Fragment key={idx}>
                      <div className={`border-b border-gray-100 px-3 py-3 text-xs text-gray-500 ${!partsMatch ? 'bg-amber-50/50' : ''}`}>
                        Část {idx + 1}
                      </div>
                      {partsAtIdx.map((part, ti) => (
                        <div
                          key={ti}
                          className={`border-b border-l border-gray-100 px-3 py-3 text-sm ${!partsMatch ? 'bg-amber-50/50' : ''}`}
                        >
                          {part ? (
                            <div>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="font-medium text-gray-900">
                                  {part.name || `Část ${idx + 1}`}
                                </span>
                                <span className="text-xs text-gray-400">{part.duration} min</span>
                              </div>
                              {part.description && (
                                <p className="mb-2 text-xs text-gray-500 whitespace-pre-wrap">{part.description}</p>
                              )}
                              {part.trainingGroups && part.trainingGroups.length > 0 && (
                                <ul className="space-y-1">
                                  {part.trainingGroups.map((g, gi) => (
                                    <li key={gi} className="flex items-center gap-1.5 text-xs text-gray-600">
                                      <Dumbbell className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                      <span>{g.activity?.name || '(bez aktivity)'}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">— chybí —</span>
                          )}
                        </div>
                      ))}
                    </Fragment>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(body, document.body)
}

function renderSimpleRow(
  label: string,
  trainings: TrainingDto[],
  get: (t: TrainingDto) => string,
  showOnlyDiffs: boolean,
) {
  const values = trainings.map(get)
  const same = allEqual(values)
  if (showOnlyDiffs && same) return null
  return (
    <Fragment key={label}>
      <div className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}>
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className={`border-b border-l border-gray-100 px-3 py-2 text-sm text-gray-800 ${!same ? 'bg-amber-50/50' : ''}`}
        >
          {v}
        </div>
      ))}
    </Fragment>
  )
}

function renderLongTextRow(
  label: string,
  trainings: TrainingDto[],
  get: (t: TrainingDto) => string,
  showOnlyDiffs: boolean,
) {
  const values = trainings.map(get)
  const same = allEqual(values)
  const allEmpty = values.every((v) => !v.trim())
  if (showOnlyDiffs && (same || allEmpty)) return null
  if (allEmpty) return null
  return (
    <Fragment key={label}>
      <div className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}>
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className={`border-b border-l border-gray-100 px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap ${!same ? 'bg-amber-50/50' : ''}`}
        >
          {v || <span className="text-xs italic text-gray-400">—</span>}
        </div>
      ))}
    </Fragment>
  )
}

function renderGoalsRow(trainings: TrainingDto[], showOnlyDiffs: boolean) {
  const goalIdSets = trainings.map((t) =>
    [t.trainingGoal1, t.trainingGoal2, t.trainingGoal3]
      .filter((g) => g != null)
      .map((g) => g!.id),
  )
  const same = allEqual(goalIdSets, sameSortedIds)
  if (showOnlyDiffs && same) return null
  return (
    <Fragment key="goals">
      <div className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}>
        Cíle tréninku
      </div>
      {trainings.map((t, i) => {
        const goals = [t.trainingGoal1, t.trainingGoal2, t.trainingGoal3].filter((g) => g != null)
        return (
          <div
            key={i}
            className={`border-b border-l border-gray-100 px-3 py-2 text-sm ${!same ? 'bg-amber-50/50' : ''}`}
          >
            {goals.length === 0 ? (
              <span className="text-xs italic text-gray-400">—</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {goals.map((g) => (
                  <span
                    key={g!.id}
                    className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700"
                  >
                    <Target className="h-3 w-3" />
                    {g!.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </Fragment>
  )
}

function renderAgeGroupsRow(trainings: TrainingDto[], showOnlyDiffs: boolean) {
  const agSets = trainings.map((t) =>
    (t.trainingAgeGroups ?? []).map((ag) => ag.id).filter((x) => x > 0),
  )
  const same = allEqual(agSets, sameSortedIds)
  if (showOnlyDiffs && same) return null
  return (
    <Fragment key="ageGroups">
      <div className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}>
        Věkové kategorie
      </div>
      {trainings.map((t, i) => {
        const ags = (t.trainingAgeGroups ?? []).map((ag) => ag.name ?? ag.description).filter(Boolean)
        return (
          <div
            key={i}
            className={`border-b border-l border-gray-100 px-3 py-2 text-sm ${!same ? 'bg-amber-50/50' : ''}`}
          >
            {ags.length === 0 ? (
              <span className="text-xs italic text-gray-400">—</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {ags.map((name, j) => (
                  <Badge key={j} variant="default">
                    {name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </Fragment>
  )
}
