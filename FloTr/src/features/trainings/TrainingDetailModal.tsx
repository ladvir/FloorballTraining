import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { User, Dumbbell, Target, Copy } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { trainingsApi } from '../../api/trainings.api'
import type { TrainingDto } from '../../types/domain.types'

interface Props {
  trainingId: number | null
  onClose: () => void
  onCopy?: (training: TrainingDto) => void
  copying?: boolean
}

export function TrainingDetailModal({ trainingId, onClose, onCopy, copying }: Props) {
  const { t } = useTranslation()
  const { data: training, isLoading } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => trainingsApi.getById(trainingId!),
    enabled: trainingId != null,
  })

  if (!trainingId) return null

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title={t('common.loading')} maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  }

  if (!training) return null

  const envLabels: Record<number, string> = {
    0: t('trainings.formEnvAny'),
    1: t('trainings.formEnvIndoor'),
    2: t('trainings.formEnvOutdoor'),
  }
  const difficultyLabels = ['', 'Začátečník', 'Mírně pokročilý', 'Pokročilý', 'Expert']
  const intensityLabels = ['', 'Nízká', 'Střední', 'Vysoká', 'Maximální']

  const goals = [training.trainingGoal1, training.trainingGoal2, training.trainingGoal3].filter(
    Boolean
  )
  const ageGroups =
    training.trainingAgeGroups?.map((ag) => ag.name ?? ag.description).filter(Boolean) ?? []
  const parts = training.trainingParts ?? []

  return (
    <Modal isOpen={true} onClose={onClose} title={training.name} maxWidth="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`}
          />
          <span className="text-sm text-gray-600">
            {training.isDraft ? t('trainings.statusDraft') : t('trainings.statusComplete')}
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
              {t('trainings.formDescription')}
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {training.duration > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('trainings.detailDuration')}</p>
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
          {training.goaliesMin != null && training.goaliesMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('trainings.detailGoalies')}</p>
              <p className="text-sm font-medium">
                {training.goaliesMin}
                {training.goaliesMax ? `–${training.goaliesMax}` : '+'}
              </p>
            </div>
          )}
          {training.difficulty != null && training.difficulty > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('trainings.detailDifficulty')}</p>
              <p className="text-sm font-medium">
                {difficultyLabels[training.difficulty] || training.difficulty}
              </p>
            </div>
          )}
          {training.intensity != null && training.intensity > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('trainings.detailIntensity')}</p>
              <p className="text-sm font-medium">
                {intensityLabels[training.intensity] || training.intensity}
              </p>
            </div>
          )}
          {training.environment != null && (
            <div>
              <p className="text-xs text-gray-400">{t('trainings.formEnvironment')}</p>
              <p className="text-sm font-medium">
                {envLabels[training.environment] ?? training.environment}
              </p>
            </div>
          )}
        </div>

        {goals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('trainings.detailGoals')}
            </h4>
            <div className="flex flex-wrap gap-1">
              {goals.map((g) => (
                <span
                  key={g!.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700"
                >
                  <Target className="h-3 w-3" />
                  {g!.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {ageGroups.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('trainings.detailAgeGroups')}
            </h4>
            <div className="flex flex-wrap gap-1">
              {ageGroups.map((name, i) => (
                <Badge key={i} variant="default">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {training.commentBefore && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('trainings.detailCommentBefore')}
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.commentBefore}</p>
          </div>
        )}
        {training.commentAfter && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('trainings.detailCommentAfter')}
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.commentAfter}</p>
          </div>
        )}

        {parts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {t('trainings.formParts')}
            </h4>
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
                          {group.personsMin != null && group.personsMin > 0 && (
                            <span className="text-gray-400">
                              ({group.personsMin}
                              {group.personsMax ? `–${group.personsMax}` : '+'} hráčů)
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

        {training.validationErrors && training.validationErrors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
              {t('trainings.validationTitle')}
            </h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {training.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {onCopy && (
          <Button
            size="sm"
            variant="outline"
            loading={copying}
            onClick={() => onCopy(training)}
            title={t('trainings.formCopy')}
          >
            <Copy className="h-3.5 w-3.5" />
            {t('trainings.formCopy')}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  )
}
