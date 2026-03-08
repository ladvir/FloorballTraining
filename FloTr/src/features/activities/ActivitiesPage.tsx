import { useQuery } from '@tanstack/react-query'
import { Plus, Clock, Users } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { activitiesApi } from '../../api/activities.api'
import { useAuthStore } from '../../store/authStore'

export function ActivitiesPage() {
  const { isAdmin } = useAuthStore()
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Aktivity"
        description="Knihovna florbalových aktivit a cvičení"
        action={
          isAdmin ? (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Nová aktivita
            </Button>
          ) : undefined
        }
      />

      {!activities?.length ? (
        <EmptyState title="Žádné aktivity" description="Zatím nebyla vytvořena žádná aktivita." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <h3 className="font-medium text-gray-900 truncate">{activity.name}</h3>
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
                  {activity.personsMin && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      min {activity.personsMin} hráčů
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
