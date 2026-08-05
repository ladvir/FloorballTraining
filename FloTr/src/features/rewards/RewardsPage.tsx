import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Pencil, Trash2, Gift, Lock, Check, Undo2, Info } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { rewardsApi, teamsApi } from '../../api/index'
import { MemberLink } from '../../components/shared/MemberLink'
import { SortableTh } from '../../components/shared/SortableTh'
import { useTableSort } from '../../utils/tableSort'
import { RewardScopeBadge } from './RewardScopeBadge'
import { useAuthStore } from '../../store/authStore'
import type {
  ClubRewardDto,
  MemberRewardClaimDto,
  RewardTriggerType,
  SaveClubRewardDto,
} from '../../types/domain.types'

// Career ranks — Czech domain terms, index-aligned with XpProgression.Ranks (server-side, untranslated
// everywhere else in the UI too). Badge codes mirror the fixed BadgeCode enum (#97).
const RANK_NAMES = ['Nováček', 'Hráč', 'Stálice', 'Opora', 'Lídr', 'Kapitán', 'Legenda']
const BADGE_CODES = [
  'Attendance10',
  'Attendance25',
  'Attendance50',
  'Attendance100',
  'FirstGoal',
  'Goals10',
  'Goals50',
  'Hattrick',
  'Assists10',
  'Assists25',
  'IronMan',
  'Loyalty3',
]

export function RewardsPage(props: { teamId?: number; clubId?: number; embedded?: boolean } = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { clubId: clubIdParam, teamId: teamIdParam } = useParams<{
    clubId?: string
    teamId?: string
  }>()
  const { user } = useAuthStore()

  const embedded = props.embedded ?? false
  const teamId = props.teamId ?? (teamIdParam ? Number(teamIdParam) : undefined)
  const activeClubId = user?.clubId ?? user?.defaultClubId ?? undefined
  const clubId = teamId
    ? undefined
    : (props.clubId ?? (clubIdParam ? Number(clubIdParam) : activeClubId))

  const scopeParams = teamId ? { teamId } : { clubId }
  const scopeKey = teamId ? `team-${teamId}` : `club-${clubId}`
  const scopeReady = teamId != null || clubId != null

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClubRewardDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ClubRewardDto | null>(null)

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId!),
    enabled: !!teamId,
  })

  const { data: list, isLoading } = useQuery({
    queryKey: ['rewards', scopeKey],
    queryFn: () => rewardsApi.list(scopeParams),
    enabled: scopeReady,
  })

  const { data: claims } = useQuery({
    queryKey: ['reward-claims', scopeKey],
    queryFn: () => rewardsApi.claims(scopeParams),
    enabled: scopeReady,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rewards', scopeKey] })
    qc.invalidateQueries({ queryKey: ['reward-claims', scopeKey] })
  }

  const saveMutation = useMutation({
    mutationFn: (dto: SaveClubRewardDto) =>
      editing ? rewardsApi.update(editing.id, dto) : rewardsApi.create(dto),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rewardsApi.remove(id),
    onSuccess: () => {
      invalidate()
      setDeleteConfirm(null)
    },
  })

  const fulfillMutation = useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) =>
      done ? rewardsApi.fulfill(id) : rewardsApi.unfulfill(id),
    onSuccess: () => invalidate(),
  })

  const rewards = list?.rewards ?? []
  const canManageScope = list?.canManage ?? false

  if (isLoading) return <LoadingSpinner />

  const title = teamId ? `${team?.name ?? ''} — ${t('rewards.title')}` : t('rewards.clubRewards')

  const addButton = canManageScope ? (
    <Button
      size="sm"
      onClick={() => {
        setEditing(null)
        setModalOpen(true)
      }}
    >
      <Plus className="h-4 w-4" />
      {t('rewards.newReward')}
    </Button>
  ) : undefined

  return (
    <div className={embedded ? '' : 'mx-auto max-w-4xl'}>
      {!embedded && (
        <>
          <div className="mb-2 flex items-center gap-3">
            {teamId && (
              <button
                type="button"
                onClick={() => navigate(`/teams/${teamId}`)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
          </div>
          <PageHeader
            title={title}
            description={teamId ? t('rewards.teamSubtitle') : t('rewards.clubSubtitle')}
            action={addButton}
          />
        </>
      )}
      {embedded && addButton && <div className="mb-4 flex justify-end">{addButton}</div>}

      {/* Role explanation when the caller can't add rewards in this scope. */}
      {!canManageScope && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{teamId ? t('rewards.noPermissionTeam') : t('rewards.noPermissionClub')}</span>
        </div>
      )}

      {/* Definitions */}
      {rewards.length === 0 ? (
        <EmptyState title={t('rewards.noRewards')} description={t('rewards.noRewardsDesc')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rewards.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              inherited={!!teamId && r.teamId == null}
              onEdit={() => {
                setEditing(r)
                setModalOpen(true)
              }}
              onDelete={() => setDeleteConfirm(r)}
            />
          ))}
        </div>
      )}

      {/* Grant audit — who / when / what / handed over by */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <Gift className="h-4 w-4" />
          {t('rewards.grantsTitle')}
        </h2>
        <ClaimsTable
          claims={claims ?? []}
          onFulfill={(id, done) => fulfillMutation.mutate({ id, done })}
          busy={fulfillMutation.isPending}
        />
      </div>

      {modalOpen && (
        <RewardFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          reward={editing}
          clubId={teamId ? (team?.clubId ?? 0) : (clubId ?? 0)}
          teamId={teamId ?? null}
          onSave={(dto) => saveMutation.mutate(dto)}
          saving={saveMutation.isPending}
        />
      )}

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('rewards.deleteReward')}
        maxWidth="sm"
      >
        <p className="mb-4 text-sm text-gray-600">
          {t('rewards.deleteConfirm')} <strong>{deleteConfirm?.name}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            disabled={deleteMutation.isPending}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function triggerLabel(r: ClubRewardDto, t: (k: string, o?: Record<string, unknown>) => string) {
  if (r.triggerType === 'RankReached')
    return t('rewards.triggerRank', { rank: RANK_NAMES[Number(r.triggerValue)] ?? r.triggerValue })
  if (r.triggerType === 'BadgeEarned')
    return t('rewards.triggerBadge', {
      badge: t(`badge.${r.triggerValue}.name`, { defaultValue: r.triggerValue }),
    })
  return t('rewards.triggerXp', { xp: r.triggerValue })
}

function RewardCard({
  reward,
  inherited,
  onEdit,
  onDelete,
}: {
  reward: ClubRewardDto
  inherited: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  return (
    <Card className={!reward.isActive ? 'opacity-60' : undefined}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900">{reward.name}</h3>
            {reward.description && (
              <p className="mt-0.5 text-sm text-gray-500">{reward.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <RewardScopeBadge teamId={reward.teamId} />
            {inherited && (
              <Lock className="h-3 w-3 text-gray-400" aria-label={t('rewards.inherited')} />
            )}
            {reward.canManage && (
              <>
                <button
                  onClick={onEdit}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title={t('common.edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title={t('common.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
            {triggerLabel(reward, t)}
          </span>
          <span className="text-gray-400">
            {t('rewards.claimCount', { count: reward.claimCount })}
          </span>
          {!reward.isActive && <span className="text-amber-600">{t('rewards.inactive')}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

function ClaimsTable({
  claims,
  onFulfill,
  busy,
}: {
  claims: MemberRewardClaimDto[]
  onFulfill: (id: number, done: boolean) => void
  busy: boolean
}) {
  const { t } = useTranslation()
  const { sorted, sortKey, dir, toggle } = useTableSort(
    claims,
    {
      member: (c) => c.memberName,
      reward: (c) => c.rewardName,
      earnedAt: (c) => c.earnedAt,
      status: (c) => c.status,
    },
    'earnedAt',
    'desc'
  )
  if (claims.length === 0)
    return (
      <p className="rounded-lg border border-gray-200 py-6 text-center text-sm text-gray-400">
        {t('rewards.noGrants')}
      </p>
    )

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
          <tr>
            <SortableTh
              label={t('rewards.colMember')}
              columnKey="member"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            <SortableTh
              label={t('rewards.colReward')}
              columnKey="reward"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            <SortableTh
              label={t('rewards.colEarnedAt')}
              columnKey="earnedAt"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            <SortableTh
              label={t('rewards.colStatus')}
              columnKey="status"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            <th className="px-3 py-2 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">
                <MemberLink memberId={c.memberId} name={c.memberName} />
              </td>
              <td className="px-3 py-2 text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  {c.rewardName}
                  <RewardScopeBadge teamId={c.teamId} />
                </span>
              </td>
              <td className="px-3 py-2 text-gray-500">
                {new Date(c.earnedAt).toLocaleDateString()}
              </td>
              <td className="px-3 py-2">
                {c.status === 'Fulfilled' ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <Check className="h-3 w-3" />
                    {t('rewards.statusFulfilled')}
                    {c.fulfilledByName && (
                      <span className="font-normal text-green-600">
                        · {c.fulfilledByName}
                        {c.fulfilledAt ? `, ${new Date(c.fulfilledAt).toLocaleDateString()}` : ''}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {t('rewards.statusEligible')}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                {c.canFulfill &&
                  (c.status === 'Eligible' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => onFulfill(c.id, true)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('rewards.markFulfilled')}
                    </Button>
                  ) : (
                    <button
                      onClick={() => onFulfill(c.id, false)}
                      disabled={busy}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={t('rewards.undoFulfilled')}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RewardFormModal({
  isOpen,
  onClose,
  reward,
  clubId,
  teamId,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  reward: ClubRewardDto | null
  clubId: number
  teamId: number | null
  onSave: (dto: SaveClubRewardDto) => void
  saving: boolean
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(reward?.name ?? '')
  const [description, setDescription] = useState(reward?.description ?? '')
  const [triggerType, setTriggerType] = useState<RewardTriggerType>(
    reward?.triggerType ?? 'BadgeEarned'
  )
  const [triggerValue, setTriggerValue] = useState(reward?.triggerValue ?? BADGE_CODES[0])
  const [isActive, setIsActive] = useState(reward?.isActive ?? true)

  // When the type changes, default the value to something valid for it.
  const onTypeChange = (next: RewardTriggerType) => {
    setTriggerType(next)
    setTriggerValue(next === 'BadgeEarned' ? BADGE_CODES[0] : next === 'RankReached' ? '1' : '500')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      // On edit the server keeps the original scope; on create it uses these.
      clubId,
      teamId: reward ? (reward.teamId ?? null) : teamId,
      name: name.trim(),
      description: description.trim() || undefined,
      triggerType,
      triggerValue: String(triggerValue).trim(),
      isActive,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reward ? t('rewards.editReward') : t('rewards.newReward')}
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label={t('rewards.formName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {t('rewards.formDescription')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t('rewards.formTrigger')}</label>
          <select
            value={triggerType}
            onChange={(e) => onTypeChange(e.target.value as RewardTriggerType)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="BadgeEarned">{t('rewards.triggerTypeBadge')}</option>
            <option value="RankReached">{t('rewards.triggerTypeRank')}</option>
            <option value="XpThreshold">{t('rewards.triggerTypeXp')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {t('rewards.formTriggerValue')}
          </label>
          {triggerType === 'BadgeEarned' && (
            <select
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {BADGE_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`badge.${code}.name`, { defaultValue: code })}
                </option>
              ))}
            </select>
          )}
          {triggerType === 'RankReached' && (
            <select
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {RANK_NAMES.map((rankName, i) => (
                <option key={i} value={i}>
                  {rankName}
                </option>
              ))}
            </select>
          )}
          {triggerType === 'XpThreshold' && (
            <Input
              type="number"
              min={1}
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              required
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          {t('rewards.formActive')}
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" size="sm" disabled={!name.trim() || saving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
