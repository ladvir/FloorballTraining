import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { clubsApi } from '../../api/index'

export function ClubsPage() {
  const { data: clubs, isLoading } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })
  if (isLoading) return <LoadingSpinner />
  return (
    <div>
      <PageHeader title="Kluby" action={<Button size="sm"><Plus className="h-4 w-4" />Nový klub</Button>} />
      {!clubs?.length ? (
        <EmptyState title="Žádné kluby" description="Zatím nebyl vytvořen žádný klub." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Card key={club.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <h3 className="font-medium text-gray-900">{club.name}</h3>
                {club.description && <p className="mt-1 text-sm text-gray-500">{club.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
