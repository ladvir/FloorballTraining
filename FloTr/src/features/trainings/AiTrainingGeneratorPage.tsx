import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/shared/PageHeader'
import { tagsApi, ageGroupsApi, equipmentApi, aiApi } from '../../api/index'
import { streamAi, AiStreamError } from '../../api/aiStream'
import { useAuthStore } from '../../store/authStore'
import { useAiDraftStore } from '../../store/aiDraftStore'
import { toast } from '../../utils/toast'
import type { TrainingDraftResultDto, TrainingGenerationRequest } from '../../types/domain.types'

type Phase = 'idle' | 'streaming' | 'done' | 'error'

export function AiTrainingGeneratorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeClubId } = useAuthStore()
  const setDraft = useAiDraftStore((s) => s.setDraft)

  // Form parameters (simple controlled inputs — validation happens server-side too)
  const [goalTagIds, setGoalTagIds] = useState<number[]>([])
  const [ageGroupId, setAgeGroupId] = useState<number | ''>('')
  const [duration, setDuration] = useState(90)
  const [personsMin, setPersonsMin] = useState(8)
  const [personsMax, setPersonsMax] = useState(16)
  const [equipmentIds, setEquipmentIds] = useState<number[]>([])
  const [intensity, setIntensity] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const [phase, setPhase] = useState<Phase>('idle')
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState<TrainingDraftResultDto | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamBoxRef = useRef<HTMLPreElement | null>(null)
  // Parameters of the last successful generation — regeneration reuses them.
  const lastRequestRef = useRef<TrainingGenerationRequest | null>(null)
  const [regenerating, setRegenerating] = useState<{
    partIndex: number
    activityId?: number
  } | null>(null)

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  const { data: ageGroups } = useQuery({ queryKey: ['ageGroups'], queryFn: ageGroupsApi.getAll })
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.getAll })
  const { data: status } = useQuery({
    queryKey: ['ai-status', activeClubId],
    queryFn: () => aiApi.getStatus(activeClubId),
    enabled: activeClubId != null,
  })

  const goalTags = (allTags ?? []).filter((tag) => tag.isTrainingGoal)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    // Keep the live preview scrolled to the newest text.
    streamBoxRef.current?.scrollTo({ top: streamBoxRef.current.scrollHeight })
  }, [streamText])

  const toggleId = (list: number[], id: number, max?: number): number[] =>
    list.includes(id)
      ? list.filter((x) => x !== id)
      : max && list.length >= max
        ? list
        : [...list, id]

  const canGenerate =
    activeClubId != null && ageGroupId !== '' && duration >= 10 && phase !== 'streaming'

  const handleGenerate = async () => {
    if (activeClubId == null || ageGroupId === '') return
    setPhase('streaming')
    setStreamText('')
    setResult(null)
    setErrorCode(null)
    setErrorDetail(null)

    const request: TrainingGenerationRequest = {
      clubId: activeClubId,
      goalTagIds,
      ageGroupId,
      durationMinutes: duration,
      personsMin,
      personsMax,
      equipmentIds: equipmentIds.length ? equipmentIds : undefined,
      intensity: intensity === '' ? undefined : intensity,
      notes: notes.trim() || undefined,
    }

    lastRequestRef.current = request
    abortRef.current = new AbortController()
    try {
      await streamAi<TrainingDraftResultDto>(
        '/ai/training-draft',
        request,
        {
          onDelta: (text) => setStreamText((prev) => prev + text),
          onResult: (r) => {
            setResult(r)
            setPhase('done')
          },
        },
        abortRef.current.signal
      )
    } catch (err) {
      if (abortRef.current?.signal.aborted) return
      setErrorCode(err instanceof AiStreamError ? err.code : 'unexpected')
      setErrorDetail(err instanceof AiStreamError ? (err.detail ?? null) : null)
      setPhase('error')
    }
  }

  const handleOpenInEditor = () => {
    if (!result) return
    setDraft(result.draft)
    navigate('/trainings/new')
  }

  /** Regenerates one part, or swaps a single activity when replaceActivityId is given. */
  const handleRegenerate = async (partIndex: number, replaceActivityId?: number) => {
    if (!result || !lastRequestRef.current || regenerating) return
    setRegenerating({ partIndex, activityId: replaceActivityId })
    try {
      const regenerated = await aiApi.regeneratePart({
        request: lastRequestRef.current,
        draft: result.draft,
        partIndex,
        replaceActivityId: replaceActivityId ?? null,
      })
      setResult((prev) => {
        if (!prev) return prev
        const parts = prev.draft.parts.map((p, i) => (i === partIndex ? regenerated.part : p))
        return {
          draft: {
            ...prev.draft,
            parts,
            duration: parts.reduce((sum, p) => sum + p.duration, 0),
          },
          usage: {
            inputTokens: prev.usage.inputTokens + regenerated.usage.inputTokens,
            outputTokens: prev.usage.outputTokens + regenerated.usage.outputTokens,
          },
          // Warnings describe the latest operation.
          warnings: regenerated.warnings,
        }
      })
    } catch (err) {
      const code =
        (err as { response?: { data?: { code?: string } } })?.response?.data?.code ?? 'unexpected'
      toast.error(
        t(`ai.generator.errors.${code}`, { defaultValue: t('ai.generator.errors.unexpected') })
      )
    } finally {
      setRegenerating(null)
    }
  }

  if (status && (!status.enabled || !status.hasCredential)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('ai.generator.title')} />
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-600">
            {!status.enabled ? t('ai.generator.disabled') : t('ai.generator.noCredential')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('ai.generator.title')} description={t('ai.generator.subtitle')} />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('ai.generator.parameters')}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('ai.generator.goals')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {goalTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setGoalTagIds((ids) => toggleId(ids, tag.id, 3))}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    goalTagIds.includes(tag.id)
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('ai.generator.goalsHint')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('ai.generator.ageGroup')}
              </label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={ageGroupId}
                onChange={(e) => setAgeGroupId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{t('ai.generator.selectAgeGroup')}</option>
                {(ageGroups ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.description || g.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t('ai.generator.duration')}
              type="number"
              min={10}
              max={300}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
            <Input
              label={t('ai.generator.personsMin')}
              type="number"
              min={1}
              value={personsMin}
              onChange={(e) => setPersonsMin(Number(e.target.value))}
            />
            <Input
              label={t('ai.generator.personsMax')}
              type="number"
              min={1}
              value={personsMax}
              onChange={(e) => setPersonsMax(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('ai.generator.intensity')}
              </label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{t('ai.generator.intensityAny')}</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t('ai.generator.notes')}
              value={notes}
              maxLength={1000}
              placeholder={t('ai.generator.notesPlaceholder')}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('ai.generator.equipment')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(equipment ?? []).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEquipmentIds((ids) => toggleId(ids, e.id))}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    equipmentIds.includes(e.id)
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={!canGenerate} loading={phase === 'streaming'}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            {t('ai.generator.generate')}
          </Button>
        </CardContent>
      </Card>

      {(phase === 'streaming' || (phase !== 'idle' && streamText)) && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {phase === 'streaming' ? t('ai.generator.generating') : t('ai.generator.rawOutput')}
            </h2>
          </CardHeader>
          <CardContent>
            <pre
              ref={streamBoxRef}
              className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600"
            >
              {streamText || '…'}
            </pre>
          </CardContent>
        </Card>
      )}

      {phase === 'error' && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t(`ai.generator.errors.${errorCode}`, {
                defaultValue: t('ai.generator.errors.unexpected'),
              })}
            </p>
            {errorDetail && (
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
                {errorDetail}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {phase === 'done' && result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{result.draft.name}</h2>
                <p className="text-sm text-gray-500">
                  {t('ai.generator.draftSummary', {
                    duration: result.draft.duration,
                    parts: result.draft.parts.length,
                  })}
                </p>
              </div>
              <Button onClick={handleOpenInEditor}>{t('ai.generator.openInEditor')}</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                {result.warnings.map((w, i) => (
                  <p key={i} className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {t(`ai.generator.warnings.${w.code}`, {
                      value: w.value ?? '',
                      defaultValue: w.code,
                    })}
                  </p>
                ))}
              </div>
            )}
            {result.draft.description && (
              <p className="text-sm text-gray-600">{result.draft.description}</p>
            )}
            <ol className="space-y-2">
              {result.draft.parts.map((part, i) => (
                <li key={i} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{part.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {t('ai.generator.minutes', { count: part.duration })}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        title={t('ai.generator.regeneratePart')}
                        disabled={regenerating != null}
                        loading={regenerating?.partIndex === i && regenerating.activityId == null}
                        onClick={() => handleRegenerate(i)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </div>
                  {part.description && (
                    <p className="mt-1 text-xs text-gray-500">{part.description}</p>
                  )}
                  <ul className="mt-1 space-y-0.5 text-sm text-gray-700">
                    {part.activities.map((a) => (
                      <li key={a.activityId} className="flex items-center gap-1.5">
                        <span>• {a.activityName}</span>
                        <button
                          type="button"
                          title={t('ai.generator.swapActivity')}
                          aria-label={t('ai.generator.swapActivity')}
                          className="text-gray-300 hover:text-sky-600 disabled:opacity-50"
                          disabled={regenerating != null}
                          onClick={() => handleRegenerate(i, a.activityId)}
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${
                              regenerating?.partIndex === i &&
                              regenerating.activityId === a.activityId
                                ? 'animate-spin'
                                : ''
                            }`}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <p className="text-xs text-gray-400">{t('ai.generator.regenerateHint')}</p>
            <p className="text-xs text-gray-400">
              {t('ai.generator.tokens', {
                input: result.usage.inputTokens,
                output: result.usage.outputTokens,
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
