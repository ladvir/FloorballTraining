import { useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  UserX,
  UserCheck,
  ClipboardCheck,
  User,
  Activity,
  Dumbbell,
  BarChart2,
  FileText,
  Target,
  Award,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { membersApi, clubsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { MemberDto } from '../../types/domain.types'
import { MemberSeasonStatsCard } from '../stats/MemberSeasonStatsCard'
import { CanadianScoringCard } from '../stats/CanadianScoringCard'
import { PerformanceTrendChart } from '../stats/PerformanceTrendChart'
import { PlayerTestResults } from '../testing/PlayerTestResults'
import { MemberAttendanceSection } from '../attendance/MemberAttendanceSection'
import { IndividualWorkoutSection } from '../workouts/IndividualWorkoutSection'
import { HomeTrainingSection } from '../workouts/HomeTrainingSection'
import { AccountLinkSection, AccountStatusBadge } from './AccountLinkSection'
import { GuardiansSection } from './GuardiansSection'
import { PlayerSkillsSection } from './PlayerSkillsSection'
import { XpCareerCard } from './XpCareerCard'
import { XpBreakdown } from './XpBreakdown'
import { BadgesCard } from './BadgesCard'
import { RewardsCard } from './RewardsCard'
import { ChallengesCard } from './ChallengesCard'
import { cn } from '../../utils/cn'
import { formatFullName } from '../../utils/name'

type TabId = 'info' | 'tests' | 'attendance' | 'workouts' | 'stats' | 'skills' | 'xp'

interface Tab {
  id: TabId
  labelKey: string
  icon: React.ElementType
  coachOnly?: boolean
}

const TABS: Tab[] = [
  { id: 'info', labelKey: 'members.tabInfo', icon: User },
  { id: 'tests', labelKey: 'members.tabTests', icon: ClipboardCheck, coachOnly: true },
  { id: 'attendance', labelKey: 'members.tabAttendance', icon: Activity },
  { id: 'workouts', labelKey: 'members.tabPlan', icon: Dumbbell },
  { id: 'stats', labelKey: 'members.tabStats', icon: BarChart2 },
  { id: 'skills', labelKey: 'members.tabSkills', icon: Target },
  { id: 'xp', labelKey: 'members.tabXp', icon: Award },
]

interface Props {
  /** Self-view (route /me): the caller's own member record instead of :id from the URL, and no
   *  roster browsing (a player only ever sees their own card). */
  selfView?: boolean
}

export function MemberDetailPage({ selfView = false }: Props) {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { user, activeClubId, isAdmin, isHeadCoach, isCoach } = useAuthStore()
  const canManage = !selfView && (isAdmin || isHeadCoach)
  const myMemberId = user?.clubMemberships?.find((m) => m.clubId === activeClubId)?.memberId ?? null
  const effectiveId = selfView ? myMemberId : Number(id)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)

  // Deep-link support (Dashboard's "start this challenge" button lands here on the workouts tab).
  // Adjusted during render rather than in an effect (react.dev/learn/you-might-not-need-an-effect)
  // so a same-route navigation (e.g. clicking "start" again while already on /me) switches tabs
  // in the same render instead of flashing the previous tab first.
  const [lastUrlTab, setLastUrlTab] = useState<string | null>(null)
  const urlTab = searchParams.get('tab')
  if (urlTab && urlTab !== lastUrlTab) {
    setLastUrlTab(urlTab)
    setActiveTab(urlTab as TabId)
  }

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', effectiveId],
    queryFn: () => membersApi.getById(effectiveId!),
    enabled: !!effectiveId,
  })

  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })

  // Prev/next navigation across the (club-scoped) roster, in the list's default order (by last
  // name, then first name) — same as MembersPage. Self-view never browses the roster.
  const { data: allMembers } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
    enabled: !selfView,
  })
  const { prevId, nextId } = useMemo(() => {
    const none = { prevId: null as number | null, nextId: null as number | null }
    if (selfView || !allMembers || allMembers.length === 0) return none
    const sorted = [...allMembers].sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName, 'cs', { sensitivity: 'base' }) ||
        a.firstName.localeCompare(b.firstName, 'cs', { sensitivity: 'base' })
    )
    const idx = sorted.findIndex((m) => m.id === effectiveId)
    if (idx === -1) return none
    return {
      prevId: idx > 0 ? sorted[idx - 1].id : null,
      nextId: idx < sorted.length - 1 ? sorted[idx + 1].id : null,
    }
  }, [allMembers, effectiveId, selfView])

  const { data: memberTeams } = useQuery({
    queryKey: ['member-teams', effectiveId],
    queryFn: () => membersApi.getTeams(effectiveId!),
    enabled: !!effectiveId && (isCoach || selfView),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (m: MemberDto) => membersApi.update({ ...m, isActive: !m.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', effectiveId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setDeactivateConfirm(false)
    },
  })

  if (isLoading) return <LoadingSpinner />

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('members.memberNotFound')}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate(selfView ? '/' : '/members')}
        >
          {t('common.back')}
        </Button>
      </div>
    )
  }

  const club = clubs?.find((c) => c.id === member.clubId)
  const roles = [
    member.hasClubRoleClubAdmin && t('members.roleClubAdmin'),
    member.hasClubRoleMainCoach && t('members.roleMainCoach'),
    member.hasClubRoleCoach && !member.hasClubRoleMainCoach && t('members.roleCoach'),
  ].filter(Boolean)

  const isOwner = selfView || (!!user?.id && user.id === member.appUserId)
  const visibleTabs = TABS.filter((tab) => !tab.coachOnly || isCoach || selfView)

  // Team scope for the test-average comparison: prefer a team where the member plays.
  const primaryTeamId = memberTeams?.find((tm) => tm.isPlayer)?.id ?? memberTeams?.[0]?.id ?? null

  return (
    <div className="mx-auto max-w-2xl lg:max-w-4xl 2xl:max-w-6xl">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(selfView ? '/' : '/members')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {!selfView && (
          <>
            <button
              type="button"
              disabled={prevId == null}
              onClick={() => prevId != null && navigate(`/members/${prevId}`)}
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title={t('members.prevMember')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={nextId == null}
              onClick={() => nextId != null && navigate(`/members/${nextId}`)}
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title={t('members.nextMember')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {formatFullName(member.firstName, member.lastName)}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {member.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {t('members.active')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                {t('members.inactive')}
              </span>
            )}
            {canManage && <AccountStatusBadge member={member} />}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/members/${member.id}/report`)}
            >
              <FileText className="h-4 w-4" />
              {t('memberReport.button')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/members', { state: { editMemberId: member.id } })}
            >
              <Pencil className="h-4 w-4" />
              {t('common.edit')}
            </Button>
            <Button
              variant={member.isActive ? 'danger' : 'primary'}
              size="sm"
              onClick={() => setDeactivateConfirm(true)}
            >
              {member.isActive ? (
                <>
                  <UserX className="h-4 w-4" />
                  {t('members.deactivate')}
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  {t('members.activate')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {t(tab.labelKey)}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <dl className="space-y-3">
                <InfoRow label={t('members.formFirstName')} value={member.firstName} />
                <InfoRow label={t('members.formLastName')} value={member.lastName} />
                <InfoRow
                  label={t('members.birthYear')}
                  value={member.birthYear ? String(member.birthYear) : '–'}
                />
                <InfoRow label={t('members.formEmail')} value={member.email || '–'} />
                <InfoRow label={t('members.clubLabel')} value={club?.name || '–'} />
                <InfoRow
                  label={t('members.clubRolesLabel')}
                  value={roles.length ? roles.join(', ') : '–'}
                />
              </dl>
            </CardContent>
          </Card>
          {canManage && <AccountLinkSection memberId={member.id} />}
          {canManage && <GuardiansSection member={member} />}
        </div>
      )}

      {activeTab === 'tests' && (isCoach || selfView) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ClipboardCheck className="h-4 w-4" />
              {t('members.tabTests')}
            </h2>
            {/* /testing/player/:id is a coach-only route — not reachable from self-view. */}
            {isCoach && (
              <Link to={`/testing/player/${member.id}`}>
                <Button variant="ghost" size="sm">
                  {t('members.openProfile')}
                </Button>
              </Link>
            )}
          </div>
          <PlayerTestResults memberId={member.id} teamId={primaryTeamId} />
        </div>
      )}

      {activeTab === 'attendance' && <MemberAttendanceSection memberId={member.id} />}

      {activeTab === 'workouts' && (
        <>
          <IndividualWorkoutSection memberId={member.id} memberAppUserId={member.appUserId} />
          <HomeTrainingSection memberId={member.id} memberAppUserId={member.appUserId} />
        </>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* A — Canadian scoring */}
          <CanadianScoringCard memberId={member.id} />

          {/* C — Performance trend */}
          <PerformanceTrendChart memberId={member.id} />

          {/* Other metrics by season (training + non-scoring) */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              {t('members.statsBySeason')}
            </h2>
            <MemberSeasonStatsCard memberId={member.id} />
          </div>
        </div>
      )}

      {activeTab === 'skills' && <PlayerSkillsSection memberId={member.id} />}

      {activeTab === 'xp' && (
        <div className="space-y-6">
          <XpCareerCard memberId={member.id} />
          <ChallengesCard memberId={member.id} isOwner={isOwner} />
          <XpBreakdown memberId={member.id} />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Award className="h-4 w-4" />
                {t('badge.title')}
              </h2>
              <Link to="/members">
                <Button variant="ghost" size="sm">
                  {t('leaderboard.title')}
                </Button>
              </Link>
            </div>
            <BadgesCard memberId={member.id} />
          </div>
          <RewardsCard memberId={member.id} />
        </div>
      )}

      {/* Deactivate/Activate confirm modal */}
      <Modal
        isOpen={deactivateConfirm}
        onClose={() => setDeactivateConfirm(false)}
        title={member.isActive ? t('members.deactivateMember') : t('members.activateMember')}
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          {member.isActive
            ? t('members.deactivateConfirmFull', {
                name: formatFullName(member.firstName, member.lastName),
              })
            : t('members.activateConfirmFull', {
                name: formatFullName(member.firstName, member.lastName),
              })}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeactivateConfirm(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={member.isActive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => toggleActiveMutation.mutate(member)}
            disabled={toggleActiveMutation.isPending}
          >
            {member.isActive ? t('members.deactivate') : t('members.activate')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
