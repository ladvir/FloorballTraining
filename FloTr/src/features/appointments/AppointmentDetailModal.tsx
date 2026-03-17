import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { Clock, MapPin, Repeat, Calendar, Dumbbell, Edit, User, Eye, Trash2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { appointmentsApi } from '../../api/index'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import { AppointmentFormModal } from './AppointmentFormModal'

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

// ── Training Detail Modal (readonly) ──────────────────────────────────────────

function TrainingDetailModal({ trainingId, onClose }: { trainingId: number | null; onClose: () => void }) {
  const { data: training, isLoading } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => trainingsApi.getById(trainingId!),
    enabled: trainingId != null,
  })

  if (!trainingId) return null
  if (isLoading) return <Modal isOpen={true} onClose={onClose} title="Načítání…" maxWidth="lg"><LoadingSpinner /></Modal>
  if (!training) return null

  const envLabels: Record<number, string> = { 0: 'Kdekoliv', 1: 'Hala', 2: 'Venku' }
  const goals = [training.trainingGoal1, training.trainingGoal2, training.trainingGoal3].filter(Boolean)
  const parts = training.trainingParts ?? []

  return (
    <Modal isOpen={true} onClose={onClose} title={training.name} maxWidth="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`} />
          <span className="text-sm text-gray-600">{training.isDraft ? 'Rozpracovaný' : 'Kompletní'}</span>
          {training.createdByUserName && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3 w-3" />{training.createdByUserName}
            </span>
          )}
        </div>

        {training.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Popis</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {training.duration > 0 && <div><p className="text-xs text-gray-400">Trvání</p><p className="text-sm font-medium">{training.duration} min</p></div>}
          {training.personsMin != null && training.personsMin > 0 && <div><p className="text-xs text-gray-400">Hráči</p><p className="text-sm font-medium">{training.personsMin}{training.personsMax ? `–${training.personsMax}` : '+'}</p></div>}
          {training.environment != null && <div><p className="text-xs text-gray-400">Prostředí</p><p className="text-sm font-medium">{envLabels[training.environment] ?? training.environment}</p></div>}
        </div>

        {goals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Cíle tréninku</h4>
            <div className="flex flex-wrap gap-1">
              {goals.map((g) => <Badge key={g!.id} variant="info">{g!.name}</Badge>)}
            </div>
          </div>
        )}

        {parts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Části tréninku</h4>
            <div className="space-y-2">
              {parts.map((part, idx) => (
                <div key={part.id || idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{part.name || `Část ${idx + 1}`}</span>
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
        <Button size="sm" variant="outline" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
  )
}

// ── Training Box ──────────────────────────────────────────────────────────────

function TrainingBox({ trainingId, trainingName, trainingTargets }: {
  trainingId: number
  trainingName?: string
  trainingTargets?: string
}) {
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
            <span className="text-sm font-medium text-sky-800">Trénink</span>
          </div>
          <div className="flex items-center gap-2">
            {canEditTraining ? (
              <Link
                to={`/trainings/${trainingId}/edit`}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                <Edit className="h-3 w-3" />
                Upravit
              </Link>
            ) : (
              <button
                onClick={() => setDetailOpen(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                <Eye className="h-3 w-3" />
                Detail
              </button>
            )}
          </div>
        </div>
        <p className="text-sky-700 font-medium">{trainingName || `Trénink #${trainingId}`}</p>
        {trainingTargets && <p className="mt-1 text-sm text-sky-600">{trainingTargets}</p>}
        {training?.createdByUserName && (
          <p className="mt-1 flex items-center gap-1 text-xs text-sky-500">
            <User className="h-3 w-3" />{training.createdByUserName}
          </p>
        )}
      </div>
      <TrainingDetailModal trainingId={detailOpen ? trainingId : null} onClose={() => setDetailOpen(false)} />
    </>
  )
}

// ── Appointment Detail Modal ─────────────────────────────────────────────────

export function AppointmentDetailModal({ appointmentId, onClose }: { appointmentId: number | null; onClose: () => void }) {
  const { isAdmin, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'none' | 'confirm-chain'>('none')

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.getById(appointmentId!),
    enabled: appointmentId != null,
  })

  const deleteMutation = useMutation({
    mutationFn: (alsoFuture: boolean) => appointmentsApi.delete(appointmentId!, alsoFuture),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  if (!appointmentId) return null
  if (isLoading) return <Modal isOpen={true} onClose={onClose} title="Načítání…" maxWidth="lg"><LoadingSpinner /></Modal>
  if (!apt) return null

  const start = parseISO(apt.start)
  const end = parseISO(apt.end)
  const hasRepeating = apt.repeatingPattern && apt.repeatingPattern.repeatingFrequency > 0
  const isRecurring = !!(apt.parentAppointment || apt.repeatingPattern?.repeatingFrequency)
  const isTraining = apt.appointmentType === 0
  const canEdit = isAdmin || (user && apt.ownerUserId === user.id)

  const handleDelete = () => {
    if (isRecurring) {
      setDeleteStep('confirm-chain')
    } else {
      if (confirm('Opravdu smazat tuto událost?')) deleteMutation.mutate(false)
    }
  }

  const title = apt.name || format(start, 'EEEE d. MMMM yyyy', { locale: cs })

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={title} maxWidth="lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={typeBadgeVariant[apt.appointmentType ?? 4]}>
              {typeLabels[apt.appointmentType ?? 4]}
            </Badge>
            {hasRepeating && (
              <span title="Opakující se událost"><Repeat className="h-4 w-4 text-gray-400" /></span>
            )}
            {!apt.teamId && (
              <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">osobní</span>
            )}
            {canEdit && (
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4" />Upravit
                </Button>
                <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />Smazat
                </Button>
              </div>
            )}
          </div>

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

          {apt.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Popis</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{apt.description}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Zavřít</Button>
        </div>
      </Modal>

      <AppointmentFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        appointment={apt}
        defaultDate={null}
      />

      {deleteStep === 'confirm-chain' && (
        <Modal isOpen={true} onClose={() => setDeleteStep('none')} title="Smazání opakující se události" maxWidth="sm">
          <p className="text-sm text-gray-600 mb-4">Tato událost se opakuje. Co chcete smazat?</p>
          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate(false)}
              loading={deleteMutation.isPending}
            >
              Pouze tuto událost
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate(true)}
              loading={deleteMutation.isPending}
            >
              Tuto a všechny budoucí
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteStep('none')}>
              Zrušit
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
