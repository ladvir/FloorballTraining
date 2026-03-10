import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Shield, ShieldCheck, UserCog } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { usersApi } from '../../api/users.api'
import { useAuthStore } from '../../store/authStore'
import type { UserDto } from '../../types/domain.types'

const availableRoles = ['Admin', 'User'] as const

export function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  if (isLoading) return <LoadingSpinner />

  const isSelf = (user: UserDto) => user.email === currentUser?.email

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
                          {role === 'Admin' ? (
                            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />{role}</span>
                          ) : role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!isSelf(user) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <UserCog className="h-3.5 w-3.5" />
                            Změnit roli
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
                      {isSelf(user) && (
                        <span className="text-xs text-gray-400">Přihlášený uživatel</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role edit modal */}
      {editingUser && (
        <RoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(role) => roleChangeMutation.mutate({ id: editingUser.id, role })}
          loading={roleChangeMutation.isPending}
        />
      )}
    </div>
  )
}

function RoleModal({
  user,
  onClose,
  onSave,
  loading,
}: {
  user: UserDto
  onClose: () => void
  onSave: (role: string) => void
  loading: boolean
}) {
  const [selectedRole, setSelectedRole] = useState<string>(
    user.roles.includes('Admin') ? 'Admin' : 'User'
  )

  return (
    <Modal isOpen onClose={onClose} title="Nastavit roli" maxWidth="sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            Uživatel: <span className="font-medium text-gray-900">{user.firstName ? `${user.firstName} ${user.lastName}` : user.email}</span>
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        <div className="space-y-2">
          {availableRoles.map((role) => (
            <label
              key={role}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                selectedRole === role
                  ? 'border-sky-300 bg-sky-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="h-4 w-4 text-sky-500 focus:ring-sky-500/20"
              />
              <div className="flex items-center gap-2">
                {role === 'Admin' ? (
                  <ShieldCheck className="h-4 w-4 text-sky-600" />
                ) : (
                  <Shield className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{role}</p>
                  <p className="text-xs text-gray-500">
                    {role === 'Admin' ? 'Plný přístup ke správě systému' : 'Běžný uživatel s omezeným přístupem'}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button
            onClick={() => onSave(selectedRole)}
            loading={loading}
            disabled={user.roles.includes(selectedRole) && user.roles.length === 1}
          >
            Uložit
          </Button>
        </div>
      </div>
    </Modal>
  )
}
