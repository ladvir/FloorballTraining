import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Shield, ShieldCheck, UserCog, Dumbbell, Crown, UserPlus } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { usersApi } from '../../api/users.api'
import type { CreateUserData } from '../../api/users.api'
import { clubsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { UserDto, ClubDto } from '../../types/domain.types'

const allRoles: { value: string; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'Admin', label: 'Admin', description: 'Plný přístup ke správě systému', icon: ShieldCheck },
  { value: 'HeadCoach', label: 'Hlavní trenér', description: 'Správa týmů, přiřazování trenérů, tréninky a události', icon: Crown },
  { value: 'Coach', label: 'Trenér', description: 'Tvorba tréninků a týmových událostí', icon: Dumbbell },
  { value: 'User', label: 'Uživatel', description: 'Prohlížení, tvorba aktivit a osobních událostí', icon: Shield },
]

const effectiveRoleBadge: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'default' }> = {
  Admin: { label: 'Admin', variant: 'info' },
  HeadCoach: { label: 'Hlavní trenér', variant: 'success' },
  Coach: { label: 'Trenér', variant: 'warning' },
  User: { label: 'Uživatel', variant: 'default' },
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  })

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateModal(false)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, role, clubId, originalClubId }: { id: string; role: string; clubId: number | null; originalClubId: number | null }) => {
      // Update club first if changed
      if (clubId !== originalClubId) {
        await usersApi.updateClub(id, clubId)
      }
      // Then update role
      await usersApi.updateRole(id, role)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  if (isLoading) return <LoadingSpinner />

  const isSelf = (user: UserDto) => user.email === currentUser?.email

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Správa uživatelů" description="Přehled všech uživatelů systému" />
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="h-4 w-4" />
          Nový uživatel
        </Button>
      </div>

      {!users?.length ? (
        <EmptyState title="Žádní uživatelé" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Uživatel</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Klub</th>
                <th className="px-4 py-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const badge = effectiveRoleBadge[user.effectiveRole] ?? effectiveRoleBadge.User
                return (
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
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.clubName ?? <span className="text-gray-300">-</span>}
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
                              Upravit
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <UserEditModal
          user={editingUser}
          clubs={clubs ?? []}
          onClose={() => setEditingUser(null)}
          onSave={(role, clubId) =>
            saveMutation.mutate({
              id: editingUser.id,
              role,
              clubId,
              originalClubId: editingUser.clubId ?? null,
            })
          }
          loading={saveMutation.isPending}
        />
      )}

      {showCreateModal && (
        <UserCreateModal
          clubs={clubs ?? []}
          onClose={() => setShowCreateModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
          error={createMutation.error}
        />
      )}
    </div>
  )
}

function UserEditModal({
  user,
  clubs,
  onClose,
  onSave,
  loading,
}: {
  user: UserDto
  clubs: ClubDto[]
  onClose: () => void
  onSave: (role: string, clubId: number | null) => void
  loading: boolean
}) {
  const [selectedRole, setSelectedRole] = useState<string>(user.effectiveRole ?? 'User')
  const [selectedClubId, setSelectedClubId] = useState<number | null>(user.clubId ?? null)

  const hasClub = selectedClubId != null

  // Reset club-dependent roles when club is removed
  useEffect(() => {
    if (!hasClub && (selectedRole === 'Coach' || selectedRole === 'HeadCoach')) {
      setSelectedRole('User')
    }
  }, [hasClub, selectedRole])

  const available = allRoles.filter((r) => {
    if (r.value === 'Coach' || r.value === 'HeadCoach') return hasClub
    return true
  })

  const hasChanges =
    selectedRole !== (user.effectiveRole ?? 'User') ||
    selectedClubId !== (user.clubId ?? null)

  return (
    <Modal isOpen onClose={onClose} title="Upravit uživatele" maxWidth="sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            Uživatel: <span className="font-medium text-gray-900">{user.firstName ? `${user.firstName} ${user.lastName}` : user.email}</span>
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        {/* Club selection */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Klub</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={selectedClubId ?? ''}
            onChange={(e) => setSelectedClubId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Bez klubu --</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>

        {/* Role selection */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
          <div className="space-y-2">
            {available.map((role) => (
              <label
                key={role.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedRole === role.value
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={() => setSelectedRole(role.value)}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-500/20"
                />
                <div className="flex items-center gap-2">
                  <role.icon className={`h-4 w-4 ${selectedRole === role.value ? 'text-sky-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </div>
              </label>
            ))}

            {!hasClub && (
              <p className="text-xs text-amber-600">
                Role Trenér a Hlavní trenér vyžadují přiřazení ke klubu.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button
            onClick={() => onSave(selectedRole, selectedClubId)}
            loading={loading}
            disabled={!hasChanges}
          >
            Uložit
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function UserCreateModal({
  clubs,
  onClose,
  onSave,
  loading,
  error,
}: {
  clubs: ClubDto[]
  onClose: () => void
  onSave: (data: CreateUserData) => void
  loading: boolean
  error: Error | null
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState('User')

  const hasClub = selectedClubId != null

  useEffect(() => {
    if (!hasClub && (selectedRole === 'Coach' || selectedRole === 'HeadCoach')) {
      setSelectedRole('User')
    }
  }, [hasClub, selectedRole])

  const available = allRoles.filter((r) => {
    if (r.value === 'Coach' || r.value === 'HeadCoach') return hasClub
    return true
  })

  const canSubmit = email.trim() !== '' && password.length >= 6

  const serverError = error
    ? (error as any)?.response?.data
      ? typeof (error as any).response.data === 'string'
        ? (error as any).response.data
        : Array.isArray((error as any).response.data)
          ? (error as any).response.data.join(', ')
          : 'Vytvoření uživatele se nezdařilo'
      : 'Vytvoření uživatele se nezdařilo'
    : null

  return (
    <Modal isOpen onClose={onClose} title="Nový uživatel" maxWidth="sm">
      <div className="space-y-4">
        {serverError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Jméno"
            placeholder="Jan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Příjmení"
            placeholder="Novák"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="uzivatel@email.cz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Heslo"
          type="password"
          placeholder="min. 6 znaků"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Club selection */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Klub</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={selectedClubId ?? ''}
            onChange={(e) => setSelectedClubId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Bez klubu --</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>

        {/* Role selection */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
          <div className="space-y-2">
            {available.map((role) => (
              <label
                key={role.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedRole === role.value
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="create-role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={() => setSelectedRole(role.value)}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-500/20"
                />
                <div className="flex items-center gap-2">
                  <role.icon className={`h-4 w-4 ${selectedRole === role.value ? 'text-sky-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </div>
              </label>
            ))}

            {!hasClub && (
              <p className="text-xs text-amber-600">
                Role Trenér a Hlavní trenér vyžadují přiřazení ke klubu.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button
            onClick={() =>
              onSave({
                email,
                password,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                clubId: selectedClubId ?? undefined,
                role: selectedRole,
              })
            }
            loading={loading}
            disabled={!canSubmit}
          >
            Vytvořit
          </Button>
        </div>
      </div>
    </Modal>
  )
}
