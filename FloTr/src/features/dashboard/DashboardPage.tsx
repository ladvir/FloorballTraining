import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, isAfter } from 'date-fns'
import { cs } from 'date-fns/locale'
import { useNavigate, Link } from 'react-router-dom'
import { ClipboardList, CheckCircle, AlertCircle, Clock, Repeat, FileSpreadsheet, Dumbbell, Plus, CalendarPlus, Layers, User, UserCheck, UserX, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { dashboardApi, roleRequestsApi } from '../../api/index'
import { activitiesApi } from '../../api/activities.api'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import { ExportWorkTimeModal } from '../appointments/ExportWorkTimeModal'
import { AppointmentFormModal } from '../appointments/AppointmentFormModal'
import { AppointmentDetailModal } from '../appointments/AppointmentDetailModal'
import type { AppointmentDto } from '../../types/domain.types'

const typeLabels: Record<number, string> = {
  0: 'Trénink',
  1: 'Soustředění',
  2: 'Propagace',
  3: 'Zápas',
  4: 'Ostatní',
  5: 'Školení',
  6: 'Pořádání akce',
}

const typeBadgeVariant: Record<number, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  0: 'info',
  1: 'success',
  2: 'warning',
  3: 'danger',
  4: 'default',
  5: 'info',
  6: 'success',
}

const roleLabels: Record<string, string> = {
  Coach: 'Trenér',
  HeadCoach: 'Hlavní trenér',
}

export function DashboardPage() {
  const { user, isCoach, isHeadCoach } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [exportOpen, setExportOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [detailAppointmentId, setDetailAppointmentId] = useState<number | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

  const { data: allTrainings } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => trainingsApi.getAll(),
  })

  const { data: allActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
  })

  const { data: roleRequests } = useQuery({
    queryKey: ['roleRequests'],
    queryFn: roleRequestsApi.getPending,
    enabled: isHeadCoach,
  })

  const approveMutation = useMutation({
    mutationFn: roleRequestsApi.approve,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roleRequests'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: roleRequestsApi.reject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roleRequests'] }),
  })

  if (isLoading) return <LoadingSpinner />

  const greeting = user?.firstName ? `Dobrý den, ${user.firstName}!` : 'Dobrý den!'
  const allAppointments = data?.appointments ?? []
  const defaultTeamId = user?.defaultTeamId ?? null
  const appointments = defaultTeamId
    ? allAppointments.filter((a) => a.teamId === defaultTeamId || (a.teamId == null && a.ownerUserId === user?.id))
    : allAppointments

  // Activity counts
  const totalActivities = allActivities?.length ?? 0
  const draftActivities = allActivities?.filter((a) => a.isDraft !== false).length ?? 0
  const completeActivities = totalActivities - draftActivities

  // Recent items (last 5 by id descending — newest first)
  const recentTrainings = allTrainings
    ? [...allTrainings].sort((a, b) => b.id - a.id).slice(0, 5)
    : []
  const recentActivities = allActivities
    ? [...allActivities].sort((a, b) => b.id - a.id).slice(0, 5)
    : []

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{greeting}</h1>
          <p className="mt-1 text-sm text-gray-500">Přehled systému FloTr</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAppointmentModalOpen(true)}>
            <CalendarPlus className="h-4 w-4" />Událost
          </Button>
          {isCoach && (
            <Button size="sm" variant="outline" onClick={() => navigate('/trainings/new')}>
              <Plus className="h-4 w-4" />Trénink
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate('/activities/new')}>
            <Layers className="h-4 w-4" />Aktivita
          </Button>
          {isCoach && (
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />Výkaz práce
            </Button>
          )}
        </div>
      </div>

      {/* 3 columns: Události | Tréninky | Aktivity */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Column 1: Události */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Nadcházející události
          </h2>
          {!defaultTeamId && (
            <p className="mb-2 text-xs text-gray-400">
              Tip: nastavte si výchozí tým v <Link to="/profile" className="text-sky-600 hover:underline">profilu</Link>, aby se zde zobrazovaly jen jeho události.
            </p>
          )}
          {appointments.length === 0 ? (
            <p className="text-sm text-gray-500">
              {defaultTeamId
                ? 'Žádné nadcházející události pro váš výchozí tým.'
                : 'Žádné nadcházející události.'}
            </p>
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 5).map((apt) => (
                <AppointmentCard key={apt.id} apt={apt} onClick={() => setDetailAppointmentId(apt.id)} />
              ))}
              {appointments.length > 5 && (
                <Link to="/appointments" className="flex items-center justify-center gap-1 pt-1 text-xs text-sky-600 hover:text-sky-800">
                  Zobrazit vše ({appointments.length}) <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Column 2: Tréninky */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Tréninky
          </h2>
          {data && (data.totalTrainings > 0) && (
            <div className="mb-3 flex items-center gap-3 text-sm">
              <button onClick={() => navigate('/trainings')} className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 hover:bg-gray-100 transition-colors">
                <ClipboardList className="h-4 w-4 text-gray-500" />
                <span className="font-bold text-gray-900">{data.totalTrainings}</span>
                <span className="text-xs text-gray-500">celkem</span>
              </button>
              <button onClick={() => navigate('/trainings?status=complete')} className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 hover:bg-green-100 transition-colors">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-bold text-green-700">{data.completeTrainings}</span>
              </button>
              <button onClick={() => navigate('/trainings?status=draft')} className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-1.5 hover:bg-yellow-100 transition-colors">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-yellow-700">{data.draftTrainings}</span>
              </button>
            </div>
          )}
          {recentTrainings.length === 0 ? (
            <p className="text-sm text-gray-500">Žádné tréninky.</p>
          ) : (
            <div className="space-y-2">
              {recentTrainings.map((t) => (
                <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/trainings/${t.id}/edit`)}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${t.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {t.duration > 0 && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration} min</span>
                        )}
                        {t.createdByUserName && (
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{t.createdByUserName}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(allTrainings?.length ?? 0) > 5 && (
                <Link to="/trainings" className="flex items-center justify-center gap-1 pt-1 text-xs text-sky-600 hover:text-sky-800">
                  Zobrazit vše ({allTrainings?.length}) <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Aktivity */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Aktivity
          </h2>
          {totalActivities > 0 && (
            <div className="mb-3 flex items-center gap-3 text-sm">
              <button onClick={() => navigate('/activities')} className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 hover:bg-gray-100 transition-colors">
                <Layers className="h-4 w-4 text-gray-500" />
                <span className="font-bold text-gray-900">{totalActivities}</span>
                <span className="text-xs text-gray-500">celkem</span>
              </button>
              <button onClick={() => navigate('/activities?status=complete')} className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 hover:bg-green-100 transition-colors">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-bold text-green-700">{completeActivities}</span>
              </button>
              <button onClick={() => navigate('/activities?status=draft')} className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-1.5 hover:bg-yellow-100 transition-colors">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-yellow-700">{draftActivities}</span>
              </button>
            </div>
          )}
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500">Žádné aktivity.</p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((a) => (
                <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/activities/${a.id}/edit`)}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${a.isDraft !== false ? 'bg-yellow-400' : 'bg-green-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {(a.durationMin || a.durationMax) && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.durationMin}–{a.durationMax} min</span>
                        )}
                        {a.createdByUserName && (
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{a.createdByUserName}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {totalActivities > 5 && (
                <Link to="/activities" className="flex items-center justify-center gap-1 pt-1 text-xs text-sky-600 hover:text-sky-800">
                  Zobrazit vše ({totalActivities}) <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role requests widget */}
      {isHeadCoach && roleRequests && roleRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Žádosti o role
          </h2>
          <div className="space-y-2">
            {roleRequests.map((req) => (
              <Card key={req.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{req.memberName}</p>
                    <p className="text-sm text-gray-500">
                      {req.memberEmail} &middot; {req.clubName} &middot; Žádá o: <span className="font-medium">{roleLabels[req.requestedRole] ?? req.requestedRole}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(req.id)}
                      disabled={approveMutation.isPending}
                    >
                      <UserCheck className="h-4 w-4" />Schválit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(req.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <UserX className="h-4 w-4" />Zamítnout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AppointmentFormModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        appointment={null}
        defaultDate={null}
      />
      <AppointmentDetailModal
        appointmentId={detailAppointmentId}
        onClose={() => setDetailAppointmentId(null)}
      />
      <ExportWorkTimeModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}

function AppointmentCard({ apt, onClick }: { apt: AppointmentDto; onClick: () => void }) {
  const start = parseISO(apt.start)
  const end = parseISO(apt.end)
  const isPast = isAfter(new Date(), end)
  const hasRepeating = apt.repeatingPattern && apt.repeatingPattern.repeatingFrequency > 0
  const isTraining = apt.appointmentType === 0 && apt.trainingId

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-sky-200 hover:shadow-md ${isPast ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-3">
        <div className="flex h-12 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <span className="text-lg font-bold leading-none">{format(start, 'd')}</span>
          <span className="text-[10px] uppercase leading-none">{format(start, 'MMM yyyy', { locale: cs })}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">
              {apt.name || format(start, 'EEEE d. M. yyyy', { locale: cs })}
            </p>
            <Badge variant={typeBadgeVariant[apt.appointmentType ?? 4]}>
              {typeLabels[apt.appointmentType ?? 4]}
            </Badge>
            {hasRepeating && (
              <span title="Opakující se událost"><Repeat className="h-3 w-3 text-gray-400" /></span>
            )}
            {!apt.teamId && (
              <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1">osobní</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
            </span>
            {isTraining && (
              <Link
                to={`/trainings/${apt.trainingId}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 hover:underline"
              >
                <Dumbbell className="h-3 w-3" />
                {apt.trainingName || `Trénink #${apt.trainingId}`}
              </Link>
            )}
            {!isTraining && apt.trainingName && (
              <span className="text-xs text-sky-600">
                {apt.trainingName}
              </span>
            )}
            {apt.ownerUserName && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <User className="h-3 w-3" />
                {apt.ownerUserName}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
