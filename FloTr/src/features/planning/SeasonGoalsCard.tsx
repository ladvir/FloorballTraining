import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Target, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { seasonGoalsApi } from '../../api/index'
import { toast } from '../../utils/toast'
import { useConfirm } from '../../store/confirmStore'
import type { SeasonGoalDto, TeamSeasonGoalsDto } from '../../types/domain.types'
import { SeasonGoalModal } from './SeasonGoalModal'
import { fmtGoalValue, isManualMetric, isTestMetric, verdictMeta } from './seasonGoalMeta'

interface Props {
  teamId: number
  /** dashboard / team-card view: fewer chrome, no editing, self-hides when there is nothing to show */
  compact?: boolean
}

export function SeasonGoalsCard({ teamId, compact = false }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SeasonGoalDto | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['seasonGoals', teamId],
    queryFn: () => seasonGoalsApi.getTeamGoals(teamId),
    enabled: teamId > 0,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['seasonGoals', teamId] })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => seasonGoalsApi.delete(id),
    onSuccess: () => {
      invalidate()
      toast.success(t('seasonGoals.deleted'))
    },
    onError: () => toast.error(t('seasonGoals.saveFailed')),
  })

  const verdictMutation = useMutation({
    mutationFn: (successful: boolean | null) =>
      seasonGoalsApi.setVerdict(teamId, data!.seasonId!, successful),
    onSuccess: () => {
      invalidate()
      toast.success(t('seasonGoals.saved'))
    },
    onError: () => toast.error(t('seasonGoals.saveFailed')),
  })

  if (isLoading) return compact ? null : <LoadingSpinner />
  if (!data) return null

  // Nothing worth a card in the tight views
  if (compact && (!data.seasonId || data.totalCount === 0)) return null

  const editable = data.canManage

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (g: SeasonGoalDto) => {
    setEditing(g)
    setModalOpen(true)
  }
  const askDelete = (g: SeasonGoalDto) =>
    confirm(t('seasonGoals.deleteConfirm'), () => deleteMutation.mutate(g.id), t('common.delete'))

  return (
    <Card>
      <CardContent className={compact ? 'space-y-2 py-3' : 'space-y-3 py-4'}>
        <div className="flex flex-wrap items-center gap-2">
          <Target className="h-4 w-4 text-sky-500" />
          <h3
            className={
              compact ? 'text-sm font-semibold text-gray-700' : 'font-semibold text-gray-900'
            }
          >
            {t('seasonGoals.title')}
          </h3>
          {data.seasonName && <span className="text-xs text-gray-400">{data.seasonName}</span>}
          <VerdictBadge data={data} />
          {!compact && editable && data.seasonId && (
            <Button size="sm" variant="outline" className="ml-auto" onClick={openNew}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t('seasonGoals.addGoal')}
            </Button>
          )}
        </div>

        {!data.seasonId ? (
          <p className="text-sm text-gray-500">{t('seasonGoals.noSeason')}</p>
        ) : data.totalCount === 0 ? (
          <p className="text-sm text-gray-400">
            {editable ? t('seasonGoals.emptyHint') : t('seasonGoals.emptyReadOnly')}
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              {t('seasonGoals.achievedOf', {
                achieved: data.achievedCount,
                total: data.totalCount,
              })}
            </p>
            <ul className={compact ? 'space-y-1.5' : 'space-y-2'}>
              {(compact ? data.goals.slice(0, 4) : data.goals).map((g) => (
                <GoalRow
                  key={g.id}
                  goal={g}
                  compact={compact}
                  editable={!compact && editable}
                  onEdit={() => openEdit(g)}
                  onDelete={() => askDelete(g)}
                />
              ))}
            </ul>
            {compact && data.goals.length > 4 && (
              <p className="text-xs text-gray-400">
                {t('seasonGoals.andMore', { count: data.goals.length - 4 })}
              </p>
            )}

            {!compact && editable && (
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                <span className="text-xs font-medium text-gray-500">
                  {t('seasonGoals.verdictLabel')}:
                </span>
                <Button
                  size="sm"
                  variant={data.verdict === 1 && data.verdictOverridden ? 'primary' : 'outline'}
                  onClick={() => verdictMutation.mutate(true)}
                  disabled={verdictMutation.isPending}
                >
                  {t('seasonGoals.markSuccessful')}
                </Button>
                <Button
                  size="sm"
                  variant={data.verdict === 3 && data.verdictOverridden ? 'primary' : 'outline'}
                  onClick={() => verdictMutation.mutate(false)}
                  disabled={verdictMutation.isPending}
                >
                  {t('seasonGoals.markUnsuccessful')}
                </Button>
                {data.verdictOverridden && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => verdictMutation.mutate(null)}
                    disabled={verdictMutation.isPending}
                  >
                    {t('seasonGoals.clearVerdict')}
                  </Button>
                )}
              </div>
            )}
            {data.verdictOverridden && data.overrideNote && (
              <p className="text-xs italic text-gray-400">“{data.overrideNote}”</p>
            )}
          </>
        )}
      </CardContent>

      {editable && data.seasonId && modalOpen && (
        <SeasonGoalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          teamId={teamId}
          seasonId={data.seasonId}
          existing={editing}
        />
      )}
    </Card>
  )
}

function VerdictBadge({ data }: { data: TeamSeasonGoalsDto }) {
  const { t } = useTranslation()
  const meta = verdictMeta(data.verdict)
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}
      title={data.verdictOverridden ? t('seasonGoals.verdictOverridden') : undefined}
    >
      {t(`seasonGoals.verdict${meta.key}`)}
      {data.verdictOverridden && ' ·'}
    </span>
  )
}

function GoalRow({
  goal,
  compact,
  editable,
  onEdit,
  onDelete,
}: {
  goal: SeasonGoalDto
  compact: boolean
  editable: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const dir = goal.direction === 1 ? '≤' : '≥'
  const manual = isManualMetric(goal.metric)
  const label = manual
    ? goal.note?.trim() || t(`seasonGoals.metric${goal.metric}`)
    : isTestMetric(goal.metric)
      ? `${t(`seasonGoals.metric${goal.metric}`)}: ${goal.testName ?? '?'}`
      : t(`seasonGoals.metric${goal.metric}`)
  const pct = Math.max(0, Math.min(100, goal.progressPercent))

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border border-gray-100 ${
        compact ? 'px-2 py-1.5' : 'px-3 py-2'
      }`}
    >
      {goal.achieved ? (
        <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
      ) : (
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gray-300" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
          <span className="font-medium text-gray-800">{label}</span>
          {goal.metric !== 60 && (
            <span className="text-xs text-gray-400">
              {dir} {fmtGoalValue(goal.target, goal)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${goal.achieved ? 'bg-green-400' : 'bg-sky-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-xs tabular-nums text-gray-500">
            {fmtGoalValue(goal.currentValue, goal)} / {fmtGoalValue(goal.target, goal)}
          </span>
        </div>
        {goal.note && !compact && !manual && (
          <p className="mt-0.5 truncate text-xs text-gray-400">{goal.note}</p>
        )}
      </div>
      {editable && (
        <div className="flex flex-shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-500"
            title={t('common.edit')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title={t('common.delete')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  )
}
