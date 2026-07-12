import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Clock,
  MapPin,
  Repeat,
  Calendar,
  Dumbbell,
  Edit,
  User,
  Eye,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { appointmentsApi } from '../../api/index'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import { AppointmentFormModal } from './AppointmentFormModal'
import { useCanEditAppointment } from './useCanEditAppointment'
import { StatTrackerLauncher } from '../stats/StatTrackerLauncher'
import { RsvpWidget } from './RsvpWidget'

const typeBadgeVariant: Record<
  number,
  'info' | 'success' | 'warning' | 'danger' | 'default' | 'violet'
> = {
  0: 'info',
  1: 'success',
  2: 'warning',
  3: 'danger',
  4: 'default',
  5: 'info',
  6: 'success',
  7: 'default',
  8: 'violet',
}

// ── Training Detail Modal (readonly) ──────────────────────────────────────────

function TrainingDetailModal({
  trainingId,
  onClose,
}: {
  trainingId: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: training, isLoading } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => trainingsApi.getById(trainingId!),
    enabled: trainingId != null,
  })

  if (!trainingId) return null
  if (isLoading)
    return (
      <Modal isOpen={true} onClose={onClose} title={t('appointments.loadingEvent')} maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  if (!training) return null

  const envLabels: Record<number, string> = {
    0: t('appointments.env.anywhere'),
    1: t('appointments.env.indoor'),
    2: t('appointments.env.outdoor'),
  }
  const goals = [training.trainingGoal1, training.trainingGoal2, training.trainingGoal3].filter(
    Boolean
  )
  const parts = training.trainingParts ?? []

  return (
    <Modal isOpen={true} onClose={onClose} title={training.name} maxWidth="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`}
          />
          <span className="text-sm text-gray-600">
            {training.isDraft
              ? t('appointments.trainingStatus.draft')
              : t('appointments.trainingStatus.complete')}
          </span>
          {training.createdByUserName && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3 w-3" />
              {training.createdByUserName}
            </span>
          )}
        </div>

        {training.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('appointments.trainingDesc')}
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {training.duration > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('common.duration')}</p>
              <p className="text-sm font-medium">{training.duration} min</p>
            </div>
          )}
          {training.personsMin != null && training.personsMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('trainings.colPlayers')}</p>
              <p className="text-sm font-medium">
                {training.personsMin}
                {training.personsMax ? `–${training.personsMax}` : '+'}
              </p>
            </div>
          )}
          {training.environment != null && (
            <div>
              <p className="text-xs text-gray-400">{t('activities.formEnvironment')}</p>
              <p className="text-sm font-medium">
                {envLabels[training.environment] ?? training.environment}
              </p>
            </div>
          )}
        </div>

        {goals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('appointments.trainingGoals')}
            </h4>
            <div className="flex flex-wrap gap-1">
              {goals.map((g) => (
                <Badge key={g!.id} variant="info">
                  {g!.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {parts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {t('appointments.trainingParts')}
            </h4>
            <div className="space-y-2">
              {parts.map((part, idx) => (
                <div key={part.id || idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {part.name || `${t('appointments.trainingParts')} ${idx + 1}`}
                    </span>
                    <span className="text-xs text-gray-400">{part.duration} min</span>
                  </div>
                  {part.trainingGroups && part.trainingGroups.length > 0 && (
                    <div className="space-y-1">
                      {part.trainingGroups.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-2 text-xs text-gray-600">
                          <Dumbbell className="h-3 w-3 text-gray-400" />
                          <span>{group.activity?.name || '(bez aktivity)'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  )
}

// ── Training Box ──────────────────────────────────────────────────────────────

function TrainingBox({
  trainingId,
  trainingName,
  trainingTargets,
}: {
  trainingId: number
  trainingName?: string
  trainingTargets?: string
}) {
  const { t } = useTranslation()
  const { isAdmin, user } = useAuthStore()
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: training } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => trainingsApi.getById(trainingId),
  })

  const canEditTraining = isAdmin || (user && training?.createdByUserId === user.id)

  return (
    <>
      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-sky-600" />
            <span className="text-sm font-medium text-sky-800">
              {t('appointments.trainingLabel')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDetailOpen(true)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              <Eye className="h-3 w-3" />
              {t('appointments.trainingDetailView')}
            </button>
            {canEditTraining && (
              <Link
                to={`/trainings/${trainingId}/edit`}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                <Edit className="h-3 w-3" />
                {t('appointments.trainingDetailEdit')}
              </Link>
            )}
          </div>
        </div>
        <p className="text-sky-700 font-medium">
          {trainingName || `${t('appointments.trainingLabel')} #${trainingId}`}
        </p>
        {trainingTargets && <p className="mt-1 text-sm text-sky-600">{trainingTargets}</p>}
        {training?.createdByUserName && (
          <p className="mt-1 flex items-center gap-1 text-xs text-sky-500">
            <User className="h-3 w-3" />
            {training.createdByUserName}
          </p>
        )}
      </div>
      <TrainingDetailModal
        trainingId={detailOpen ? trainingId : null}
        onClose={() => setDetailOpen(false)}
      />
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AppointmentDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)

  const {
    data: apt,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.getById(Number(id)),
    enabled: !!id,
  })
  const canEdit = useCanEditAppointment(apt)

  if (isLoading) return <LoadingSpinner />

  if (isError || !apt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('appointments.noEvents')}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>
    )
  }

  const typeLabels: Record<number, string> = {
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

  const frequencyLabels: Record<number, string> = {
    1: t('appointments.freqDaily'),
    2: t('appointments.freqWeekly'),
    3: t('appointments.freqMonthly'),
    4: t('appointments.freqYearly'),
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
          {t('common.back')}
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {apt.name || format(start, 'EEEE d. MMMM yyyy', { locale: dfLocale() })}
                </h1>
                <Badge variant={typeBadgeVariant[apt.appointmentType ?? 4]}>
                  {typeLabels[apt.appointmentType ?? 4]}
                </Badge>
                {hasRepeating && (
                  <span title={t('appointments.recurring')}>
                    <Repeat className="h-4 w-4 text-gray-400" />
                  </span>
                )}
                {!apt.teamId && (
                  <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                    {t('appointments.personal')}
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4" />
                {t('common.edit')}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{format(start, 'EEEE d. MMMM yyyy', { locale: dfLocale() })}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
              </span>
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
                  {frequencyLabels[apt.repeatingPattern.repeatingFrequency] ??
                    t('appointments.recurringOccurrence')}
                  {apt.repeatingPattern.interval > 1 &&
                    ` (${t('appointments.repeatInterval', { unit: '' }).replace(' {{unit}}', '')} ${apt.repeatingPattern.interval}.)`}
                  {apt.repeatingPattern.endDate && (
                    <span className="text-gray-500">
                      {' '}
                      do {format(parseISO(apt.repeatingPattern.endDate), 'd. M. yyyy')}
                    </span>
                  )}
                </span>
              </div>
            )}

            {apt.ownerUserName && (
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-gray-400" />
                <span>{apt.ownerUserName}</span>
              </div>
            )}

            {isTraining && apt.trainingId && (
              <TrainingBox
                trainingId={apt.trainingId}
                trainingName={apt.trainingName}
                trainingTargets={apt.trainingTargets}
              />
            )}

            {apt.appointmentType === 8 && apt.tests && apt.tests.length > 0 && (
              <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium text-violet-800">
                    {t('appointments.testsCount', { count: apt.tests.length })}
                  </span>
                </div>
                <ul className="space-y-1">
                  {apt.tests.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-violet-800">{t.name}</span>
                      <Link
                        to={`/testing/${t.id}/record${apt.teamId ? `?teamId=${apt.teamId}` : ''}`}
                        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        <ClipboardList className="h-3 w-3" />
                        {t('appointments.enterResults')}
                      </Link>
                    </li>
                  ))}
                </ul>
                {apt.tests.length > 1 && apt.teamId && (
                  <Link
                    to={`/testing/record-grid?teamId=${apt.teamId}&testIds=${apt.tests.map((t) => t.id).join(',')}`}
                    className="mt-3 inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                  >
                    <ClipboardList className="h-3 w-3" />
                    {t('appointments.enterAllResults')}
                  </Link>
                )}
              </div>
            )}

            {apt.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t('common.description')}
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{apt.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {apt.teamId && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <RsvpWidget appointmentId={apt.id} />
          </CardContent>
        </Card>
      )}

      {apt.teamId && (apt.appointmentType === 0 || apt.appointmentType === 3) && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              {t('appointments.statistics')}
            </h3>
            <StatTrackerLauncher
              eventCategory={apt.appointmentType === 0 ? 1 : 0}
              appointmentId={apt.id}
              teamId={apt.teamId}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      )}

      <AppointmentFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        appointment={apt}
        defaultDate={null}
      />
    </div>
  )
}
