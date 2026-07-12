import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { Link } from 'react-router-dom'
import {
  Clock,
  MapPin,
  Repeat,
  Calendar,
  Dumbbell,
  Edit,
  User,
  Eye,
  Trash2,
  Star,
  ClipboardList,
  CheckCircle2,
  Circle,
  UserCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { appointmentsApi, ratingsApi, assignmentsApi } from '../../api/index'
import { RsvpWidget } from './RsvpWidget'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import { AppointmentFormModal } from './AppointmentFormModal'
import { AppointmentLineupSection } from './AppointmentLineupSection'
import { useCanEditAppointment } from './useCanEditAppointment'
import { StatTrackerLauncher } from '../stats/StatTrackerLauncher'
import { useConfirm } from '../../store/confirmStore'
import { AttendanceModal } from '../attendance/AttendanceModal'
import { AttendanceSummaryBadge } from '../attendance/AttendanceSummaryBadge'
import type { AppointmentDto } from '../../types/domain.types'

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
      <Modal isOpen={true} onClose={onClose} title={t('appointments.loadingTitle')} maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  if (!training) return null

  const envLabels: Record<number, string> = { 0: 'Kdekoliv', 1: 'Hala', 2: 'Venku' }
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
              ? t('appointments.trainingDraft')
              : t('appointments.trainingComplete')}
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
              <p className="text-xs text-gray-400">{t('appointments.trainingDuration')}</p>
              <p className="text-sm font-medium">{training.duration} min</p>
            </div>
          )}
          {training.personsMin != null && training.personsMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('appointments.trainingPlayers')}</p>
              <p className="text-sm font-medium">
                {training.personsMin}
                {training.personsMax ? `–${training.personsMax}` : '+'}
              </p>
            </div>
          )}
          {training.environment != null && (
            <div>
              <p className="text-xs text-gray-400">{t('appointments.trainingEnvironment')}</p>
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
                      {part.name || t('appointments.trainingPartName', { n: idx + 1 })}
                    </span>
                    <span className="text-xs text-gray-400">{part.duration} min</span>
                  </div>
                  {part.trainingGroups && part.trainingGroups.length > 0 && (
                    <div className="space-y-1">
                      {part.trainingGroups.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-2 text-xs text-gray-600">
                          <Dumbbell className="h-3 w-3 text-gray-400" />
                          <span>
                            {group.activity?.name || t('appointments.trainingNoActivity')}
                          </span>
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
              {t('appointments.trainingBoxTitle')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDetailOpen(true)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              <Eye className="h-3 w-3" />
              {t('appointments.trainingDetail')}
            </button>
            {canEditTraining && (
              <Link
                to={`/trainings/${trainingId}/edit`}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                <Edit className="h-3 w-3" />
                {t('appointments.trainingEdit')}
              </Link>
            )}
          </div>
        </div>
        <p className="text-sky-700 font-medium">
          {trainingName || t('appointments.trainingFallback', { id: trainingId })}
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

// ── Rating Section (only for past events) ───────────────────────────────────

const gradeColors = [
  'bg-green-500', // 1
  'bg-lime-500', // 2
  'bg-yellow-500', // 3
  'bg-orange-500', // 4
  'bg-red-500', // 5
]

function RatingSection({ appointmentId }: { appointmentId: number }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [newGrade, setNewGrade] = useState(1)
  const [newComment, setNewComment] = useState('')
  const [showForm, setShowForm] = useState(false)

  const gradeLabels = [
    t('appointments.gradeExcellent'),
    t('appointments.gradeGood'),
    t('appointments.gradeOk'),
    t('appointments.gradeSufficient'),
    t('appointments.gradeFailed'),
  ]

  const { data: ratings } = useQuery({
    queryKey: ['ratings', 'appointment', appointmentId],
    queryFn: () => ratingsApi.getAll(appointmentId),
  })

  const createMutation = useMutation({
    mutationFn: ratingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
      setShowForm(false)
      setNewGrade(1)
      setNewComment('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ratingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
    },
  })

  const myRating = ratings?.find((r) => r.userId === user?.id)
  const avgGrade =
    ratings && ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.grade, 0) / ratings.length).toFixed(1)
      : null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium text-gray-700">
            {avgGrade
              ? t('appointments.ratingAvg', { avg: avgGrade })
              : t('appointments.ratingTitle')}
          </h3>
          {ratings && ratings.length > 0 && avgGrade && (
            <span className="text-xs text-gray-400">({ratings.length}x)</span>
          )}
        </div>
        {!myRating && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Star className="h-3 w-3" />
            {t('appointments.ratingRate')}
          </Button>
        )}
      </div>

      {/* Add rating form */}
      {showForm && !myRating && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{t('appointments.ratingGrade')}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  onClick={() => setNewGrade(g)}
                  className={`h-8 w-8 rounded-full text-sm font-bold text-white ${gradeColors[g - 1]} ${newGrade === g ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-40 hover:opacity-70'}`}
                  title={gradeLabels[g - 1]}
                >
                  {g}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500">{gradeLabels[newGrade - 1]}</span>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('appointments.ratingComment')}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  appointmentId,
                  grade: newGrade,
                  comment: newComment || undefined,
                })
              }
            >
              {t('appointments.ratingSave')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-500">
              {(createMutation.error as { response?: { data?: { message?: string } } })?.response
                ?.data?.message || t('appointments.ratingError')}
            </p>
          )}
        </div>
      )}

      {/* Existing ratings */}
      {ratings && ratings.length > 0 ? (
        <div className="space-y-2">
          {ratings.map((r) => (
            <div key={r.id} className="flex items-start gap-2 rounded-lg bg-gray-50 p-2">
              <span
                className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${gradeColors[r.grade - 1]}`}
              >
                {r.grade}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-gray-700">
                    {r.userName || t('appointments.raterUnknown')}
                  </span>
                  <Badge variant={r.raterType === 1 ? 'warning' : 'default'} size="sm">
                    {r.raterType === 1
                      ? t('appointments.gradeCoach')
                      : t('appointments.gradePlayer')}
                  </Badge>
                </div>
                {r.comment && <p className="mt-0.5 text-xs text-gray-600">{r.comment}</p>}
              </div>
              {user?.id === r.userId && (
                <button
                  onClick={() => {
                    confirm(t('appointments.ratingDeleteConfirm'), () =>
                      deleteMutation.mutate(r.id)
                    )
                  }}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showForm && <p className="text-xs text-gray-400">{t('appointments.ratingNone')}</p>
      )}
    </div>
  )
}

// ── Assignments Section ───────────────────────────────────────────────────────

function AssignmentsSection({ apt, canEdit }: { apt: AppointmentDto; canEdit: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const assignments = apt.memberAssignments ?? []

  const completeMutation = useMutation({
    mutationFn: (isCompleted: boolean) => assignmentsApi.markComplete(apt.id, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', apt.id] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  if (!apt.isAssignedToMe && (!canEdit || assignments.length === 0)) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <UserCheck className="h-4 w-4 text-sky-500" />
        <h3 className="text-sm font-medium text-gray-700">{t('appointments.assignmentSection')}</h3>
      </div>

      {apt.isAssignedToMe && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
          <span className="text-sm text-sky-800">{t('appointments.assignmentAssignedToMe')}</span>
          <button
            onClick={() => completeMutation.mutate(!apt.myAssignmentCompleted)}
            disabled={completeMutation.isPending}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              apt.myAssignmentCompleted
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {apt.myAssignmentCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t('appointments.assignmentCompleted')}
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" />
                {t('appointments.assignmentNotCompleted')}
              </>
            )}
          </button>
        </div>
      )}

      {canEdit && assignments.length > 0 && (
        <div className="space-y-1">
          {assignments
            .slice()
            .sort((a, b) => (a.memberLastName ?? '').localeCompare(b.memberLastName ?? '', 'cs'))
            .map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50"
              >
                <span className="text-sm text-gray-800">
                  {a.memberLastName} {a.memberFirstName}
                </span>
                {a.isCompleted ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('appointments.assignmentCompleted')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Circle className="h-3.5 w-3.5" />
                    {t('appointments.assignmentNotCompleted')}
                  </span>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ── Appointment Detail Modal ─────────────────────────────────────────────────

export function AppointmentDetailModal({
  appointmentId,
  onClose,
}: {
  appointmentId: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'none' | 'confirm-chain'>('none')
  const [attendanceOpen, setAttendanceOpen] = useState(false)

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

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.getById(appointmentId!),
    enabled: appointmentId != null,
  })
  const canEdit = useCanEditAppointment(apt)

  const deleteMutation = useMutation({
    mutationFn: (alsoFuture: boolean) => appointmentsApi.delete(appointmentId!, alsoFuture),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  if (!appointmentId) return null
  if (isLoading)
    return (
      <Modal isOpen={true} onClose={onClose} title={t('appointments.loadingTitle')} maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  if (!apt) return null

  const start = parseISO(apt.start)
  const end = parseISO(apt.end)
  const hasRepeating = apt.repeatingPattern && apt.repeatingPattern.repeatingFrequency > 0
  const isRecurring = !!(apt.parentAppointment || apt.repeatingPattern?.repeatingFrequency)
  const isTraining = apt.appointmentType === 0

  const handleDelete = () => {
    if (isRecurring) {
      setDeleteStep('confirm-chain')
    } else {
      confirm(t('appointments.deleteEventConfirm'), () => deleteMutation.mutate(false))
    }
  }

  const title = apt.name || format(start, 'EEEE d. MMMM yyyy', { locale: dfLocale() })

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={title} maxWidth="lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={typeBadgeVariant[apt.appointmentType ?? 4]}>
              {typeLabels[apt.appointmentType ?? 4]}
            </Badge>
            {hasRepeating && (
              <span title={t('appointments.recurringLabel')}>
                <Repeat className="h-4 w-4 text-gray-400" />
              </span>
            )}
            {!apt.teamId && (
              <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                {t('appointments.personal')}
              </span>
            )}
            {canEdit && (
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4" />
                  {t('appointments.trainingEdit')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </Button>
              </div>
            )}
          </div>

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
                  t('appointments.recurring')}
                {apt.repeatingPattern.interval > 1 &&
                  ` ${t('appointments.recurringIntervalLabel', { n: apt.repeatingPattern.interval })}`}
                {apt.repeatingPattern.endDate && (
                  <span className="text-gray-500">
                    {' '}
                    {t('appointments.recurringUntilLabel')}{' '}
                    {format(parseISO(apt.repeatingPattern.endDate), 'd. M. yyyy')}
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
                  {t('appointments.testsTitle', { count: apt.tests.length })}
                </span>
              </div>
              <ul className="space-y-1">
                {apt.tests.map((tst) => (
                  <li key={tst.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-violet-800">{tst.name}</span>
                    <Link
                      to={`/testing/${tst.id}/record${apt.teamId ? `?teamId=${apt.teamId}` : ''}`}
                      onClick={onClose}
                      className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                    >
                      <ClipboardList className="h-3 w-3" />
                      {t('appointments.testsEnterResults')}
                    </Link>
                  </li>
                ))}
              </ul>
              {apt.tests.length > 1 && apt.teamId && (
                <Link
                  to={`/testing/record-grid?teamId=${apt.teamId}&testIds=${apt.tests.map((tst) => tst.id).join(',')}`}
                  onClick={onClose}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                >
                  <ClipboardList className="h-3 w-3" />
                  {t('appointments.testsEnterAll')}
                </Link>
              )}
            </div>
          )}

          {apt.teamId && (apt.appointmentType === 3 || apt.appointmentType === 0) && (
            <AppointmentLineupSection appointmentId={apt.id} teamId={apt.teamId} />
          )}

          {apt.teamId && (apt.appointmentType === 3 || apt.appointmentType === 0) && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
              <p className="mb-2 text-sm font-medium text-emerald-800">
                {t('appointments.statsTitle')}
              </p>
              <StatTrackerLauncher
                eventCategory={apt.appointmentType === 0 ? 1 : 0}
                appointmentId={apt.id}
                teamId={apt.teamId}
                canEdit={canEdit}
              />
            </div>
          )}

          {apt.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {t('appointments.description')}
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{apt.description}</p>
            </div>
          )}

          {/* Attendance — coach only, any team event */}
          {apt.teamId && canEdit && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {t('appointments.attendance')}
                </span>
                <div className="flex items-center gap-2">
                  <AttendanceSummaryBadge appointmentId={apt.id} />
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="record-attendance-btn"
                    onClick={() => setAttendanceOpen(true)}
                  >
                    {t('appointments.attendanceRecord')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Assignments — coach sees full list, member sees own completion toggle */}
          <AssignmentsSection apt={apt} canEdit={canEdit} />

          {/* RSVP — only for future events with a team */}
          {!apt.isPast && apt.teamId && <RsvpWidget appointmentId={apt.id} />}

          {/* Rating section — only for past events */}
          {apt.isPast && <RatingSection appointmentId={apt.id} />}
          {!apt.isPast && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Star className="h-3.5 w-3.5" />
                <span>{t('appointments.ratingAvailable')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            {t('appointments.trainingClose')}
          </Button>
        </div>
      </Modal>

      <AppointmentFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        appointment={apt}
        defaultDate={null}
      />

      {attendanceOpen && apt && (
        <AttendanceModal
          appointmentId={apt.id}
          teamId={apt.teamId}
          isFuture={!apt.isPast}
          onClose={() => setAttendanceOpen(false)}
        />
      )}

      {deleteStep === 'confirm-chain' && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteStep('none')}
          title={t('appointments.deleteChainTitle')}
          maxWidth="sm"
        >
          <p className="text-sm text-gray-600 mb-4">{t('appointments.deleteChainMsg')}</p>
          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate(false)}
              loading={deleteMutation.isPending}
            >
              {t('appointments.deleteChainOnlyThis')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate(true)}
              loading={deleteMutation.isPending}
            >
              {t('appointments.deleteChainThisAndFuture')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteStep('none')}>
              {t('common.cancel')}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
