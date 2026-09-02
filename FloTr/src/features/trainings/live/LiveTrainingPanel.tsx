import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  X,
  SkipForward,
  Flag,
  Clock3,
  Dumbbell,
  Star,
  Check,
  Circle,
  Info,
  Pause,
  Play,
} from 'lucide-react'
import { trainingsApi } from '../../../api/trainings.api'
import { useLiveTrainingStore } from '../../../store/liveTrainingStore'
import { useConfirm } from '../../../store/confirmStore'
import { chime, siren } from '../../../utils/sound'
import { RatingForm } from '../../appointments/RatingForm'
import { AppointmentDetailModal } from '../../appointments/AppointmentDetailModal'
import { ActivityDetailModal } from '../../activities/ActivityDetailModal'
import { computeLiveStatus, formatClock, type LivePart } from './liveSchedule'
import type { TrainingGroupDto } from '../../../types/domain.types'

interface RunnerPart extends LivePart {
  description?: string
  groups: TrainingGroupDto[]
}

function GroupList({
  groups,
  muted,
  onOpen,
}: {
  groups: TrainingGroupDto[]
  muted?: boolean
  /** When set, each activity name becomes a button that opens its detail. */
  onOpen?: (activityId: number) => void
}) {
  const activities = groups
    .map((g) => g.activity)
    .filter((a): a is NonNullable<typeof a> => !!a?.name)
  if (activities.length === 0) return null
  return (
    <ul className={`space-y-1 ${muted ? 'text-gray-400' : 'text-gray-700'}`}>
      {activities.map((a, i) => (
        <li key={a.id ?? i} className="flex items-center gap-2 text-base">
          <Dumbbell className="h-4 w-4 shrink-0 text-gray-400" />
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(a.id)}
              className="truncate text-left hover:text-sky-600 hover:underline"
            >
              {a.name}
            </button>
          ) : (
            <span className="truncate">{a.name}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

// Finish step: ask whether to rate the event, then (on "Ano") swap in the shared rating form.
// Mounted only once a session is finished, so its `step` state is fresh every session.
function FinishedView({ appointmentId, onClose }: { appointmentId?: number; onClose: () => void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'ask' | 'form'>('ask')

  return (
    <div className="space-y-4 overflow-y-auto p-6">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-green-600" />
        <p className="text-lg font-semibold text-gray-900">{t('liveTraining.finished')}</p>
      </div>
      {appointmentId == null ? (
        <>
          <p className="text-sm text-gray-500">{t('liveTraining.rateNeedsEvent')}</p>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-base font-medium text-white hover:bg-gray-800"
          >
            {t('common.close')}
          </button>
        </>
      ) : step === 'ask' ? (
        <>
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Star className="h-5 w-5 text-amber-500" />
            {t('liveTraining.ratePrompt')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('form')}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-700"
            >
              {t('common.yes')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('liveTraining.rateLater')}
            </button>
          </div>
        </>
      ) : (
        <>
          <RatingForm appointmentId={appointmentId} onSaved={onClose} />
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {t('liveTraining.skipRating')}
          </button>
        </>
      )}
    </div>
  )
}

export function LiveTrainingPanel() {
  const { t } = useTranslation()
  const confirm = useConfirm()
  const session = useLiveTrainingStore((s) => s.session)
  const nextPart = useLiveTrainingStore((s) => s.nextPart)
  const finish = useLiveTrainingStore((s) => s.finish)
  const close = useLiveTrainingStore((s) => s.close)
  const setMinimized = useLiveTrainingStore((s) => s.setMinimized)
  const pause = useLiveTrainingStore((s) => s.pause)
  const resume = useLiveTrainingStore((s) => s.resume)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailActivityId, setDetailActivityId] = useState<number | null>(null)
  const paused = session?.pausedAtMs != null

  const { data: training } = useQuery({
    queryKey: ['training', session?.trainingId],
    queryFn: () => trainingsApi.getById(session!.trainingId),
    enabled: session != null,
  })

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!session || session.finished || session.pausedAtMs != null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [session])
  // While paused the clock is frozen at the instant pause was hit.
  const clockNow = session?.pausedAtMs ?? now

  // Keep the screen awake while a training is running (released on finish/close/unmount). The OS
  // drops the lock whenever the tab is hidden, so re-acquire it on visibilitychange.
  useEffect(() => {
    if (!session || session.finished) return
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
    }
    if (!nav.wakeLock) return
    let sentinel: { release: () => Promise<void> } | null = null
    let cancelled = false
    const acquire = () => {
      nav
        .wakeLock!.request('screen')
        .then((s) => {
          if (cancelled) void s.release()
          else sentinel = s
        })
        .catch(() => {
          /* denied (e.g. low battery) — nothing we can do */
        })
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release().catch(() => {})
    }
  }, [session])

  const parts: RunnerPart[] = useMemo(() => {
    const raw = training?.trainingParts ?? []
    return [...raw]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((p, i) => ({
        name: p.name || t('liveTraining.partFallback', { n: i + 1 }),
        durationMin: p.duration ?? 0,
        description: p.description,
        groups: p.trainingGroups ?? [],
      }))
  }, [training, t])

  // Sound: a rising chime on every part change, one siren the moment a part goes overtime.
  // Track the part *index* (not partStartedMs) so a resume — which shifts the timestamps — is silent.
  const lastPartIndexRef = useRef<number | null>(null)
  const sirenedIndexRef = useRef<number | null>(null)
  const idx = session ? Math.min(session.currentPartIndex, Math.max(0, parts.length - 1)) : 0
  const status =
    session && parts.length > 0
      ? computeLiveStatus(parts, idx, session.sessionStartMs, session.partStartedMs, clockNow)
      : null

  useEffect(() => {
    if (!session || session.finished) return
    if (lastPartIndexRef.current != null && lastPartIndexRef.current !== session.currentPartIndex) {
      chime()
      sirenedIndexRef.current = null
    }
    lastPartIndexRef.current = session.currentPartIndex
  }, [session])

  useEffect(() => {
    if (!session || session.finished || !status) return
    if (status.overrunSec > 0 && sirenedIndexRef.current !== session.currentPartIndex) {
      sirenedIndexRef.current = session.currentPartIndex
      siren()
    }
  }, [status, session])

  if (!session) return null

  // Launched against a training with no parts (rare) — nothing to run, say so and bail.
  if (training && parts.length === 0 && !session.finished) {
    return (
      <div className="fixed left-1/2 top-1/2 z-40 w-[min(94vw,420px)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <p className="text-base font-bold text-gray-900">{session.trainingName}</p>
        <p className="text-sm text-gray-500">{t('liveTraining.noParts')}</p>
        <button
          onClick={() => close()}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-base font-medium text-white hover:bg-gray-800"
        >
          {t('common.close')}
        </button>
      </div>
    )
  }

  const current = parts[idx]
  const behind = status ? status.driftSec : 0
  const behindLabel =
    Math.abs(behind) < 30
      ? t('liveTraining.onSchedule')
      : behind > 0
        ? t('liveTraining.behindBy', { time: formatClock(behind) })
        : t('liveTraining.aheadBy', { time: formatClock(behind) })
  const behindTone =
    Math.abs(behind) < 30 ? 'text-green-600' : behind > 0 ? 'text-red-600' : 'text-sky-600'

  const overrunning = !!status && status.overrunSec > 0

  // Seconds from *now* until each still-upcoming part is planned to start.
  const partStartsInSec: Record<number, number> = {}
  if (status) {
    let acc = status.nextDueInSec
    for (let j = idx + 1; j < parts.length; j++) {
      partStartsInSec[j] = acc
      acc += parts[j].durationMin * 60
    }
  }

  const endSession = () => confirm(t('liveTraining.finishConfirm'), () => finish())

  // Refresh `now` in the same tick as resume: the 1s ticker's stored value is stale (up to a
  // second old, plus the whole pause), so without this the clock briefly reads pausedElapsed − pausedSpan.
  const handleResume = () => {
    resume()
    setNow(Date.now())
  }

  // ── Minimized pill (stays out of the way, bottom-right) ───────────────────
  if (session.minimized && !session.finished) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 shadow-lg hover:shadow-xl"
      >
        {paused ? (
          <Pause className="h-4 w-4 fill-amber-500 text-amber-500" />
        ) : (
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${behind > 30 ? 'bg-red-500' : 'bg-green-500'}`}
            />
          </span>
        )}
        <span className="text-base font-medium text-gray-800">
          {current?.name} · {formatClock(status?.elapsedInPartSec ?? 0)}
        </span>
        <ChevronUp className="h-5 w-5 text-gray-400" />
      </button>
    )
  }

  // ── Full panel — centered floating window ────────────────────────────────
  return (
    <>
      <div className="fixed left-1/2 top-1/2 z-40 flex max-h-[88vh] w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
          {paused ? (
            <Pause className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          ) : (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-gray-900">{session.trainingName}</p>
            {session.appointmentName && (
              <p className="truncate text-sm text-gray-400">{session.appointmentName}</p>
            )}
          </div>
          {session.appointmentId != null && (
            <button
              onClick={() => setDetailOpen(true)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-200"
              title={t('liveTraining.eventDetail')}
            >
              <Info className="h-5 w-5" />
            </button>
          )}
          {!session.finished && (
            <button
              onClick={() => setMinimized(true)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-200"
              title={t('liveTraining.minimize')}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => confirm(t('liveTraining.closeConfirm'), () => close())}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {session.finished ? (
          <FinishedView
            key={session.sessionStartMs}
            appointmentId={session.appointmentId}
            onClose={() => close()}
          />
        ) : (
          <>
            {/* Scrollable body — every part of the training */}
            <div className="flex-1 overflow-y-auto p-6">
              {paused ? (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                  <Pause className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {t('liveTraining.pausedNote')}
                </div>
              ) : (
                <div className={`mb-4 flex items-center gap-2 text-sm font-semibold ${behindTone}`}>
                  <Clock3 className="h-4 w-4" />
                  {behindLabel}
                </div>
              )}

              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('liveTraining.allParts')} ·{' '}
                {t('liveTraining.nowLabel', {
                  i: idx + 1,
                  total: parts.length,
                })}
              </p>

              <ol className="space-y-2">
                {parts.map((p, j) => {
                  const done = j < idx
                  const isCurrent = j === idx
                  if (isCurrent) {
                    return (
                      <li
                        key={j}
                        className="rounded-xl border-2 border-green-500 bg-green-50/40 p-4"
                      >
                        <div className="mb-1 flex items-baseline justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-green-700">
                            {t('liveTraining.nowLabel', { i: j + 1, total: parts.length })}
                          </span>
                          <span
                            className={`text-2xl font-bold tabular-nums ${overrunning ? 'text-red-600' : 'text-gray-900'}`}
                          >
                            {formatClock(status?.elapsedInPartSec ?? 0)}
                            <span className="text-base font-normal text-gray-400">
                              {' '}
                              / {p.durationMin} min
                            </span>
                          </span>
                        </div>
                        <p className="mb-3 text-2xl font-bold leading-tight text-gray-900">
                          {p.name}
                        </p>
                        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${overrunning ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{
                              width: `${Math.min(
                                100,
                                status && status.plannedPartSec > 0
                                  ? (status.elapsedInPartSec / status.plannedPartSec) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                        <GroupList groups={p.groups} onOpen={setDetailActivityId} />
                        {p.description && (
                          <p className="mt-3 text-sm text-gray-500">{p.description}</p>
                        )}
                      </li>
                    )
                  }
                  return (
                    <li
                      key={j}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${done ? 'opacity-50' : 'bg-gray-50'}`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {done ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-base font-medium ${done ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                          >
                            {j + 1}. {p.name}
                          </span>
                          <span className="shrink-0 text-sm text-gray-400">
                            {p.durationMin} min
                          </span>
                        </div>
                        {!done && partStartsInSec[j] != null && (
                          <span className="text-xs text-gray-400">
                            {partStartsInSec[j] >= 0
                              ? t('liveTraining.inTime', {
                                  time: formatClock(partStartsInSec[j]),
                                })
                              : t('liveTraining.overdueBy', {
                                  time: formatClock(partStartsInSec[j]),
                                })}
                          </span>
                        )}
                        <GroupList groups={p.groups} muted onOpen={setDetailActivityId} />
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Sticky footer — progression + pause are ALWAYS visible, never scrolled away */}
            <div className="flex gap-2 border-t border-gray-100 bg-white px-5 py-4">
              {paused ? (
                <button
                  onClick={handleResume}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3.5 text-base font-semibold text-white hover:bg-amber-600"
                >
                  <Play className="h-5 w-5" />
                  {t('liveTraining.unpause')}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => pause()}
                    title={t('liveTraining.pause')}
                    aria-label={t('liveTraining.pause')}
                    className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3.5 text-gray-700 hover:bg-gray-50"
                  >
                    <Pause className="h-5 w-5" />
                  </button>
                  {status?.isLastPart ? (
                    <button
                      onClick={endSession}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3.5 text-base font-semibold text-white hover:bg-gray-800"
                    >
                      <Flag className="h-5 w-5" />
                      {t('liveTraining.finish')}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={endSession}
                        className="rounded-lg border border-gray-300 px-4 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {t('liveTraining.endEarly')}
                      </button>
                      <button
                        onClick={() => nextPart()}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-green-700"
                      >
                        <SkipForward className="h-5 w-5" />
                        {t('liveTraining.nextPart')}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {detailOpen && session.appointmentId != null && (
        <AppointmentDetailModal
          appointmentId={session.appointmentId}
          onClose={() => setDetailOpen(false)}
        />
      )}
      <ActivityDetailModal
        activityId={detailActivityId}
        onClose={() => setDetailActivityId(null)}
      />
    </>
  )
}
