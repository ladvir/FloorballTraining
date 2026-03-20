import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, Users, Pencil, CalendarPlus, FileDown, RefreshCw, User, Eye, Dumbbell, Target } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { PdfOptionsModal } from '../../components/shared/PdfOptionsModal'
import type { PdfOptions } from '../../components/shared/PdfOptionsModal'
import { ScheduleTrainingModal } from './ScheduleTrainingModal'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import type { TrainingDto } from '../../types/domain.types'

// ── Detail Modal ──────────────────────────────────────────────────────────────

function TrainingDetailModal({ trainingId, onClose }: { trainingId: number | null; onClose: () => void }) {
  const { data: training, isLoading } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => trainingsApi.getById(trainingId!),
    enabled: trainingId != null,
  })

  if (!trainingId) return null

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Načítání…" maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  }

  if (!training) return null

  const envLabels: Record<number, string> = { 0: 'Kdekoliv', 1: 'Hala', 2: 'Venku' }
  const difficultyLabels = ['', 'Začátečník', 'Mírně pokročilý', 'Pokročilý', 'Expert']
  const intensityLabels = ['', 'Nízká', 'Střední', 'Vysoká', 'Maximální']

  const goals = [training.trainingGoal1, training.trainingGoal2, training.trainingGoal3].filter(Boolean)
  const ageGroups = training.trainingAgeGroups?.map((ag) => ag.name ?? ag.description).filter(Boolean) ?? []
  const parts = training.trainingParts ?? []

  return (
    <Modal isOpen={true} onClose={onClose} title={training.name} maxWidth="lg">
      <div className="space-y-4">
        {/* Status + author */}
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`} />
          <span className="text-sm text-gray-600">{training.isDraft ? 'Rozpracovaný' : 'Kompletní'}</span>
          {training.createdByUserName && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3 w-3" />
              {training.createdByUserName}
            </span>
          )}
        </div>

        {/* Description */}
        {training.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Popis</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.description}</p>
          </div>
        )}

        {/* Properties */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {training.duration > 0 && (
            <div>
              <p className="text-xs text-gray-400">Trvání</p>
              <p className="text-sm font-medium">{training.duration} min</p>
            </div>
          )}
          {training.personsMin != null && training.personsMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">Hráči</p>
              <p className="text-sm font-medium">{training.personsMin}{training.personsMax ? `–${training.personsMax}` : '+'}</p>
            </div>
          )}
          {(training.goaliesMin != null && training.goaliesMin > 0) && (
            <div>
              <p className="text-xs text-gray-400">Brankáři</p>
              <p className="text-sm font-medium">{training.goaliesMin}{training.goaliesMax ? `–${training.goaliesMax}` : '+'}</p>
            </div>
          )}
          {training.difficulty != null && training.difficulty > 0 && (
            <div>
              <p className="text-xs text-gray-400">Obtížnost</p>
              <p className="text-sm font-medium">{difficultyLabels[training.difficulty] || training.difficulty}</p>
            </div>
          )}
          {training.intensity != null && training.intensity > 0 && (
            <div>
              <p className="text-xs text-gray-400">Intenzita</p>
              <p className="text-sm font-medium">{intensityLabels[training.intensity] || training.intensity}</p>
            </div>
          )}
          {training.environment != null && (
            <div>
              <p className="text-xs text-gray-400">Prostředí</p>
              <p className="text-sm font-medium">{envLabels[training.environment] ?? training.environment}</p>
            </div>
          )}
        </div>

        {/* Training goals */}
        {goals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Cíle tréninku</h4>
            <div className="flex flex-wrap gap-1">
              {goals.map((g) => (
                <span key={g!.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700">
                  <Target className="h-3 w-3" />
                  {g!.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Age groups */}
        {ageGroups.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Věkové kategorie</h4>
            <div className="flex flex-wrap gap-1">
              {ageGroups.map((name, i) => (
                <Badge key={i} variant="default">{name}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {training.commentBefore && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Poznámka před tréninkem</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.commentBefore}</p>
          </div>
        )}
        {training.commentAfter && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Poznámka po tréninku</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.commentAfter}</p>
          </div>
        )}

        {/* Training parts */}
        {parts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Části tréninku</h4>
            <div className="space-y-2">
              {parts.map((part, idx) => (
                <div key={part.id || idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {part.name || `Část ${idx + 1}`}
                    </span>
                    <span className="text-xs text-gray-400">{part.duration} min</span>
                  </div>
                  {part.description && (
                    <p className="text-xs text-gray-500 mb-2">{part.description}</p>
                  )}
                  {part.trainingGroups && part.trainingGroups.length > 0 && (
                    <div className="space-y-1">
                      {part.trainingGroups.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-2 text-xs text-gray-600">
                          <Dumbbell className="h-3 w-3 text-gray-400" />
                          <span>{group.activity?.name || '(bez aktivity)'}</span>
                          {(group.personsMin != null && group.personsMin > 0) && (
                            <span className="text-gray-400">
                              ({group.personsMin}{group.personsMax ? `–${group.personsMax}` : '+'} hráčů)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {training.validationErrors && training.validationErrors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">Chyby validace</h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {training.validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function TrainingsPage() {
  const { isAdmin, user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [scheduleTarget, setScheduleTarget] = useState<TrainingDto | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [pdfTarget, setPdfTarget] = useState<TrainingDto | null>(null)
  const [validateAllResult, setValidateAllResult] = useState<{ total: number; validCount: number; draftCount: number } | null>(null)
  const [detailTrainingId, setDetailTrainingId] = useState<number | null>(null)

  const { data: trainings, isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => trainingsApi.getAll(),
  })

  const validateAllMutation = useMutation({
    mutationFn: () => trainingsApi.validateAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setValidateAllResult(data)
    },
  })

  const handleDownloadPdf = useCallback(async (training: TrainingDto, options: PdfOptions) => {
    setDownloadingId(training.id)
    setPdfTarget(null)
    try {
      await trainingsApi.downloadPdf(training.id, training.name, options)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  if (isLoading) return <LoadingSpinner />

  const canEdit = (t: TrainingDto) => isAdmin || (user && t.createdByUserId === user.id)

  return (
    <div>
      <PageHeader
        title="Tréninky"
        description="Plány tréninků a jejich části"
        action={
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                loading={validateAllMutation.isPending}
                onClick={() => validateAllMutation.mutate()}
              >
                <RefreshCw className="h-4 w-4" />
                Zkontrolovat vše
              </Button>
            )}
            <Button size="sm" onClick={() => navigate('/trainings/new')}>
              <Plus className="h-4 w-4" />
              Nový trénink
            </Button>
          </div>
        }
      />

      {!trainings?.length ? (
        <EmptyState
          title="Žádné tréninky"
          description="Zatím nebyl vytvořen žádný trénink."
          action={
            <Button size="sm" onClick={() => navigate('/trainings/new')}>
              <Plus className="h-4 w-4" />
              Vytvořit první trénink
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((training) => (
            <Card
              key={training.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetailTrainingId(training.id)}
            >
              <CardContent className="py-4">
                {/* Status dot + name */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900 truncate">{training.name}</h3>
                  <span
                    title={training.isDraft ? 'Rozpracovaný' : 'Kompletní'}
                    className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`}
                  />
                </div>

                {training.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{training.description}</p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  {training.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {training.duration} min
                    </span>
                  )}
                  {training.personsMin != null && training.personsMin > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {training.personsMin}{training.personsMax ? `–${training.personsMax}` : '+'} hráčů
                    </span>
                  )}
                  {training.createdByUserName && (
                    <span className="flex items-center gap-1 ml-auto">
                      <User className="h-3 w-3" />
                      {training.createdByUserName}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setDetailTrainingId(training.id) }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                  </Button>
                  {canEdit(training) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/trainings/${training.id}/edit`) }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Upravit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setScheduleTarget(training) }}
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Naplánovat
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={downloadingId === training.id}
                    onClick={(e) => { e.stopPropagation(); setPdfTarget(training) }}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TrainingDetailModal trainingId={detailTrainingId} onClose={() => setDetailTrainingId(null)} />

      {validateAllResult && (
        <Modal isOpen={true} onClose={() => setValidateAllResult(null)} title="Výsledek kontroly všech tréninků" maxWidth="sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Celkem tréninků:</span><strong>{validateAllResult.total}</strong></div>
            <div className="flex justify-between"><span className="text-green-600">Kompletní:</span><strong className="text-green-700">{validateAllResult.validCount}</strong></div>
            <div className="flex justify-between"><span className="text-yellow-600">Rozpracované:</span><strong className="text-yellow-700">{validateAllResult.draftCount}</strong></div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => setValidateAllResult(null)}>Zavřít</Button>
          </div>
        </Modal>
      )}

      {scheduleTarget && (
        <ScheduleTrainingModal
          training={scheduleTarget}
          isOpen={true}
          onClose={() => setScheduleTarget(null)}
        />
      )}

      {pdfTarget && (
        <PdfOptionsModal
          isOpen={true}
          onClose={() => setPdfTarget(null)}
          onConfirm={(options) => handleDownloadPdf(pdfTarget, options)}
          loading={downloadingId === pdfTarget.id}
        />
      )}

    </div>
  )
}
