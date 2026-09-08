import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Flag, CheckCircle2, Undo2, Info } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { teamChallengesApi, teamsApi } from '../../api/index'
import { toast } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import { useConfirm } from '../../store/confirmStore'
import {
  buildTeamChallengeSaveDto,
  isTeamChallengeFormValid,
  type TeamChallengeFormState,
} from './teamChallengeForm'
import type { SaveTeamChallengeDto, TeamChallengeDto } from '../../types/domain.types'

const METRICS = [
  'TrainingAttendance',
  'MatchGoal',
  'HomeTraining',
  'SkillImprovement',
  'TestPersonalRecord',
] as const
const WINDOWS = ['Week', 'Month', 'Season', 'Custom'] as const

export function TeamChallengesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const activeClubId = user?.clubId ?? user?.defaultClubId ?? undefined

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => teamsApi.getAll() })
  const clubTeams = useMemo(
    () => (teams ?? []).filter((tm) => tm.clubId === activeClubId),
    [teams, activeClubId]
  )

  const [selectedTeam, setSelectedTeam] = useState<number | undefined>(undefined)
  const teamId = selectedTeam ?? clubTeams[0]?.id
  const teamKey = `team-${teamId}`

  const { data, isLoading } = useQuery({
    queryKey: ['team-challenges', teamKey],
    queryFn: () => teamChallengesApi.list(teamId!),
    enabled: teamId != null,
  })

  const [modal, setModal] = useState<{ open: boolean; editing: TeamChallengeDto | null }>({
    open: false,
    editing: null,
  })
  const openConfirm = useConfirm()

  const invalidate = () => qc.invalidateQueries({ queryKey: ['team-challenges', teamKey] })

  const saveMutation = useMutation({
    mutationFn: (dto: SaveTeamChallengeDto) =>
      modal.editing
        ? teamChallengesApi.update(modal.editing.id, dto)
        : teamChallengesApi.create(dto),
    onSuccess: () => {
      invalidate()
      setModal({ open: false, editing: null })
      toast.success(t('teamChallenge.saved'))
    },
    onError: () => toast.error(t('teamChallenge.saveError')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teamChallengesApi.remove(id),
    onSuccess: () => {
      invalidate()
      toast.success(t('teamChallenge.deleted'))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) =>
      done ? teamChallengesApi.complete(id) : teamChallengesApi.uncomplete(id),
    onSuccess: () => {
      invalidate()
      toast.success(t('teamChallenge.updated'))
    },
    onError: () => toast.error(t('teamChallenge.saveError')),
  })

  const canManage = data?.canManage ?? false
  const challenges = data?.challenges ?? []

  if (activeClubId == null)
    return (
      <div>
        <PageHeader title={t('teamChallenge.title')} description={t('teamChallenge.subtitle')} />
        <EmptyState title={t('xpRules.noClub')} description={t('xpRules.noClubDesc')} />
      </div>
    )

  return (
    <div>
      <PageHeader
        title={t('teamChallenge.title')}
        description={t('teamChallenge.subtitle')}
        action={
          canManage ? (
            <Button size="sm" onClick={() => setModal({ open: true, editing: null })}>
              <Plus className="h-4 w-4" />
              {t('teamChallenge.new')}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {clubTeams.map((tm) => (
          <button
            key={tm.id}
            type="button"
            onClick={() => setSelectedTeam(tm.id)}
            className={
              tm.id === teamId
                ? 'rounded-full bg-sky-600 px-3 py-1.5 text-sm font-medium text-white'
                : 'rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200'
            }
          >
            {tm.name}
          </button>
        ))}
      </div>

      {!canManage && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('teamChallenge.noPermission')}</span>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : challenges.length === 0 ? (
        <EmptyState title={t('teamChallenge.empty')} description={t('teamChallenge.emptyDesc')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {challenges.map((c) => (
            <ChallengeCard
              key={c.id}
              c={c}
              onEdit={() => setModal({ open: true, editing: c })}
              onDelete={() =>
                openConfirm(t('teamChallenge.deleteConfirm', { name: c.name }), () =>
                  deleteMutation.mutate(c.id)
                )
              }
              onToggle={(done) => toggleMutation.mutate({ id: c.id, done })}
              busy={toggleMutation.isPending}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <ChallengeFormModal
          editing={modal.editing}
          teamId={teamId!}
          saving={saveMutation.isPending}
          onClose={() => setModal({ open: false, editing: null })}
          onSave={(dto) => saveMutation.mutate(dto)}
        />
      )}
    </div>
  )
}

function ChallengeCard({
  c,
  onEdit,
  onDelete,
  onToggle,
  busy,
}: {
  c: TeamChallengeDto
  onEdit: () => void
  onDelete: () => void
  onToggle: (done: boolean) => void
  busy: boolean
}) {
  const { t } = useTranslation()
  const pct = Math.round(Math.min(1, Math.max(0, c.progress)) * 100)

  return (
    <Card className={c.isActive ? '' : 'opacity-60'}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold text-gray-900">
              <Flag className="h-4 w-4 text-sky-500" />
              {c.name}
            </p>
            {c.description && <p className="mt-0.5 text-xs text-gray-500">{c.description}</p>}
          </div>
          {c.canManage && (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={onEdit}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span>
            {c.isManual
              ? t('teamChallenge.manual')
              : t(`challenge.metric.${c.metric}`, { defaultValue: c.metric ?? '' })}
          </span>
          <span>{t(`teamChallenge.window.${c.window}`, { defaultValue: c.window })}</span>
          <span className="font-semibold text-amber-600">
            {t('challenge.rewardXp', { xp: c.rewardXp })}
          </span>
        </div>

        {!c.isManual && (
          <>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${c.completed ? 'bg-green-400' : 'bg-sky-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {t('challenge.progress', { current: c.current, target: c.target })}
            </p>
          </>
        )}

        <div className="mt-2 flex items-center justify-between">
          {c.completed ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('teamChallenge.completedMembers', { count: c.completedMembers })}
            </span>
          ) : (
            <span className="text-xs text-gray-400">{t('teamChallenge.inProgress')}</span>
          )}
          {c.canManage && c.isManual && (
            <Button
              variant={c.completed ? 'outline' : 'primary'}
              size="sm"
              disabled={busy}
              onClick={() => onToggle(!c.completed)}
            >
              {c.completed ? (
                <>
                  <Undo2 className="h-3.5 w-3.5" />
                  {t('teamChallenge.undo')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('teamChallenge.markDone')}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ChallengeFormModal({
  editing,
  teamId,
  saving,
  onClose,
  onSave,
}: {
  editing: TeamChallengeDto | null
  teamId: number
  saving: boolean
  onClose: () => void
  onSave: (dto: SaveTeamChallengeDto) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [isManual, setIsManual] = useState(editing?.isManual ?? false)
  const [metric, setMetric] = useState(editing?.metric ?? METRICS[0])
  const [target, setTarget] = useState(String(editing?.target ?? 10))
  const [window, setWindow] = useState(editing?.window ?? 'Month')
  const [startsOn, setStartsOn] = useState(editing?.startsOn?.slice(0, 10) ?? '')
  const [endsOn, setEndsOn] = useState(editing?.endsOn?.slice(0, 10) ?? '')
  const [rewardXp, setRewardXp] = useState(String(editing?.rewardXp ?? 30))
  const [isActive, setIsActive] = useState(editing?.isActive ?? true)

  const needsRange = window === 'Custom'
  const formState: TeamChallengeFormState = {
    teamId,
    name,
    description,
    isManual,
    metric: metric ?? '',
    target,
    window,
    startsOn,
    endsOn,
    rewardXp,
    isActive,
  }
  const valid = isTeamChallengeFormValid(formState)
  const submit = () => onSave(buildTeamChallengeSaveDto(formState))

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? t('teamChallenge.edit') : t('teamChallenge.new')}
      maxWidth="lg"
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('common.name')}</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            {t('common.description')}
          </span>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isManual}
            onChange={(e) => setIsManual(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t('teamChallenge.isManual')}
        </label>

        {!isManual && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                {t('teamChallenge.metric')}
              </span>
              <select
                value={metric ?? METRICS[0]}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {METRICS.map((m) => (
                  <option key={m} value={m}>
                    {t(`challenge.metric.${m}`, { defaultValue: m })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                {t('teamChallenge.target')}
              </span>
              <Input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              {t('teamChallenge.windowLabel')}
            </span>
            <select
              value={window}
              onChange={(e) => setWindow(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {t(`teamChallenge.window.${w}`, { defaultValue: w })}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              {t('challenge.rewardXp', { xp: '' }).trim() || 'XP'}
            </span>
            <Input
              type="number"
              min={0}
              value={rewardXp}
              onChange={(e) => setRewardXp(e.target.value)}
            />
          </label>
        </div>

        {needsRange && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                {t('teamChallenge.startsOn')}
              </span>
              <input
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                {t('teamChallenge.endsOn')}
              </span>
              <input
                type="date"
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t('teamChallenge.active')}
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button size="sm" disabled={!valid || saving} loading={saving} onClick={submit}>
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  )
}
