import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, Users, Pencil, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { activitiesApi } from '../../api/activities.api'
import { useAuthStore } from '../../store/authStore'
import type { ActivityDto, ActivityMediaDto } from '../../types/domain.types'

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

function getDisplaySrc(img: ActivityMediaDto): string {
  if (isDrawingImage(img) && img.preview) return img.preview
  return img.data
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ActivitiesPage() {
  const { isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [validateAllResult, setValidateAllResult] = useState<{ total: number; validCount: number; draftCount: number } | null>(null)

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
  })

  const validateAllMutation = useMutation({
    mutationFn: () => activitiesApi.validateAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setValidateAllResult(data)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Aktivity"
        description="Knihovna florbalových aktivit a cvičení"
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
              <Button size="sm" onClick={() => navigate('/activities/new')}>
                <Plus className="h-4 w-4" />
                Nová aktivita
              </Button>
            </div>
          ) : undefined
        }
      />

      {!activities?.length ? (
        <EmptyState
          title="Žádné aktivity"
          description="Zatím nebyla vytvořena žádná aktivita."
          action={
            isAdmin ? (
              <Button size="sm" onClick={() => navigate('/activities/new')}>
                <Plus className="h-4 w-4" />
                Vytvořit první aktivitu
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => {
            const thumbnail = activity.activityMedium?.find((m) => m.isThumbnail) ?? activity.activityMedium?.[0]
            return (
            <Card key={activity.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {thumbnail && (
                <div className="h-36 w-full overflow-hidden bg-gray-100">
                  <img src={getDisplaySrc(thumbnail)} alt={activity.name} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="py-4">
                {/* Status dot + name */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900 truncate">{activity.name}</h3>
                  <span
                    title={activity.isDraft !== false ? 'Rozpracovaná' : 'Kompletní'}
                    className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${activity.isDraft !== false ? 'bg-yellow-400' : 'bg-green-400'}`}
                  />
                </div>

                {activity.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  {(activity.durationMin || activity.durationMax) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.durationMin}–{activity.durationMax} min
                    </span>
                  )}
                  {activity.personsMin != null && activity.personsMin > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {activity.personsMin}{activity.personsMax ? `–${activity.personsMax}` : '+'} hráčů
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/activities/${activity.id}/edit`)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Upravit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      {validateAllResult && (
        <Modal isOpen={true} onClose={() => setValidateAllResult(null)} title="Výsledek kontroly všech aktivit" maxWidth="sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Celkem aktivit:</span><strong>{validateAllResult.total}</strong></div>
            <div className="flex justify-between"><span className="text-green-600">Kompletní:</span><strong className="text-green-700">{validateAllResult.validCount}</strong></div>
            <div className="flex justify-between"><span className="text-yellow-600">Rozpracované:</span><strong className="text-yellow-700">{validateAllResult.draftCount}</strong></div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => setValidateAllResult(null)}>Zavřít</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
