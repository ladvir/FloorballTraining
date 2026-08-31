import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { seasonGoalsApi, testDefinitionsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../utils/toast'
import type { SeasonGoalDto, SeasonGoalInputDto } from '../../types/domain.types'
import { METRIC_GROUPS, forcedAtMost, isManualMetric, isTestMetric } from './seasonGoalMeta'

interface Props {
  isOpen: boolean
  onClose: () => void
  teamId: number
  seasonId: number
  existing: SeasonGoalDto | null
}

const inputCls =
  'h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

export function SeasonGoalModal({ isOpen, onClose, teamId, seasonId, existing }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeClubId } = useAuthStore()

  // The card only mounts this modal while open, so props are stable for the mount — seed from them once.
  const [metric, setMetric] = useState<number>(() => existing?.metric ?? 0)
  const [testDefinitionId, setTestDefinitionId] = useState<number | ''>(
    () => existing?.testDefinitionId ?? ''
  )
  const [direction, setDirection] = useState<0 | 1>(() => (existing?.direction === 1 ? 1 : 0))
  const [target, setTarget] = useState(() =>
    existing && existing.metric !== 60 ? String(existing.target ?? '') : ''
  )
  const [manualValue, setManualValue] = useState(() =>
    existing?.manualValue != null ? String(existing.manualValue) : ''
  )
  const [manualDone, setManualDone] = useState(() => (existing?.manualValue ?? 0) >= 1)
  const [note, setNote] = useState(() => existing?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const { data: tests } = useQuery({
    queryKey: ['testDefinitions', activeClubId],
    queryFn: () => testDefinitionsApi.getAll({ clubId: activeClubId ?? undefined }),
    enabled: isOpen,
  })

  const showTest = isTestMetric(metric)
  const showDirection = !forcedAtMost(metric) && metric !== 60
  const showTarget = metric !== 60
  const isManual = isManualMetric(metric)

  const mutation = useMutation({
    mutationFn: () => {
      const dto: SeasonGoalInputDto = {
        seasonId,
        teamId,
        metric,
        testDefinitionId: showTest ? Number(testDefinitionId) : null,
        direction: forcedAtMost(metric) ? 1 : direction,
        target: metric === 60 ? 1 : Number(target || 0),
        manualValue: isManual
          ? metric === 60
            ? manualDone
              ? 1
              : 0
            : Number(manualValue || 0)
          : null,
        note: note.trim() || null,
      }
      return existing ? seasonGoalsApi.update(existing.id, dto) : seasonGoalsApi.create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasonGoals', teamId] })
      toast.success(t('seasonGoals.saved'))
      onClose()
    },
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          t('seasonGoals.saveFailed')
      )
    },
  })

  const canSubmit =
    (!showTest || testDefinitionId !== '') &&
    (!showTarget || target !== '' || metric === 60) &&
    (!isManual || note.trim() !== '') &&
    !mutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existing ? t('seasonGoals.editGoal') : t('seasonGoals.addGoal')}
      maxWidth="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          mutation.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('seasonGoals.metricLabel')}
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(Number(e.target.value))}
            className={inputCls}
          >
            {METRIC_GROUPS.map((grp) => (
              <optgroup key={grp.key} label={t(`seasonGoals.group_${grp.key}`)}>
                {grp.metrics.map((m) => (
                  <option key={m} value={m}>
                    {t(`seasonGoals.metric${m}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* For a manual goal the Note IS its name — required and shown first so several are told apart */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {isManual ? t('seasonGoals.manualName') : t('seasonGoals.note')}
            {isManual && <span className="text-red-500"> *</span>}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder={
              isManual ? t('seasonGoals.manualNamePlaceholder') : t('seasonGoals.notePlaceholder')
            }
            className={inputCls}
          />
        </div>

        {showTest && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('seasonGoals.test')}
            </label>
            <select
              value={testDefinitionId}
              onChange={(e) => setTestDefinitionId(e.target.value ? Number(e.target.value) : '')}
              className={inputCls}
            >
              <option value="">{t('seasonGoals.selectTest')}</option>
              {(tests ?? []).map((td) => (
                <option key={td.id} value={td.id}>
                  {td.name}
                  {td.unit ? ` (${td.unit})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {showDirection && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('seasonGoals.direction')}
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(Number(e.target.value) === 1 ? 1 : 0)}
                className={inputCls}
              >
                <option value={0}>{t('seasonGoals.dirAtLeast')}</option>
                <option value={1}>{t('seasonGoals.dirAtMost')}</option>
              </select>
            </div>
          )}
          {showTarget && (
            <Input
              label={metric === 61 ? t('seasonGoals.targetN') : t('seasonGoals.target')}
              type="number"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          )}
        </div>

        {isManual && metric === 60 && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={manualDone}
              onChange={(e) => setManualDone(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm text-gray-700">{t('seasonGoals.manualDoneLabel')}</span>
          </label>
        )}
        {isManual && metric === 61 && (
          <Input
            label={t('seasonGoals.manualCurrent')}
            type="number"
            step="any"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
          />
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!canSubmit}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
