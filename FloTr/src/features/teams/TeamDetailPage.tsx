import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Users,
  Clock,
  Share2,
  Copy,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  CalendarPlus,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { MemberLink } from '../../components/shared/MemberLink'
import { SortableTh } from '../../components/shared/SortableTh'
import { useTableSort } from '../../utils/tableSort'
import { teamsApi, xpApi, appointmentsApi } from '../../api/index'
import { TeamSeasonStatsCard } from '../stats/TeamSeasonStatsCard'
import { TeamAttendanceTab } from '../attendance/TeamAttendanceTab'
import { AppointmentFormModal } from '../appointments/AppointmentFormModal'
import { RewardsPage } from '../rewards/RewardsPage'
import { LineupsListPage } from '../lineups/LineupsListPage'
import { AddTeamMemberModal } from './AddTeamMemberModal'
import { TeamSettingsModal } from './TeamSettingsModal'
import { TeamTestingTab } from './TeamTestingTab'
import { useAuthStore } from '../../store/authStore'
import { formatFullName } from '../../utils/name'
import type { MemberDto, TeamMemberDto, AppointmentDto } from '../../types/domain.types'

// The single team detail page: rich overview for everyone (coach+), with in-place editing for the
// roles that may — HeadCoach+ edits settings/roster & calendar sharing; any coach records events.
// (Merged 2026-08-05 with the former /teams/:id/edit workspace, which now redirects here.)
export function TeamDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { effectiveRole } = useAuthStore()
  const canManage = ['HeadCoach', 'ClubAdmin', 'Admin'].includes(effectiveRole)
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<TeamMemberDto | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [deleteApptConfirm, setDeleteApptConfirm] = useState<AppointmentDto | null>(null)
  const [activeTab, setActiveTab] = useState<
    'roster' | 'events' | 'testing' | 'lineups' | 'rewards' | 'stats' | 'attendance' | 'calendar'
  >('roster')

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', team?.clubId, 'career'],
    queryFn: () => xpApi.getLeaderboard({ clubId: team?.clubId, sort: 'career' }),
    enabled: !!team,
  })

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    enabled: !!id,
  })

  const invalidateTeam = () => queryClient.invalidateQueries({ queryKey: ['team', id] })

  const generateTokenMutation = useMutation({
    mutationFn: () => teamsApi.generateCalendarToken(Number(id)),
    onSuccess: invalidateTeam,
  })
  const revokeTokenMutation = useMutation({
    mutationFn: () => teamsApi.revokeCalendarToken(Number(id)),
    onSuccess: invalidateTeam,
  })
  const addMembersMutation = useMutation({
    mutationFn: async (data: { members: MemberDto[]; isCoach: boolean; isPlayer: boolean }) => {
      for (const member of data.members) {
        const memberIsCoach =
          data.isCoach && !!(member.hasClubRoleCoach || member.hasClubRoleMainCoach)
        await teamsApi.addMember(Number(id), {
          memberId: member.id,
          isCoach: memberIsCoach,
          isPlayer: data.isPlayer || !memberIsCoach,
        })
      }
    },
    onSuccess: () => {
      invalidateTeam()
      setAddMemberOpen(false)
    },
  })
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => teamsApi.removeMember(Number(id), memberId),
    onSuccess: () => {
      invalidateTeam()
      setRemoveConfirm(null)
    },
  })
  const deleteApptMutation = useMutation({
    mutationFn: (appointmentId: number) => appointmentsApi.delete(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setDeleteApptConfirm(null)
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (!team) return <p className="text-center text-gray-500 mt-12">{t('teams.teamNotFound')}</p>

  const teamMembers = team.teamMembers ?? []
  const coaches = teamMembers.filter((tm) => tm.isCoach)
  const players = teamMembers.filter((tm) => tm.isPlayer && !tm.isCoach)
  const xpByMember = new Map((leaderboard?.rows ?? []).map((r) => [r.memberId, r]))

  const appointmentTypeLabels: Record<number, string> = {
    0: t('appointments.typeTraining'),
    1: t('appointments.typeCamp'),
    2: t('appointments.typePromotion'),
    3: t('appointments.typeMatch'),
    4: t('appointments.typeOther'),
    5: t('appointments.typeWorkshop'),
    6: t('appointments.typeOrganizing'),
    7: t('appointments.typePreperation'),
    8: t('appointments.typeTesting'),
  }
  const now = new Date()
  const upcomingAppointments = (appointments ?? [])
    .filter((a) => a.teamId === team.id && new Date(a.start) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
  const shareUrl = team.publicCalendarToken
    ? `${window.location.origin}/share/${team.publicCalendarToken}`
    : null
  const icalUrl = team.publicCalendarToken
    ? `${apiBaseUrl}/public/calendar/${team.publicCalendarToken}.ics`
    : null

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{team.name}</h1>
      </div>

      {/* Info */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            {team.ageGroup && (
              <span>
                {t('teams.formAgeGroup')}: <strong>{team.ageGroup.name}</strong>
              </span>
            )}
            {(team.personsMin != null || team.personsMax != null) && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-400" />
                {team.personsMin ?? '?'}–{team.personsMax ?? '?'} {t('trainings.players')}
              </span>
            )}
            {team.defaultTrainingDuration != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                {team.defaultTrainingDuration} min
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canManage && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
            {t('teams.settingsTitle')}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-6 border-b border-gray-200 overflow-x-auto">
        <TabButton active={activeTab === 'roster'} onClick={() => setActiveTab('roster')}>
          {t('teams.tabMembers')} ({players.length})
        </TabButton>
        <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
          {t('appointments.title')} ({upcomingAppointments.length})
        </TabButton>
        <TabButton active={activeTab === 'testing'} onClick={() => setActiveTab('testing')}>
          {t('testing.title')}
        </TabButton>
        <TabButton active={activeTab === 'lineups'} onClick={() => setActiveTab('lineups')}>
          {t('lineups.title')}
        </TabButton>
        <TabButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
          {t('rewards.title')}
        </TabButton>
        <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
          {t('stats.teamStats')}
        </TabButton>
        <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')}>
          {t('attendance.teamAttendance')}
        </TabButton>
        {canManage && (
          <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>
            {t('teams.publicCalendar')}
          </TabButton>
        )}
      </div>

      {/* Roster tab */}
      {activeTab === 'roster' && (
        <>
          {/* Coaches */}
          {coaches.length > 0 && (
            <Card className="mb-4">
              <CardContent className="py-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {t('teams.tabCoaches')} ({coaches.length})
                </p>
                <MemberTable members={coaches} canManage={canManage} onRemove={setRemoveConfirm} />
              </CardContent>
            </Card>
          )}

          {/* Players */}
          <Card>
            <CardContent className="py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {t('teams.tabMembers')} ({players.length})
                </p>
                {canManage && (
                  <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    {t('teams.addMember')}
                  </Button>
                )}
              </div>
              {players.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t('teams.noMembers')}</p>
              ) : (
                <MemberTable
                  members={players}
                  canManage={canManage}
                  onRemove={setRemoveConfirm}
                  xpValue={(memberId) => xpByMember.get(memberId)?.lifetimeXp}
                  renderXp={(memberId) => {
                    const xp = xpByMember.get(memberId)
                    if (!xp) return <span className="text-gray-300">–</span>
                    return (
                      <span>
                        <span className="font-semibold text-gray-900">{xp.lifetimeXp} XP</span>
                        <span className="text-gray-400">
                          {' · '}
                          {t(`xp.rank${xp.careerRankIndex}`, { defaultValue: xp.careerRank })}
                        </span>
                      </span>
                    )
                  }}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Events tab */}
      {activeTab === 'events' && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              {t('appointments.title')} ({upcomingAppointments.length})
            </h2>
            <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
              <CalendarPlus className="h-3.5 w-3.5" />
              {t('appointments.newEvent')}
            </Button>
          </div>
          <Card>
            <CardContent className="py-4">
              <EventsTable
                appointments={upcomingAppointments}
                typeLabels={appointmentTypeLabels}
                onDelete={setDeleteApptConfirm}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Testing tab */}
      {activeTab === 'testing' && (
        <div className="mt-2">
          <TeamTestingTab teamId={team.id} players={teamMembers.filter((tm) => tm.isPlayer)} />
        </div>
      )}

      {/* Lineups tab */}
      {activeTab === 'lineups' && (
        <div className="mt-2">
          <LineupsListPage teamId={team.id} embedded />
        </div>
      )}

      {/* Rewards tab */}
      {activeTab === 'rewards' && (
        <div className="mt-2">
          <RewardsPage teamId={team.id} embedded />
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && (
        <div className="mt-6">
          <TeamSeasonStatsCard teamId={team.id} />
        </div>
      )}

      {/* Attendance tab */}
      {activeTab === 'attendance' && (
        <div className="mt-6">
          <TeamAttendanceTab teamId={team.id} />
        </div>
      )}

      {/* Calendar tab — HeadCoach+ only */}
      {activeTab === 'calendar' && canManage && (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
            <Share2 className="h-4 w-4" />
            {t('teams.publicCalendar')}
          </h2>
          <Card>
            <CardContent className="py-4 space-y-4">
              {shareUrl ? (
                <>
                  <div className="flex justify-center">
                    <QRCodeSVG value={shareUrl} size={120} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      {t('lineups.publicLink')}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 font-mono"
                      />
                      <Button size="sm" variant="outline" onClick={() => handleCopy(shareUrl)}>
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? t('common.copied') : t('common.copy')}
                      </Button>
                    </div>
                  </div>
                  {icalUrl && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-gray-500">iCal URL</p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={icalUrl}
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 font-mono"
                        />
                        <Button size="sm" variant="outline" onClick={() => handleCopy(icalUrl)}>
                          <Copy className="h-3.5 w-3.5" />
                          {t('common.copy')}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateTokenMutation.mutate()}
                      disabled={generateTokenMutation.isPending}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('common.generate')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeTokenMutation.mutate()}
                      disabled={revokeTokenMutation.isPending}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('common.revoke')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="mb-3 text-sm text-gray-500">{t('teams.calendarNotActive')}</p>
                  <Button
                    size="sm"
                    onClick={() => generateTokenMutation.mutate()}
                    disabled={generateTokenMutation.isPending}
                  >
                    <Share2 className="h-4 w-4" />
                    {t('common.share')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      {canManage && settingsOpen && (
        <TeamSettingsModal
          team={team}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          canManage={canManage}
        />
      )}
      {canManage && addMemberOpen && (
        <AddTeamMemberModal
          teamId={team.id}
          clubId={team.clubId}
          existingMemberIds={teamMembers.map((tm) => tm.memberId)}
          onAddMembers={(members, isCoach, isPlayer) =>
            addMembersMutation.mutate({ members, isCoach, isPlayer })
          }
          adding={addMembersMutation.isPending}
          onClose={() => setAddMemberOpen(false)}
        />
      )}
      {scheduleOpen && (
        <AppointmentFormModal
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          defaultTeamId={team.id}
        />
      )}

      <Modal
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title={t('teams.removeMember')}
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          {t('teams.removeMemberConfirmText', {
            name: formatFullName(removeConfirm?.member?.firstName, removeConfirm?.member?.lastName),
          })}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setRemoveConfirm(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => removeConfirm && removeMemberMutation.mutate(removeConfirm.memberId)}
            disabled={removeMemberMutation.isPending}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteApptConfirm}
        onClose={() => setDeleteApptConfirm(null)}
        title={t('appointments.deleteEvent')}
        maxWidth="sm"
      >
        <p className="mb-4 text-sm text-gray-600">
          {t('appointments.confirmDeleteEvent')}{' '}
          <strong>
            {deleteApptConfirm?.name ||
              appointmentTypeLabels[deleteApptConfirm?.appointmentType ?? -1] ||
              t('common.detail')}
          </strong>
          {deleteApptConfirm && (
            <> ({format(parseISO(deleteApptConfirm.start), 'd. M. yyyy HH:mm')})</>
          )}
          ?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteApptConfirm(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteApptConfirm && deleteApptMutation.mutate(deleteApptConfirm.id)}
            disabled={deleteApptMutation.isPending}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium ${
        active
          ? 'border-sky-500 text-sky-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function EventsTable({
  appointments,
  typeLabels,
  onDelete,
}: {
  appointments: AppointmentDto[]
  typeLabels: Record<number, string>
  onDelete: (a: AppointmentDto) => void
}) {
  const { t } = useTranslation()
  const { sorted, sortKey, dir, toggle } = useTableSort(
    appointments,
    {
      date: (a) => a.start,
      type: (a) => typeLabels[a.appointmentType ?? -1] ?? '',
      name: (a) => a.name ?? '',
    },
    'date'
  )
  if (appointments.length === 0)
    return <p className="py-4 text-center text-sm text-gray-400">{t('teams.noUpcomingEvents')}</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
          <tr>
            <SortableTh
              label={t('common.date')}
              columnKey="date"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            <SortableTh
              label={t('common.type')}
              columnKey="type"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            <SortableTh
              label={t('common.name')}
              columnKey="name"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            <th className="w-12 px-3 py-2 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                {format(parseISO(a.start), 'd. M. yyyy HH:mm')}
              </td>
              <td className="px-3 py-2 text-gray-600">
                {typeLabels[a.appointmentType ?? -1] ?? '—'}
              </td>
              <td className="px-3 py-2 text-gray-600">{a.name || '—'}</td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(a)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title={t('appointments.deleteEvent')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// One roster table — a single PŘÍJMENÍ Jméno name link (formatFullName), optional XP + remove.
function MemberTable({
  members,
  canManage,
  onRemove,
  renderXp,
  xpValue,
}: {
  members: TeamMemberDto[]
  canManage: boolean
  onRemove: (tm: TeamMemberDto) => void
  renderXp?: (memberId: number) => ReactNode
  xpValue?: (memberId: number) => number | undefined
}) {
  const { t } = useTranslation()
  const { sorted, sortKey, dir, toggle } = useTableSort(
    members,
    {
      name: (tm) => tm.member?.lastName,
      birthYear: (tm) => tm.member?.birthYear,
      xp: (tm) => xpValue?.(tm.memberId) ?? null,
    },
    'name'
  )
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
          <tr>
            <SortableTh
              label={t('common.name')}
              columnKey="name"
              activeKey={sortKey}
              dir={dir}
              onSort={toggle}
            />
            {renderXp && (
              <SortableTh
                label={t('teams.colBirthYear')}
                columnKey="birthYear"
                activeKey={sortKey}
                dir={dir}
                onSort={toggle}
              />
            )}
            {renderXp && (
              <SortableTh
                label={t('teams.colXp')}
                columnKey="xp"
                activeKey={sortKey}
                dir={dir}
                onSort={toggle}
              />
            )}
            {canManage && <th className="w-12 px-3 py-2 text-right"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((tm) => (
            <tr key={tm.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">
                <MemberLink
                  memberId={tm.memberId}
                  name={formatFullName(tm.member?.firstName, tm.member?.lastName)}
                />
              </td>
              {renderXp && (
                <td className="px-3 py-2 text-gray-500">{tm.member?.birthYear || '–'}</td>
              )}
              {renderXp && <td className="px-3 py-2 text-xs">{renderXp(tm.memberId)}</td>}
              {canManage && (
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(tm)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title={t('teams.removeMember')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
