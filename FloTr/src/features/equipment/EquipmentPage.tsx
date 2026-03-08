import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { equipmentApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

export function EquipmentPage() {
  const { isAdmin } = useAuthStore()
  const { data: equipment, isLoading } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.getAll })
  if (isLoading) return <LoadingSpinner />
  return (
    <div>
      <PageHeader
        title="Vybavení"
        action={isAdmin ? <Button size="sm"><Plus className="h-4 w-4" />Přidat</Button> : undefined}
      />
      {!equipment?.length ? (
        <EmptyState title="Žádné vybavení" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr><th className="px-4 py-3 text-left">Název</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipment.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{e.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
