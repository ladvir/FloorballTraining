import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { User, Dumbbell, Copy, FileDown, PlayCircle } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { VideosSection } from '../../components/shared/VideosSection'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { trainingsApi } from '../../api/trainings.api'
import { useLiveTrainingStore } from '../../store/liveTrainingStore'
import { primeAudio } from '../../utils/sound'
import { skillPalette } from '../../utils/skillColors'
import type { TrainingDto } from '../../types/domain.types'

interface Props {
  trainingId: number | null
  onClose: () => void
  onCopy?: (training: TrainingDto) => void
  copying?: boolean
}

export function TrainingDetailModal({ trainingId, onClose, onCopy, copying }: Props) {
  const { t } = useTranslation()
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const startLive = useLiveTrainingStore((s) => s.start)
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

  const supplementaryTags = (training.trainingTags ?? [])
    .map((tt) => tt.tag)
    .filter((tag): tag is NonNullable<typeof tag> => tag != null)
  const ageGroups =
    training.trainingAgeGroups?.map((ag) => ag.name ?? ag.description).filter(Boolean) ?? []
  const parts = training.trainingParts ?? []
  const derivedSkills = Array.from(
    new Map(
      parts
        .flatMap((p) => p.trainingGroups ?? [])
        .flatMap((g) => g.activity?.activitySkills ?? [])
        .filter((s) => s.skillId != null && s.skillName)
        .map((s) => [s.skillId, s] as const)
    ).values()
  )
  const goalSkillIds = new Set(
    [
      training.trainingGoalSkill1?.id,
      training.trainingGoalSkill2?.id,
      training.trainingGoalSkill3?.id,
    ].filter((id): id is number => id != null)
  )
  const goalDerivedSkills = derivedSkills.filter((s) => goalSkillIds.has(s.skillId!))
  const otherDerivedSkills = derivedSkills.filter((s) => !goalSkillIds.has(s.skillId!))

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

        {derivedSkills.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('trainings.detailSkills')}
            </h4>
            <div className="flex flex-wrap items-center gap-1">
              {goalDerivedSkills.map((s) => {
                const palette = skillPalette(s.skillCategoryId ?? 0)
                return (
                  <span
                    key={s.skillId}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: palette.activeBg, borderColor: palette.activeBorder }}
                  >
                    {s.skillName}
                  </span>
                )
              })}
              {goalDerivedSkills.length > 0 && otherDerivedSkills.length > 0 && (
                <span className="w-2.5" />
              )}
              {otherDerivedSkills.map((s) => {
                const palette = skillPalette(s.skillCategoryId ?? 0)
                return (
                  <span
                    key={s.skillId}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: palette.activeBg }}
                  >
                    {s.skillName}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {supplementaryTags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('trainings.formTags')}
            </h4>
            <div className="flex flex-wrap gap-1">
              {supplementaryTags.map((tag) => (
                <Badge key={tag.id} variant="default">
                  {tag.name}
                </Badge>
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <VideosSection ownerKind="trainings" ownerId={training.id} readOnly />

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

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {parts.length > 0 && (
          <Button
            size="sm"
            className="mr-auto"
            onClick={() => {
              primeAudio()
              startLive({ trainingId: training.id, trainingName: training.name })
              onClose()
            }}
          >
            <PlayCircle className="h-3.5 w-3.5" />
            {t('liveTraining.start')}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          loading={downloadingPdf}
          onClick={async () => {
            setDownloadingPdf(true)
            try {
              await trainingsApi.downloadPdf(training.id, training.name, { compact: true })
            } finally {
              setDownloadingPdf(false)
            }
          }}
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </Button>
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
