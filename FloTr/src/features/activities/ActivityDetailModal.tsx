/* eslint-disable react-refresh/only-export-components */
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { User, Pencil } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { activitiesApi } from '../../api/activities.api'
import { useAuthStore } from '../../store/authStore'
import type { ActivityMediaDto } from '../../types/domain.types'

function isDrawingImage(img: ActivityMediaDto): boolean {
  if (img.name.endsWith('.svg')) return true
  try {
    // Any JSON object in `data` is drawing state (Konva stage / field), never an image.
    if (img.data?.startsWith('{') && typeof JSON.parse(img.data) === 'object') return true
  } catch {
    /* not JSON */
  }
  return img.data?.startsWith('<?xml') || img.data?.includes('src="flotr"') || false
}

/** Ensure SVG has a viewBox so it scales correctly when displayed as an <img>. */
function ensureSvgViewBox(svg: string): string {
  if (svg.includes('viewBox')) return svg
  const wMatch = svg.match(/\bwidth=["'](\d+)["']/)
  const hMatch = svg.match(/\bheight=["'](\d+)["']/)
  if (wMatch && hMatch) {
    return svg.replace(/<svg\b/, `<svg viewBox="0 0 ${wMatch[1]} ${hMatch[1]}"`)
  }
  return svg
}

/** Transparent 1×1 GIF — safe placeholder that never triggers a network request. */
const BLANK_IMG_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

function svgToDataUri(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ensureSvgViewBox(svg))
}

export function getDisplaySrc(img: ActivityMediaDto): string {
  if (isDrawingImage(img)) {
    // Drawings render from their SVG preview; the JSON `data` is Konva state, not an image.
    const svg = [img.preview, img.data].find((s) => s?.startsWith('<?xml') || s?.startsWith('<svg'))
    if (svg) return svgToDataUri(svg)
    // Preview may already be a data/URL string — use it only if it's not raw JSON.
    if (img.preview && !img.preview.startsWith('{')) return img.preview
    // No renderable image (e.g. legacy drawing with only Konva state) — avoid a bad <img src>.
    return BLANK_IMG_SRC
  }
  return img.data
}

export function ActivityDetailModal({
  activityId,
  onClose,
}: {
  activityId: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAdmin, user } = useAuthStore()

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => activitiesApi.getById(activityId!),
    enabled: activityId != null,
  })

  if (!activityId) return null

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title={t('common.loading')} maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  }

  if (!activity) return null

  const images = activity.activityMedium?.filter((m) => m.mediaType === 0) ?? []
  const tagNames = activity.activityTags?.map((at) => at.tag?.name).filter(Boolean) ?? []
  const ageGroups =
    activity.activityAgeGroups
      ?.map((ag) => ag.ageGroup?.name ?? ag.ageGroup?.description)
      .filter(Boolean) ?? []

  const canEdit = isAdmin || activity.createdByUserId === user?.id

  const envLabels: Record<string, string> = {
    Indoor: t('appointments.env.indoor'),
    Outdoor: t('appointments.env.outdoor'),
    Anywhere: t('appointments.env.anywhere'),
  }

  const difficultyLabels = [
    '',
    t('activities.difficultyBeginner'),
    t('activities.difficultyIntermediate'),
    t('activities.difficultyAdvanced'),
    t('activities.difficultyExpert'),
  ]
  const intensityLabels = [
    '',
    t('activities.intensityLow'),
    t('activities.intensityMedium'),
    t('activities.intensityHigh'),
    t('activities.intensityMax'),
  ]

  return (
    <Modal isOpen={true} onClose={onClose} title={activity.name} maxWidth="lg">
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${activity.isDraft !== false ? 'bg-yellow-400' : 'bg-green-400'}`}
          />
          <span className="text-sm text-gray-600">
            {activity.isDraft !== false ? t('common.draft') : t('common.complete')}
          </span>
          {activity.createdByUserName && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3 w-3" />
              {activity.createdByUserName}
            </span>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('common.description')}
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
          </div>
        )}

        {/* Properties grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(activity.durationMin || activity.durationMax) && (
            <div>
              <p className="text-xs text-gray-400">{t('activities.propDuration')}</p>
              <p className="text-sm font-medium">
                {activity.durationMin}–{activity.durationMax} min
              </p>
            </div>
          )}
          {activity.personsMin != null && activity.personsMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('activities.propPlayers')}</p>
              <p className="text-sm font-medium">
                {activity.personsMin}
                {activity.personsMax ? `–${activity.personsMax}` : '+'}
              </p>
            </div>
          )}
          {activity.difficulty != null && activity.difficulty > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('activities.propDifficulty')}</p>
              <p className="text-sm font-medium">
                {difficultyLabels[activity.difficulty] || activity.difficulty}
              </p>
            </div>
          )}
          {activity.intensity != null && activity.intensity > 0 && (
            <div>
              <p className="text-xs text-gray-400">{t('activities.propIntensity')}</p>
              <p className="text-sm font-medium">
                {intensityLabels[activity.intensity] || activity.intensity}
              </p>
            </div>
          )}
          {activity.environment && (
            <div>
              <p className="text-xs text-gray-400">{t('activities.propEnvironment')}</p>
              <p className="text-sm font-medium">
                {envLabels[activity.environment] || activity.environment}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {tagNames.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('activities.formTags')}
            </h4>
            <div className="flex flex-wrap gap-1">
              {activity.activityTags
                ?.map((at) => at.tag)
                .filter(Boolean)
                .map((tag) => (
                  <span
                    key={tag!.id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag!.color && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag!.color }}
                      />
                    )}
                    {tag!.name}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Age groups */}
        {ageGroups.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {t('activities.formAgeGroups')}
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

        {/* Images */}
        {images.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {t('activities.formImages')}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <img
                    src={getDisplaySrc(img)}
                    alt={img.name}
                    className="w-full object-contain max-h-64"
                  />
                  {img.name && (
                    <p className="px-2 py-1 text-xs text-gray-500 truncate">{img.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {activity.validationErrors && activity.validationErrors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
              Chyby validace
            </h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {activity.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose()
              navigate(`/activities/${activityId}/edit`)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('common.edit')}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  )
}
