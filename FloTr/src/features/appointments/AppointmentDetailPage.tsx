import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ArrowLeft, Clock, MapPin, Repeat, Calendar, Dumbbell, Edit } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { appointmentsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

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

const frequencyLabels: Record<number, string> = {
  1: 'Denně',
  2: 'Týdně',
  3: 'Měsíčně',
  4: 'Ročně',
}

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()

  const { data: apt, isLoading, isError } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.getById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) return <LoadingSpinner />

  if (isError || !apt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Událost nebyla nalezena.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />Zpět
        </Button>
      </div>
    )
  }

  const start = parseISO(apt.start)
  const end = parseISO(apt.end)
  const hasRepeating = apt.repeatingPattern && apt.repeatingPattern.repeatingFrequency > 0
  const isTraining = apt.appointmentType === 0

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {apt.name || format(start, 'EEEE d. MMMM yyyy', { locale: cs })}
                </h1>
                <Badge variant={typeBadgeVariant[apt.appointmentType ?? 4]}>
                  {typeLabels[apt.appointmentType ?? 4]}
                </Badge>
                {hasRepeating && (
                  <Repeat className="h-4 w-4 text-gray-400" title="Opakující se událost" />
                )}
                {!apt.teamId && (
                  <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">osobní</span>
                )}
              </div>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>
                <Edit className="h-4 w-4" />Upravit
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{format(start, 'EEEE d. MMMM yyyy', { locale: cs })}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{format(start, 'HH:mm')} – {format(end, 'HH:mm')}</span>
            </div>

            {apt.locationName && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{apt.locationName}</span>
              </div>
            )}

            {hasRepeating && apt.repeatingPattern && (
              <div className="flex items-center gap-2 text-gray-700">
                <Repeat className="h-4 w-4 text-gray-400" />
                <span>
                  {frequencyLabels[apt.repeatingPattern.repeatingFrequency] ?? 'Opakování'}
                  {apt.repeatingPattern.interval > 1 && ` (každý ${apt.repeatingPattern.interval}.)`}
                  {apt.repeatingPattern.endDate && (
                    <span className="text-gray-500"> do {format(parseISO(apt.repeatingPattern.endDate), 'd. M. yyyy')}</span>
                  )}
                </span>
              </div>
            )}

            {isTraining && apt.trainingId && (
              <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="h-4 w-4 text-sky-600" />
                  <span className="text-sm font-medium text-sky-800">Trénink</span>
                </div>
                <Link
                  to={`/trainings/${apt.trainingId}/edit`}
                  className="text-sky-700 hover:text-sky-900 font-medium hover:underline"
                >
                  {apt.trainingName || `Trénink #${apt.trainingId}`}
                </Link>
                {apt.trainingTargets && (
                  <p className="mt-1 text-sm text-sky-600">{apt.trainingTargets}</p>
                )}
              </div>
            )}

            {apt.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Popis</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{apt.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
