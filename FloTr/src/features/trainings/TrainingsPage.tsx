import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, Users, Pencil, CalendarPlus, FileDown, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { ScheduleTrainingModal } from './ScheduleTrainingModal'
import { trainingsApi } from '../../api/trainings.api'
import { useAuthStore } from '../../store/authStore'
import type { TrainingDto } from '../../types/domain.types'

// ── Main page ─────────────────────────────────────────────────────────────────

export function TrainingsPage() {
  const { isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [scheduleTarget, setScheduleTarget] = useState<TrainingDto | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [validateAllResult, setValidateAllResult] = useState<{ total: number; validCount: number; draftCount: number } | null>(null)

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

  const handleDownloadPdf = useCallback(async (training: TrainingDto) => {
    setDownloadingId(training.id)
    try {
      await trainingsApi.downloadPdf(training.id, training.name)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Tréninky"
        description="Plány tréninků a jejich části"
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                loading={validateAllMutation.isPending}
                onClick={() => validateAllMutation.mutate()}
              >
                <RefreshCw className="h-4 w-4" />
                Zkontrolovat vše
              </Button>
              <Button size="sm" onClick={() => navigate('/trainings/new')}>
                <Plus className="h-4 w-4" />
                Nový trénink
              </Button>
            </div>
          ) : undefined
        }
      />

      {!trainings?.length ? (
        <EmptyState
          title="Žádné tréninky"
          description="Zatím nebyl vytvořen žádný trénink."
          action={
            isAdmin ? (
              <Button size="sm" onClick={() => navigate('/trainings/new')}>
                <Plus className="h-4 w-4" />
                Vytvořit první trénink
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((training) => (
            <Card key={training.id} className="hover:shadow-md transition-shadow">
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
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/trainings/${training.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Upravit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setScheduleTarget(training)}>
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Naplánovat
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={downloadingId === training.id}
                    onClick={() => handleDownloadPdf(training)}
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

    </div>
  )
}
