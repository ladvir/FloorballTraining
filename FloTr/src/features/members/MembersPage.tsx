import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { membersApi } from '../../api/index'

export function MembersPage() {
  const { data: members, isLoading } = useQuery({ queryKey: ['members'], queryFn: membersApi.getAll })
  if (isLoading) return <LoadingSpinner />
  return (
    <div>
      <PageHeader title="Členové" action={<Button size="sm"><Plus className="h-4 w-4" />Nový člen</Button>} />
      {!members?.length ? (
        <EmptyState title="Žádní členové" description="Zatím nebyl přidán žádný člen." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Jméno</th>
                <th className="px-4 py-3 text-left">Příjmení</th>
                <th className="px-4 py-3 text-left">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.firstName}</td>
                  <td className="px-4 py-3 text-gray-600">{m.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
