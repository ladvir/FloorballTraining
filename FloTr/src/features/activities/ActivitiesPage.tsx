import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, Users, Pencil, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { activitiesApi } from '../../api/activities.api'
import { useAuthStore } from '../../store/authStore'
import type { ActivityDto } from '../../types/domain.types'

// ── Validation result modal ───────────────────────────────────────────────────

function ValidationResultModal({
  result,
  onClose,
}: {
  result: { isDraft: boolean; errors: string[]; name: string } | null
  onClose: () => void
}) {
  if (!result) return null
  return (
    <Modal isOpen={true} onClose={onClose} title={`Validace: ${result.name}`} maxWidth="md">
      {result.isDraft ? (
        <div className="space-y-3">
          <p className="text-sm text-yellow-700">Aktivita je <strong>rozpracovaná</strong> — nalezeny problémy:</p>
          <ul className="space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 text-red-400">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-green-700">
          Aktivita je <strong>kompletní</strong> a splňuje všechny požadavky.
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
  )
}

// ── Validate-all result modal ─────────────────────────────────────────────────

function ValidateAllResultModal({
  result,
  onClose,
}: {
  result: { total: number; validCount: number; draftCount: number } | null
  onClose: () => void
}) {
  if (!result) return null
  return (
    <Modal isOpen={true} onClose={onClose} title="Výsledek kontroly všech aktivit" maxWidth="sm">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">Celkem aktivit:</span><strong>{result.total}</strong></div>
        <div className="flex justify-between"><span className="text-green-600">Kompletní:</span><strong className="text-green-700">{result.validCount}</strong></div>
        <div className="flex justify-between"><span className="text-yellow-600">Rozpracované:</span><strong className="text-yellow-700">{result.draftCount}</strong></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ActivitiesPage() {
  const { isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [validationResult, setValidationResult] = useState<{ isDraft: boolean; errors: string[]; name: string } | null>(null)
  const [validateAllResult, setValidateAllResult] = useState<{ total: number; validCount: number; draftCount: number } | null>(null)
  const [validatingId, setValidatingId] = useState<number | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
  })

  const validateMutation = useMutation({
    mutationFn: (activity: ActivityDto) => activitiesApi.validate(activity.id),
    onSuccess: (data, activity) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setValidationResult({ ...data, name: activity.name })
      setValidatingId(null)
    },
    onError: (err: unknown) => {
      setValidatingId(null)
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Validace selhala.'
      setGlobalError(msg)
    },
  })

  const validateAllMutation = useMutation({
    mutationFn: () => activitiesApi.validateAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setValidateAllResult(data)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Kontrola selhala.'
      setGlobalError(msg)
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

      {globalError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{globalError}</span>
          <button type="button" onClick={() => setGlobalError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

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
                  <img src={thumbnail.data} alt={activity.name} className="h-full w-full object-cover" />
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

                <div className="mt-3 flex flex-wrap gap-2">
                  {isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/activities/${activity.id}/edit`)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Upravit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    loading={validatingId === activity.id}
                    onClick={() => {
                      setValidatingId(activity.id)
                      validateMutation.mutate(activity)
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Validovat
                  </Button>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      <ValidationResultModal
        result={validationResult}
        onClose={() => setValidationResult(null)}
      />

      <ValidateAllResultModal
        result={validateAllResult}
        onClose={() => setValidateAllResult(null)}
      />
    </div>
  )
}
