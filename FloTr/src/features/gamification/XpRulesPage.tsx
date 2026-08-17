import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Coins, Info, Lock, RotateCcw } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { xpApi, teamsApi } from '../../api/index'
import { toast } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import { useConfirm } from '../../store/confirmStore'
import type { XpRuleConfigDto } from '../../types/domain.types'

// HeadCoach+ may edit club-wide values; a plain Coach only their team(s).
const CLUB_SCOPE_ROLES = ['HeadCoach', 'ClubAdmin', 'Admin']

export function XpRulesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { user, effectiveRole, isAdmin } = useAuthStore()
  const activeClubId = user?.clubId ?? user?.defaultClubId ?? undefined
  const canClubScope = CLUB_SCOPE_ROLES.includes(effectiveRole)

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => teamsApi.getAll() })
  const clubTeams = useMemo(
    () => (teams ?? []).filter((tm) => tm.clubId === activeClubId),
    [teams, activeClubId]
  )

  // selected: undefined = user hasn't picked yet; null = club scope; number = a team.
  const [selected, setSelected] = useState<number | null | undefined>(undefined)
  // Effective scope derived during render (no effect): club scope for HeadCoach+, else the first team.
  const scope: number | null =
    selected !== undefined ? selected : canClubScope ? null : (clubTeams[0]?.id ?? null)
  const isClubScope = scope === null
  const scopeResolved = isClubScope ? canClubScope : (scope ?? 0) > 0
  const scopeParams = isClubScope ? { clubId: activeClubId } : { teamId: scope! }
  const scopeKey = isClubScope ? `club-${activeClubId}` : `team-${scope}`

  const { data: rules, isLoading } = useQuery({
    queryKey: ['xp-rules', scopeKey],
    queryFn: () => xpApi.getRulesConfig(scopeParams),
    enabled: scopeResolved && activeClubId != null,
  })

  // Local edits hold only user-typed values (keyed by event type); the input falls back to the server
  // value, so no effect is needed to seed them. Reset them during render when the scope changes.
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [editsKey, setEditsKey] = useState(scopeKey)
  if (editsKey !== scopeKey) {
    setEditsKey(scopeKey)
    setEdits({})
  }

  const isEditable = (r: XpRuleConfigDto) => isClubScope || r.teamScopable
  const valueOf = (r: XpRuleConfigDto) => edits[r.eventType] ?? String(r.points)

  const dirty = useMemo(
    () =>
      (rules ?? []).some(
        (r) =>
          (isClubScope || r.teamScopable) &&
          r.eventType in edits &&
          Number(edits[r.eventType]) !== r.points
      ),
    [rules, edits, isClubScope]
  )

  const saveMutation = useMutation({
    mutationFn: () =>
      xpApi.updateRulesConfig({
        clubId: activeClubId!,
        teamId: scope ?? null,
        items: (rules ?? []).filter(isEditable).map((r) => ({
          eventType: r.eventType,
          points: Math.max(0, Number(valueOf(r)) || 0),
        })),
      }),
    onSuccess: (fresh) => {
      qc.setQueryData(['xp-rules', scopeKey], fresh)
      toast.success(t('xpRules.saved'))
    },
    onError: () => toast.error(t('xpRules.saveError')),
  })

  // ── Admin-only XP reset cutoff (per club): source records older than this date are ignored by
  // the next recompute. The underlying attendance/stats/etc. records are never touched. ──────────
  const openConfirm = useConfirm()
  const { data: xpCountFrom } = useQuery({
    queryKey: ['xp-count-from', activeClubId],
    queryFn: () => xpApi.getXpCountFrom(activeClubId!),
    enabled: isAdmin && activeClubId != null,
  })
  const serverCountFromDate = xpCountFrom?.xpCountFromDate?.slice(0, 10) ?? ''
  // undefined = no local edit yet, fall back to the server value.
  const [countFromEdit, setCountFromEdit] = useState<string | undefined>(undefined)
  const countFromValue = countFromEdit ?? serverCountFromDate
  const countFromDirty = countFromEdit !== undefined && countFromEdit !== serverCountFromDate

  const countFromMutation = useMutation({
    mutationFn: (date: string | null) => xpApi.setXpCountFrom(activeClubId!, date),
    onSuccess: (fresh) => {
      qc.setQueryData(['xp-count-from', activeClubId], fresh)
      setCountFromEdit(undefined)
      toast.success(t('xpRules.countFromSaved'))
    },
    onError: () => toast.error(t('xpRules.saveError')),
  })

  if (activeClubId == null)
    return (
      <div>
        <PageHeader title={t('xpRules.title')} description={t('xpRules.subtitle')} />
        <EmptyState title={t('xpRules.noClub')} description={t('xpRules.noClubDesc')} />
      </div>
    )

  return (
    <div>
      <PageHeader
        title={t('xpRules.title')}
        description={t('xpRules.subtitle')}
        action={
          <Button
            size="sm"
            disabled={!dirty || saveMutation.isPending}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {t('common.save')}
          </Button>
        }
      />

      {isAdmin && (
        <Card className="mb-4 border-amber-200">
          <CardContent className="py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t('xpRules.countFromTitle')}
            </div>
            <p className="mb-3 text-xs text-gray-500">{t('xpRules.countFromHint')}</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={countFromValue}
                onChange={(e) => setCountFromEdit(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <Button
                size="sm"
                disabled={!countFromDirty || !countFromValue || countFromMutation.isPending}
                loading={countFromMutation.isPending}
                onClick={() =>
                  openConfirm(t('xpRules.countFromConfirm', { date: countFromValue }), () =>
                    countFromMutation.mutate(countFromValue)
                  )
                }
              >
                {t('common.save')}
              </Button>
              {serverCountFromDate && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={countFromMutation.isPending}
                  onClick={() => countFromMutation.mutate(null)}
                >
                  {t('xpRules.countFromClear')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope selector: club-wide + one pill per team of the active club. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {canClubScope && (
          <ScopePill active={isClubScope} onClick={() => setSelected(null)}>
            {t('xpRules.scopeClub')}
          </ScopePill>
        )}
        {clubTeams.map((tm) => (
          <ScopePill key={tm.id} active={scope === tm.id} onClick={() => setSelected(tm.id)}>
            {tm.name}
          </ScopePill>
        ))}
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{isClubScope ? t('xpRules.infoClub') : t('xpRules.infoTeam')}</span>
      </div>

      {isLoading || !rules ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {rules.map((r) => (
                <RuleRow
                  key={r.eventType}
                  rule={r}
                  value={valueOf(r)}
                  editable={isEditable(r)}
                  teamScope={!isClubScope}
                  onChange={(v) => setEdits((e) => ({ ...e, [r.eventType]: v }))}
                  onReset={() =>
                    setEdits((e) => ({ ...e, [r.eventType]: String(r.inheritedPoints) }))
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ScopePill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-sky-600 px-3 py-1.5 text-sm font-medium text-white'
          : 'rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200'
      }
    >
      {children}
    </button>
  )
}

function RuleRow({
  rule,
  value,
  editable,
  teamScope,
  onChange,
  onReset,
}: {
  rule: XpRuleConfigDto
  value: string
  editable: boolean
  teamScope: boolean
  onChange: (v: string) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const overridden = editable && Number(value) !== rule.inheritedPoints

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-medium text-gray-900">
          {t(`xp.type.${rule.eventType}`)}
          {!editable && (
            <span
              className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-400"
              title={t('xpRules.clubOnly')}
            >
              <Lock className="h-3 w-3" />
              {t('xpRules.clubOnly')}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-gray-400">
          {teamScope
            ? t('xpRules.inheritsHint', { value: rule.inheritedPoints })
            : t('xpRules.defaultHint', { value: rule.defaultPoints })}
        </div>
      </div>

      {overridden && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={t('xpRules.reset')}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="relative">
        <Coins className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-500" />
        <input
          type="number"
          min={0}
          value={editable ? value : String(rule.inheritedPoints)}
          disabled={!editable}
          onChange={(e) => onChange(e.target.value)}
          className={
            'w-24 rounded-lg border py-1.5 pl-7 pr-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 ' +
            (!editable
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : overridden
                ? 'border-sky-400 bg-white font-semibold text-sky-700 focus:border-sky-500'
                : 'border-gray-300 bg-white text-gray-900 focus:border-sky-500')
          }
        />
      </div>
    </div>
  )
}
