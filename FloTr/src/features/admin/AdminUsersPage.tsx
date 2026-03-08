import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { usersApi } from '../../api/users.api'
import { useAuthStore } from '../../store/authStore'
import type { UserDto } from '../../types/domain.types'

export function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const toggleRole = (user: UserDto) => {
    const isAdmin = user.roles.includes('Admin')
    roleChangeMutation.mutate({ id: user.id, role: isAdmin ? 'User' : 'Admin' })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Správa uživatelů" description="Přehled všech uživatelů systému" />

      {!users?.length ? (
        <EmptyState title="Žádní uživatelé" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Uživatel</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={role === 'Admin' ? 'info' : 'default'}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.id !== currentUser?.email && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRole(user)}
                            loading={roleChangeMutation.isPending}
                          >
                            {user.roles.includes('Admin') ? 'Odebrat Admin' : 'Nastavit Admin'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Smazat uživatele ${user.email}?`))
                                deleteMutation.mutate(user.id)
                            }}
                            loading={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
