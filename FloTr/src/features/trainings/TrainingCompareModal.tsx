import { useMemo, useState, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
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

// These are initialized inside the component with t() so they can be translated.

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

export function TrainingCompareModal({
  trainingIds,
  onClose,
  onDeleted,
  draftTraining,
  draftLabel,
}: Props) {
  const { t } = useTranslation()
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { isCoach } = useAuthStore()
  const queryClient = useQueryClient()

  const envLabels: Record<number, string> = {
    0: t('appointments.env.anywhere'),
    1: t('appointments.env.indoor'),
    2: t('appointments.env.outdoor'),
  }
  const difficultyLabels = [
    '',
    t('trainings.difficultyBeginner'),
    t('trainings.difficultyIntermediate'),
    t('trainings.difficultyAdvanced'),
    t('trainings.difficultyExpert'),
  ]
  const intensityLabels = [
    '',
    t('trainings.intensityLow'),
    t('trainings.intensityMedium'),
    t('trainings.intensityHigh'),
    t('trainings.intensityMax'),
  ]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
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
    [trainingIds]
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
            t('trainings.deleteBlockedReason', { count: '?', noun: t('appointments.title') })
        )
        // Refetch counts so the UI reflects the real state.
        queryClient.invalidateQueries({ queryKey: countsKey })
      } else {
        setDeleteError(serverMessage ?? t('trainings.deleteFailed'))
      }
    },
  })

  const isLoading = results.some((r) => r.isLoading)
  const fetchedTrainings = results.map((r) => r.data).filter((t): t is TrainingDto => !!t)
  const trainings = useMemo(
    () => (draftTraining ? [draftTraining, ...fetchedTrainings] : fetchedTrainings),
    [draftTraining, fetchedTrainings]
  )
  const totalColumns = trainings.length

  const maxParts = useMemo(
    () => trainings.reduce((m, t) => Math.max(m, t.trainingParts?.length ?? 0), 0),
    [trainings]
  )

  const gridStyle = {
    gridTemplateColumns: `minmax(140px, 180px) repeat(${totalColumns}, minmax(200px, 1fr))`,
  }

  const body = (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-gray-900">
            {t('trainings.compare')} ({totalColumns})
          </h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showOnlyDiffs}
              onChange={(e) => setShowOnlyDiffs(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            {t('trainings.onlyDiffs')}
          </label>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {confirmDeleteId != null &&
        (() => {
          const target = trainings.find((t) => t.id === confirmDeleteId)
          if (!target) return null
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                <h3 className="mb-2 text-base font-semibold text-gray-900">
                  {t('trainings.formDeleteTitle')}
                </h3>
                <p className="text-sm text-gray-700">
                  {t('trainings.confirmDeleteText', { name: target.name })}
                </p>
                {deleteError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <div>
                      <p className="font-medium">{t('trainings.cannotDelete')}</p>
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
                    {deleteError ? t('common.close') : t('common.cancel')}
                  </Button>
                  {!deleteError && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(target.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('common.delete')}
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
          <p className="text-sm text-gray-500">{t('trainings.noDataToCompare')}</p>
        ) : (
          <div className="grid gap-0" style={gridStyle}>
            {/* Header row: training names + status + author */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t('trainings.title')}
            </div>
            {trainings.map((tr, idx) => {
              const isDraftEntry = draftTraining != null && idx === 0
              const apptCount = appointmentCounts?.[tr.id] ?? 0
              const canDelete = !isDraftEntry && countsLoaded && apptCount === 0
              return (
                <div
                  key={isDraftEntry ? 'draft' : tr.id}
                  className="sticky top-0 z-10 bg-white border-b border-gray-300 px-3 py-2"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {tr.name || (isDraftEntry ? t('trainings.unnamed') : '')}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {isDraftEntry ? (
                      <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 font-medium text-sky-700">
                        {draftLabel ?? t('trainings.draftEditLabel')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-600">
                        <span
                          className={`h-2 w-2 rounded-full ${tr.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`}
                        />
                        {tr.isDraft ? t('trainings.statusDraft') : t('trainings.statusComplete')}
                      </span>
                    )}
                    {tr.createdByUserName && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <User className="h-3 w-3" />
                        {tr.createdByUserName}
                      </span>
                    )}
                    {!isDraftEntry && !countsLoaded && !countsErrored && (
                      <span className="inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 font-medium text-gray-400">
                        {t('trainings.checkingSchedule')}
                      </span>
                    )}
                    {!isDraftEntry && countsErrored && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700"
                        title={t('trainings.statusUnknown')}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {t('trainings.statusUnknown')}
                      </span>
                    )}
                    {!isDraftEntry && countsLoaded && canDelete && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 font-medium text-green-700"
                        title={t('trainings.canSafelyDelete')}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {t('trainings.canSafelyDelete')}
                      </span>
                    )}
                    {!isDraftEntry && countsLoaded && !canDelete && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600"
                        title={t('trainings.cannotDelete')}
                      >
                        <Lock className="h-3 w-3" />
                        {apptCount === 1
                          ? t('trainings.eventCount_one')
                          : t('trainings.eventCount_other', { count: apptCount })}
                      </span>
                    )}
                  </div>
                  {!isDraftEntry && isCoach && canDelete && (
                    <Button
                      size="sm"
                      variant="danger"
                      className="mt-2"
                      loading={deleteMutation.isPending && confirmDeleteId === tr.id}
                      onClick={() => {
                        setDeleteError(null)
                        setConfirmDeleteId(tr.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('common.delete')}
                    </Button>
                  )}
                </div>
              )
            })}

            {/* Simple value rows */}
            {renderSimpleRow(
              t('common.duration'),
              trainings,
              (tr) => (tr.duration > 0 ? `${tr.duration} min` : '—'),
              showOnlyDiffs
            )}
            {renderSimpleRow(
              t('trainings.colPlayers'),
              trainings,
              (tr) =>
                tr.personsMin && tr.personsMin > 0
                  ? `${tr.personsMin}${tr.personsMax ? `–${tr.personsMax}` : '+'}`
                  : '—',
              showOnlyDiffs
            )}
            {renderSimpleRow(
              t('trainings.goaliesLabel'),
              trainings,
              (tr) =>
                tr.goaliesMin && tr.goaliesMin > 0
                  ? `${tr.goaliesMin}${tr.goaliesMax ? `–${tr.goaliesMax}` : '+'}`
                  : '—',
              showOnlyDiffs
            )}
            {renderSimpleRow(
              t('trainings.difficultyLabel'),
              trainings,
              (tr) =>
                tr.difficulty ? difficultyLabels[tr.difficulty] || String(tr.difficulty) : '—',
              showOnlyDiffs
            )}
            {renderSimpleRow(
              t('trainings.intensityLabel'),
              trainings,
              (tr) => (tr.intensity ? intensityLabels[tr.intensity] || String(tr.intensity) : '—'),
              showOnlyDiffs
            )}
            {renderSimpleRow(
              t('common.location'),
              trainings,
              (tr) =>
                tr.environment != null
                  ? (envLabels[tr.environment] ?? String(tr.environment))
                  : '—',
              showOnlyDiffs
            )}

            {/* Goals */}
            {renderGoalsRow(trainings, showOnlyDiffs, t('appointments.trainingGoals'))}

            {/* Age groups */}
            {renderAgeGroupsRow(trainings, showOnlyDiffs, t('activities.formAgeGroups'))}

            {/* Description */}
            {renderLongTextRow(
              t('common.description'),
              trainings,
              (tr) => tr.description ?? '',
              showOnlyDiffs
            )}

            {/* Comments */}
            {renderLongTextRow(
              t('trainings.commentBefore'),
              trainings,
              (tr) => tr.commentBefore ?? '',
              showOnlyDiffs
            )}
            {renderLongTextRow(
              t('trainings.commentAfter'),
              trainings,
              (tr) => tr.commentAfter ?? '',
              showOnlyDiffs
            )}

            {/* Parts section */}
            {maxParts > 0 && (
              <>
                <div
                  className="col-span-full mt-4 border-b border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
                  style={{ gridColumn: `1 / span ${totalColumns + 1}` }}
                >
                  {t('appointments.trainingParts')}
                </div>
                {Array.from({ length: maxParts }).map((_, idx) => {
                  const partsAtIdx = trainings.map(
                    (tr) =>
                      (tr.trainingParts ?? [])
                        .slice()
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[idx]
                  )
                  const partsMatch = allEqual(partsAtIdx, partsEqual)
                  if (showOnlyDiffs && partsMatch) return null
                  return (
                    <Fragment key={idx}>
                      <div
                        className={`border-b border-gray-100 px-3 py-3 text-xs text-gray-500 ${!partsMatch ? 'bg-amber-50/50' : ''}`}
                      >
                        {t('trainings.partLabel', { n: idx + 1 })}
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
                                  {part.name || t('trainings.partLabel', { n: idx + 1 })}
                                </span>
                                <span className="text-xs text-gray-400">{part.duration} min</span>
                              </div>
                              {part.description && (
                                <p className="mb-2 text-xs text-gray-500 whitespace-pre-wrap">
                                  {part.description}
                                </p>
                              )}
                              {part.trainingGroups && part.trainingGroups.length > 0 && (
                                <ul className="space-y-1">
                                  {part.trainingGroups.map((g, gi) => (
                                    <li
                                      key={gi}
                                      className="flex items-center gap-1.5 text-xs text-gray-600"
                                    >
                                      <Dumbbell className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                      <span>{g.activity?.name || t('trainings.noActivity')}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">
                              {t('trainings.partMissing')}
                            </span>
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
  showOnlyDiffs: boolean
) {
  const values = trainings.map(get)
  const same = allEqual(values)
  if (showOnlyDiffs && same) return null
  return (
    <Fragment key={label}>
      <div
        className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}
      >
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
  showOnlyDiffs: boolean
) {
  const values = trainings.map(get)
  const same = allEqual(values)
  const allEmpty = values.every((v) => !v.trim())
  if (showOnlyDiffs && (same || allEmpty)) return null
  if (allEmpty) return null
  return (
    <Fragment key={label}>
      <div
        className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}
      >
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

function renderGoalsRow(trainings: TrainingDto[], showOnlyDiffs: boolean, label = '') {
  const goalIdSets = trainings.map((t) =>
    [t.trainingGoal1, t.trainingGoal2, t.trainingGoal3].filter((g) => g != null).map((g) => g!.id)
  )
  const same = allEqual(goalIdSets, sameSortedIds)
  if (showOnlyDiffs && same) return null
  return (
    <Fragment key="goals">
      <div
        className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}
      >
        {label}
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

function renderAgeGroupsRow(trainings: TrainingDto[], showOnlyDiffs: boolean, label = '') {
  const agSets = trainings.map((t) =>
    (t.trainingAgeGroups ?? []).map((ag) => ag.id).filter((x) => x > 0)
  )
  const same = allEqual(agSets, sameSortedIds)
  if (showOnlyDiffs && same) return null
  return (
    <Fragment key="ageGroups">
      <div
        className={`border-b border-gray-100 px-3 py-2 text-xs text-gray-500 ${!same ? 'bg-amber-50/50' : ''}`}
      >
        {label}
      </div>
      {trainings.map((t, i) => {
        const ags = (t.trainingAgeGroups ?? [])
          .map((ag) => ag.name ?? ag.description)
          .filter(Boolean)
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
