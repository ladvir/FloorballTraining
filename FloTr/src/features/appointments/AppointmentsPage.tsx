import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Plus, Calendar } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { appointmentsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

export function AppointmentsPage() {
  const { isAdmin } = useAuthStore()
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Události"
        description="Plánované tréninky a akce"
        action={isAdmin ? <Button size="sm"><Plus className="h-4 w-4" />Nová událost</Button> : undefined}
      />
      {!appointments?.length ? (
        <EmptyState title="Žádné události" description="Zatím nejsou naplánované žádné události." />
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {apt.name ?? format(parseISO(apt.start), 'd. M. yyyy', { locale: cs })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(parseISO(apt.start), 'HH:mm')} –{' '}
                    {format(parseISO(apt.end), 'HH:mm')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
