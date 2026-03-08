import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Calendar, ClipboardList, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { dashboardApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

  if (isLoading) return <LoadingSpinner />

  const greeting = user?.firstName ? `Dobrý den, ${user.firstName}!` : 'Dobrý den!'
  const appointments = data?.appointments ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{greeting}</h1>
        <p className="mt-1 text-sm text-gray-500">Přehled systému FloTr</p>
      </div>

      {data && (data.totalTrainings > 0 || data.draftTrainings > 0 || data.completeTrainings > 0) && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Tréninky
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.totalTrainings}</p>
                  <p className="text-xs text-gray-500">Celkem</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{data.completeTrainings}</p>
                  <p className="text-xs text-gray-500">Kompletní</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{data.draftTrainings}</p>
                  <p className="text-xs text-gray-500">Rozpracované</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Nadcházející události
        </h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">Žádné nadcházející události.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
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
    </div>
  )
}
