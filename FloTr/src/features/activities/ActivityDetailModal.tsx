import { useQuery } from '@tanstack/react-query'
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
    if (img.data?.startsWith('{')) {
      const parsed = JSON.parse(img.data)
      if (parsed && 'fieldId' in parsed) return true
    }
  } catch { /* not JSON */ }
  return img.data?.startsWith('<?xml') || img.data?.includes('src="flotr"') || false
}

export function getDisplaySrc(img: ActivityMediaDto): string {
  if (isDrawingImage(img) && img.preview) {
    if (img.preview.startsWith('<?xml') || img.preview.startsWith('<svg')) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(img.preview)
    }
    return img.preview
  }
  return img.data
}

export function ActivityDetailModal({ activityId, onClose }: { activityId: number | null; onClose: () => void }) {
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
      <Modal isOpen={true} onClose={onClose} title="Načítání…" maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  }

  if (!activity) return null

  const images = activity.activityMedium?.filter((m) => m.mediaType === 0) ?? []
  const tagNames = activity.activityTags?.map((at) => at.tag?.name).filter(Boolean) ?? []
  const ageGroups = activity.activityAgeGroups?.map((ag) => ag.ageGroup?.name ?? ag.ageGroup?.description).filter(Boolean) ?? []

  const canEdit = isAdmin || activity.createdByUserId === user?.id

  const envLabels: Record<string, string> = {
    Indoor: 'Hala',
    Outdoor: 'Venku',
    Anywhere: 'Kdekoliv',
  }

  const difficultyLabels = ['', 'Začátečník', 'Mírně pokročilý', 'Pokročilý', 'Expert']
  const intensityLabels = ['', 'Nízká', 'Střední', 'Vysoká', 'Maximální']

  return (
    <Modal isOpen={true} onClose={onClose} title={activity.name} maxWidth="lg">
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${activity.isDraft !== false ? 'bg-yellow-400' : 'bg-green-400'}`} />
          <span className="text-sm text-gray-600">{activity.isDraft !== false ? 'Rozpracovaná' : 'Kompletní'}</span>
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Popis</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
          </div>
        )}

        {/* Properties grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(activity.durationMin || activity.durationMax) && (
            <div>
              <p className="text-xs text-gray-400">Trvání</p>
              <p className="text-sm font-medium">{activity.durationMin}–{activity.durationMax} min</p>
            </div>
          )}
          {activity.personsMin != null && activity.personsMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">Hráči</p>
              <p className="text-sm font-medium">{activity.personsMin}{activity.personsMax ? `–${activity.personsMax}` : '+'}</p>
            </div>
          )}
          {activity.difficulty != null && activity.difficulty > 0 && (
            <div>
              <p className="text-xs text-gray-400">Obtížnost</p>
              <p className="text-sm font-medium">{difficultyLabels[activity.difficulty] || activity.difficulty}</p>
            </div>
          )}
          {activity.intensity != null && activity.intensity > 0 && (
            <div>
              <p className="text-xs text-gray-400">Intenzita</p>
              <p className="text-sm font-medium">{intensityLabels[activity.intensity] || activity.intensity}</p>
            </div>
          )}
          {activity.environment && (
            <div>
              <p className="text-xs text-gray-400">Prostředí</p>
              <p className="text-sm font-medium">{envLabels[activity.environment] || activity.environment}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {tagNames.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Tagy</h4>
            <div className="flex flex-wrap gap-1">
              {activity.activityTags?.map((at) => at.tag).filter(Boolean).map((tag) => (
                <span
                  key={tag!.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tag!.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag!.color }} />}
                  {tag!.name}
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

        {/* Images */}
        {images.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Obrázky</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={getDisplaySrc(img)}
                    alt={img.name}
                    className="w-full object-contain max-h-64"
                  />
                  {img.name && <p className="px-2 py-1 text-xs text-gray-500 truncate">{img.name}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {activity.validationErrors && activity.validationErrors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">Chyby validace</h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {activity.validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onClose(); navigate(`/activities/${activityId}/edit`) }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Upravit
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
  )
}
