import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { placesApi } from '../../api/index'

export function PlacesPage() {
  const { data: places, isLoading } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  if (isLoading) return <LoadingSpinner />
  return (
    <div>
      <PageHeader title="Místa" action={<Button size="sm"><Plus className="h-4 w-4" />Nové místo</Button>} />
      {!places?.length ? (
        <EmptyState title="Žádná místa" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Název</th>
                <th className="px-4 py-3 text-left">Šířka</th>
                <th className="px-4 py-3 text-left">Délka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {places.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.width}m</td>
                  <td className="px-4 py-3 text-gray-600">{p.length}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
