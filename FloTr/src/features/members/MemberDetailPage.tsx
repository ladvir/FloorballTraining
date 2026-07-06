import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Pencil,
  UserX,
  UserCheck,
  ClipboardCheck,
  User,
  Activity,
  Dumbbell,
  BarChart2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { membersApi, clubsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { MemberDto } from '../../types/domain.types'
import { MemberSeasonStatsCard } from '../stats/MemberSeasonStatsCard'
import { PlayerTestResults } from '../testing/PlayerTestResults'
import { MemberAttendanceSection } from '../attendance/MemberAttendanceSection'
import { IndividualWorkoutSection } from '../workouts/IndividualWorkoutSection'
import { cn } from '../../utils/cn'

type TabId = 'info' | 'tests' | 'attendance' | 'workouts' | 'stats'

interface Tab {
  id: TabId
  label: string
  icon: React.ElementType
  coachOnly?: boolean
}

const TABS: Tab[] = [
  { id: 'info', label: 'Informace', icon: User },
  { id: 'tests', label: 'Testy', icon: ClipboardCheck, coachOnly: true },
  { id: 'attendance', label: 'Docházka', icon: Activity },
  { id: 'workouts', label: 'Individuální plán', icon: Dumbbell },
  { id: 'stats', label: 'Statistiky', icon: BarChart2 },
]

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin, isHeadCoach, isCoach } = useAuthStore()
  const canManage = isAdmin || isHeadCoach
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => membersApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })

  const toggleActiveMutation = useMutation({
    mutationFn: (m: MemberDto) => membersApi.update({ ...m, isActive: !m.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setDeactivateConfirm(false)
    },
  })

  if (isLoading) return <LoadingSpinner />

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Člen nebyl nalezen.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/members')}>
          Zpět na seznam
        </Button>
      </div>
    )
  }

  const club = clubs?.find((c) => c.id === member.clubId)
  const roles = [
    member.hasClubRoleClubAdmin && 'Klubový administrátor',
    member.hasClubRoleMainCoach && 'Hlavní trenér',
    member.hasClubRoleCoach && !member.hasClubRoleMainCoach && 'Trenér',
  ].filter(Boolean)

  const visibleTabs = TABS.filter((t) => !t.coachOnly || isCoach)

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {member.firstName} {member.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {member.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Aktivní
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                Neaktivní
              </span>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/members', { state: { editMemberId: member.id } })}
            >
              <Pencil className="h-4 w-4" />
              Upravit
            </Button>
            <Button
              variant={member.isActive ? 'danger' : 'primary'}
              size="sm"
              onClick={() => setDeactivateConfirm(true)}
            >
              {member.isActive ? (
                <>
                  <UserX className="h-4 w-4" />
                  Deaktivovat
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Aktivovat
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
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <Card>
          <CardContent className="py-4">
            <dl className="space-y-3">
              <InfoRow label="Jméno" value={member.firstName} />
              <InfoRow label="Příjmení" value={member.lastName} />
              <InfoRow label="Ročník" value={member.birthYear ? String(member.birthYear) : '–'} />
              <InfoRow label="Email" value={member.email || '–'} />
              <InfoRow label="Klub" value={club?.name || '–'} />
              <InfoRow label="Klubové role" value={roles.length ? roles.join(', ') : '–'} />
            </dl>
          </CardContent>
        </Card>
      )}

      {activeTab === 'tests' && isCoach && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ClipboardCheck className="h-4 w-4" />
              Testy
            </h2>
            <Link to={`/testing/player/${member.id}`}>
              <Button variant="ghost" size="sm">
                Otevřít profil
              </Button>
            </Link>
          </div>
          <PlayerTestResults memberId={member.id} />
        </div>
      )}

      {activeTab === 'attendance' && <MemberAttendanceSection memberId={member.id} />}

      {activeTab === 'workouts' && (
        <IndividualWorkoutSection memberId={member.id} memberAppUserId={member.appUserId} />
      )}

      {activeTab === 'stats' && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Statistiky dle sezóny
          </h2>
          <MemberSeasonStatsCard memberId={member.id} />
        </div>
      )}

      {/* Deactivate/Activate confirm modal */}
      <Modal
        isOpen={deactivateConfirm}
        onClose={() => setDeactivateConfirm(false)}
        title={member.isActive ? 'Deaktivovat člena' : 'Aktivovat člena'}
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          {member.isActive ? (
            <>
              Opravdu chcete deaktivovat člena{' '}
              <strong>
                {member.firstName} {member.lastName}
              </strong>
              ? Člen nebude smazán, pouze označen jako neaktivní.
            </>
          ) : (
            <>
              Chcete znovu aktivovat člena{' '}
              <strong>
                {member.firstName} {member.lastName}
              </strong>
              ?
            </>
          )}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeactivateConfirm(false)}>
            Zrušit
          </Button>
          <Button
            variant={member.isActive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => toggleActiveMutation.mutate(member)}
            disabled={toggleActiveMutation.isPending}
          >
            {member.isActive ? 'Deaktivovat' : 'Aktivovat'}
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
