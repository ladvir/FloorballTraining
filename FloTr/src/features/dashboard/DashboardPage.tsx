import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isAfter } from 'date-fns'
import { cs } from 'date-fns/locale'
import { useNavigate, Link } from 'react-router-dom'
import { ClipboardList, CheckCircle, AlertCircle, Clock, MapPin, Repeat, FileSpreadsheet, Dumbbell, Plus, CalendarPlus, Layers } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { dashboardApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { ExportWorkTimeModal } from '../appointments/ExportWorkTimeModal'
import { AppointmentFormModal } from '../appointments/AppointmentFormModal'
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

export function DashboardPage() {
  const { user, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const [exportOpen, setExportOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

  if (isLoading) return <LoadingSpinner />

  const greeting = user?.firstName ? `Dobrý den, ${user.firstName}!` : 'Dobrý den!'
  const appointments = data?.appointments ?? []

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{greeting}</h1>
          <p className="mt-1 text-sm text-gray-500">Přehled systému FloTr</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button size="sm" onClick={() => setAppointmentModalOpen(true)}>
                <CalendarPlus className="h-4 w-4" />Událost
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/trainings/new')}>
                <Plus className="h-4 w-4" />Trénink
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/activities/new')}>
                <Layers className="h-4 w-4" />Aktivita
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <FileSpreadsheet className="h-4 w-4" />Výkaz práce
          </Button>
        </div>
      </div>

      {data && (data.totalTrainings > 0 || data.draftTrainings > 0 || data.completeTrainings > 0) && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Tréninky
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.totalTrainings}</p>
                  <p className="text-xs text-gray-500">Celkem</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{data.completeTrainings}</p>
                  <p className="text-xs text-gray-500">Kompletní</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{data.draftTrainings}</p>
                  <p className="text-xs text-gray-500">Rozpracované</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Nadcházející události
        </h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">Žádné nadcházející události.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} />
            ))}
          </div>
        )}
      </div>

      <AppointmentFormModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        appointment={null}
        defaultDate={null}
      />
      <ExportWorkTimeModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}

function AppointmentCard({ apt }: { apt: AppointmentDto }) {
  const navigate = useNavigate()
  const start = parseISO(apt.start)
  const end = parseISO(apt.end)
  const isPast = isAfter(new Date(), end)
  const hasRepeating = apt.repeatingPattern && apt.repeatingPattern.repeatingFrequency > 0
  const isTraining = apt.appointmentType === 0 && apt.trainingId

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-sky-200 hover:shadow-md ${isPast ? 'opacity-60' : ''}`}
      onClick={() => navigate(`/appointments/${apt.id}`)}
    >
      <CardContent className="flex items-center gap-4 py-3">
        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <span className="text-lg font-bold leading-none">{format(start, 'd')}</span>
          <span className="text-[10px] uppercase leading-none">{format(start, 'MMM', { locale: cs })}</span>
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
              <Repeat className="h-3 w-3 text-gray-400" title="Opakující se událost" />
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
            {apt.locationName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {apt.locationName}
              </span>
            )}
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
