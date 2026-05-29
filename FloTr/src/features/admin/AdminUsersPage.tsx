import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import {
  Trash2,
  Shield,
  ShieldCheck,
  UserCog,
  Dumbbell,
  Crown,
  UserPlus,
  Plus,
  X,
  Building2,
  Mail,
  KeyRound,
  AlertTriangle,
} from 'lucide-react'
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
import type { UserDto, ClubDto, EffectiveRole } from '../../types/domain.types'

const roleLevels: Record<string, number> = {
  User: 0,
  Coach: 1,
  HeadCoach: 2,
  ClubAdmin: 3,
  Admin: 4,
}

const allRoles: {
  value: string
  label: string
  description: string
  icon: React.ElementType
  minLevel: number
}[] = [
  {
    value: 'Admin',
    label: 'Admin',
    description: 'Plný přístup ke správě systému',
    icon: ShieldCheck,
    minLevel: 4,
  },
  {
    value: 'ClubAdmin',
    label: 'Klubový administrátor',
    description: 'Plná správa v rámci svého klubu',
    icon: ShieldCheck,
    minLevel: 3,
  },
  {
    value: 'HeadCoach',
    label: 'Hlavní trenér',
    description: 'Správa týmů, přiřazování trenérů',
    icon: Crown,
    minLevel: 2,
  },
  {
    value: 'Coach',
    label: 'Trenér',
    description: 'Tvorba tréninků a týmových událostí',
    icon: Dumbbell,
    minLevel: 1,
  },
  {
    value: 'User',
    label: 'Uživatel',
    description: 'Prohlížení, tvorba aktivit',
    icon: Shield,
    minLevel: 0,
  },
]

const effectiveRoleBadge: Record<
  string,
  { label: string; variant: 'info' | 'success' | 'warning' | 'default' }
> = {
  Admin: { label: 'Admin', variant: 'info' },
  ClubAdmin: { label: 'Kl. admin', variant: 'info' },
  HeadCoach: { label: 'Hlavní trenér', variant: 'success' },
  Coach: { label: 'Trenér', variant: 'warning' },
  User: { label: 'Uživatel', variant: 'default' },
}

export function AdminUsersPage() {
  const {
    user: currentUser,
    isAdmin,
    isAdminLike,
    isHeadCoach,
    effectiveRole,
    activeClubName,
  } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [credentialsFeedback, setCredentialsFeedback] = useState<{
    id: string
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<UserDto | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  })

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
    enabled: isAdminLike, // Admin + ClubAdmin manage club memberships
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteConfirm(null)
      setDeleteError(null)
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (axiosErr.response?.data as { message?: string })?.message ??
        (typeof axiosErr.response?.data === 'string' ? axiosErr.response.data : null) ??
        'Smazání uživatele se nezdařilo.'
      setDeleteError(msg)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateModal(false)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await usersApi.updateRole(id, role)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  const sendCredentialsMutation = useMutation({
    mutationFn: (id: string) => usersApi.sendCredentials(id),
    onSuccess: (_data, id) => {
      setCredentialsFeedback({
        id,
        type: 'success',
        text: 'Heslo bylo resetováno a nové údaje byly odeslány emailem.',
      })
    },
    onError: (error: unknown, id) => {
      const axiosErr = error as { response?: { data?: { message?: string } | string } }
      const msg =
        (axiosErr.response?.data as { message?: string })?.message ??
        (typeof axiosErr.response?.data === 'string' ? axiosErr.response.data : null) ??
        'Nepodařilo se odeslat email.'
      setCredentialsFeedback({ id, type: 'error', text: msg })
    },
  })

  if (isLoading) return <LoadingSpinner />

  const isSelf = (user: UserDto) => user.email === currentUser?.email

  // Can the caller edit this user?
  const canEdit = (user: UserDto) => {
    if (isSelf(user)) return false
    if (isAdminLike) return true
    if (isHeadCoach) return true
    return false // Coach can only view and create
  }

  const canDelete = (user: UserDto) => {
    if (isSelf(user)) return false
    return isAdmin
  }

  const canSendCredentials = (user: UserDto) => {
    if (isSelf(user)) return false
    return isAdminLike
  }

  const handleSendCredentials = (user: UserDto) => {
    if (
      !confirm(
        `Odeslat uživateli ${user.email} nové přihlašovací údaje?\n\nHeslo bude resetováno na nově vygenerované a zasláno emailem.`
      )
    )
      return
    setCredentialsFeedback(null)
    sendCredentialsMutation.mutate(user.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Správa uživatelů"
          description={
            isAdmin ? 'Přehled všech uživatelů systému' : `Uživatelé klubu ${activeClubName ?? ''}`
          }
        />
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
                <th className="px-4 py-3 text-left">Poslední přihlášení</th>
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
                    <td className="px-4 py-3 text-gray-500">
                      {user.lastLoginAt ? (
                        <span
                          title={format(parseISO(user.lastLoginAt), 'd. M. yyyy HH:mm', {
                            locale: cs,
                          })}
                        >
                          {format(parseISO(user.lastLoginAt), 'd. M. yyyy HH:mm', { locale: cs })}
                        </span>
                      ) : (
                        <span className="text-gray-300">nikdy</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit(user) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(user)}
                            >
                              <UserCog className="h-3.5 w-3.5" />
                              Upravit
                            </Button>
                          )}
                          {canSendCredentials(user) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendCredentials(user)}
                              loading={
                                sendCredentialsMutation.isPending &&
                                sendCredentialsMutation.variables === user.id
                              }
                              title="Resetovat heslo a odeslat nové přihlašovací údaje emailem"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Resetovat heslo
                            </Button>
                          )}
                          {canDelete(user) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setDeleteError(null)
                                setDeleteConfirm(user)
                              }}
                              title="Smazat trvale"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isSelf(user) && (
                            <span className="text-xs text-gray-400">Přihlášený uživatel</span>
                          )}
                        </div>
                        {credentialsFeedback?.id === user.id && (
                          <span
                            className={`text-xs ${credentialsFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}
                          >
                            {credentialsFeedback.text}
                          </span>
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
          callerRole={effectiveRole}
          callerClubMemberships={currentUser?.clubMemberships ?? []}
          onClose={() => setEditingUser(null)}
          onSave={(role) =>
            saveMutation.mutate({
              id: editingUser.id,
              role,
            })
          }
          loading={saveMutation.isPending}
        />
      )}

      {showCreateModal && (
        <UserCreateModal
          clubs={clubs ?? []}
          callerRole={effectiveRole}
          onClose={() => setShowCreateModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
          error={createMutation.error}
        />
      )}

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => {
          setDeleteConfirm(null)
          setDeleteError(null)
        }}
        title="Smazat uživatele"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Opravdu chcete trvale smazat uživatele{' '}
              <strong>
                {deleteConfirm?.firstName
                  ? `${deleteConfirm.firstName} ${deleteConfirm.lastName}`
                  : deleteConfirm?.email}
              </strong>
              ? Tato akce je nevratná a odstraní jeho přihlašovací účet, vazby na kluby a další
              záznamy.
            </span>
          </div>
          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirm(null)
                setDeleteError(null)
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Smazat trvale
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function UserEditModal({
  user,
  clubs,
  callerRole,
  callerClubMemberships,
  onClose,
  onSave,
  loading,
}: {
  user: UserDto
  clubs: ClubDto[]
  callerRole: EffectiveRole
  callerClubMemberships: { clubId: number; clubName: string; effectiveRole: EffectiveRole }[]
  onClose: () => void
  onSave: (role: string) => void
  loading: boolean
}) {
  const callerLevel = roleLevels[callerRole] ?? 0
  const isAdmin = callerRole === 'Admin'
  const isClubAdmin = callerRole === 'ClubAdmin'
  const isAdminLike = isAdmin || isClubAdmin
  const callerClubAdminIds = callerClubMemberships
    .filter((m) => m.effectiveRole === 'ClubAdmin')
    .map((m) => m.clubId)
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string>(user.effectiveRole ?? 'User')
  const [addingClubId, setAddingClubId] = useState<number | null>(null)

  const memberships = user.clubMemberships ?? []
  const memberClubIds = memberships.map((m) => m.clubId)
  const hasClub = memberships.length > 0 || user.clubId != null

  const [addClubError, setAddClubError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const setPasswordMutation = useMutation({
    mutationFn: (password: string) => usersApi.setPassword(user.id, password),
    onSuccess: () => {
      setPasswordFeedback({ type: 'success', text: 'Heslo bylo nastaveno.' })
      setNewPassword('')
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (axiosErr.response?.data as { message?: string })?.message ??
        (typeof axiosErr.response?.data === 'string' ? axiosErr.response.data : null) ??
        'Nepodařilo se nastavit heslo.'
      setPasswordFeedback({ type: 'error', text: msg })
    },
  })

  const addClubMutation = useMutation({
    mutationFn: (clubId: number) => usersApi.addClub(user.id, clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setAddingClubId(null)
      setAddClubError(null)
    },
    onError: (error: unknown) => {
      const axiosErr = error as { response?: { data?: { message?: string } | string } }
      const msg =
        (axiosErr.response?.data as { message?: string })?.message ??
        axiosErr.response?.data ??
        'Nepodařilo se přidat klub.'
      setAddClubError(typeof msg === 'string' ? msg : 'Nepodařilo se přidat klub.')
    },
  })

  const removeClubMutation = useMutation({
    mutationFn: (clubId: number) => usersApi.removeClub(user.id, clubId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  useEffect(() => {
    if (!hasClub && (selectedRole === 'Coach' || selectedRole === 'HeadCoach')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset role when club removed
      setSelectedRole('User')
    }
  }, [hasClub, selectedRole])

  const available = allRoles.filter((r) => {
    if (r.minLevel > callerLevel) return false
    if (r.value === 'Coach' || r.value === 'HeadCoach' || r.value === 'ClubAdmin') return hasClub
    if (r.value === 'Admin') return isAdmin
    return true
  })

  const hasRoleChange = selectedRole !== (user.effectiveRole ?? 'User')

  // Clubs available to add (not already a member).
  // Admin can add any club; ClubAdmin only their own club(s).
  const baseClubs = clubs.filter((c) => !memberClubIds.includes(c.id))
  const availableClubs = isAdmin
    ? baseClubs
    : baseClubs.filter((c) => callerClubAdminIds.includes(c.id))

  const canRemoveMembership = (clubId: number) => isAdmin || callerClubAdminIds.includes(clubId)

  const roleLabel: Record<string, string> = {
    Admin: 'Admin',
    ClubAdmin: 'Kl. admin',
    HeadCoach: 'Hl. trenér',
    Coach: 'Trenér',
    User: 'Uživatel',
  }

  return (
    <Modal isOpen onClose={onClose} title="Upravit uživatele" maxWidth="sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            Uživatel:{' '}
            <span className="font-medium text-gray-900">
              {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
            </span>
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        {/* Club memberships — Admin + ClubAdmin */}
        {isAdminLike && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Kluby</label>
            {memberships.length === 0 && (
              <p className="text-sm text-gray-400 mb-2">Uživatel není v žádném klubu.</p>
            )}
            <div className="space-y-1.5 mb-2">
              {memberships.map((m) => (
                <div
                  key={m.clubId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{m.clubName}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      {roleLabel[m.effectiveRole] ?? m.effectiveRole}
                    </span>
                  </div>
                  {canRemoveMembership(m.clubId) && (
                    <button
                      onClick={() => {
                        if (confirm(`Odebrat uživatele z klubu ${m.clubName}?`))
                          removeClubMutation.mutate(m.clubId)
                      }}
                      disabled={removeClubMutation.isPending}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Odebrat z klubu"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add club */}
            {availableClubs.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={addingClubId ?? ''}
                  onChange={(e) => setAddingClubId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">-- Přidat do klubu --</option>
                  {availableClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={!addingClubId || addClubMutation.isPending}
                  loading={addClubMutation.isPending}
                  onClick={() => addingClubId && addClubMutation.mutate(addingClubId)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Přidat
                </Button>
              </div>
            )}
            {addClubError && <p className="text-xs text-red-500 mt-1">{addClubError}</p>}
          </div>
        )}

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
                  <role.icon
                    className={`h-4 w-4 ${selectedRole === role.value ? 'text-sky-600' : 'text-gray-400'}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Set password — Admin only */}
        {isAdmin && (
          <div className="rounded-lg border border-gray-200 p-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <KeyRound className="h-3.5 w-3.5 text-gray-400" />
              Nastavit nové heslo
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Heslo bude přepsáno ihned. Uživateli nebude odeslán žádný email.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="min. 6 znaků"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordFeedback(null)
                }}
              />
              <Button
                size="sm"
                onClick={() => setPasswordMutation.mutate(newPassword)}
                loading={setPasswordMutation.isPending}
                disabled={newPassword.length < 6 || setPasswordMutation.isPending}
              >
                Nastavit
              </Button>
            </div>
            {passwordFeedback && (
              <p
                className={`mt-1 text-xs ${passwordFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {passwordFeedback.text}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={() => onSave(selectedRole)} loading={loading} disabled={!hasRoleChange}>
            Uložit roli
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function UserCreateModal({
  clubs,
  callerRole,
  onClose,
  onSave,
  loading,
  error,
}: {
  clubs: ClubDto[]
  callerRole: EffectiveRole
  onClose: () => void
  onSave: (data: CreateUserData) => void
  loading: boolean
  error: Error | null
}) {
  const callerLevel = roleLevels[callerRole] ?? 0
  const isAdmin = callerRole === 'Admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState('User')
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(false)

  // Non-admin: club is always the active club (no selection needed)
  const hasClub = isAdmin ? selectedClubId != null : true

  useEffect(() => {
    if (!hasClub && (selectedRole === 'Coach' || selectedRole === 'HeadCoach')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset role when club removed
      setSelectedRole('User')
    }
  }, [hasClub, selectedRole])

  // Only show roles the caller can assign
  const available = allRoles.filter((r) => {
    if (r.minLevel > callerLevel) return false
    if (r.value === 'Coach' || r.value === 'HeadCoach' || r.value === 'ClubAdmin') return hasClub
    if (r.value === 'Admin') return isAdmin
    return true
  })

  const canSubmit = email.trim() !== '' && password.length >= 6

  const serverError = (() => {
    if (!error) return null
    const axiosErr = error as { response?: { data?: unknown } }
    const data = axiosErr.response?.data
    if (typeof data === 'string') return data
    if (Array.isArray(data)) return data.join(', ')
    return 'Vytvoření uživatele se nezdařilo'
  })()

  return (
    <Modal isOpen onClose={onClose} title="Nový uživatel" maxWidth="sm">
      <div className="space-y-4">
        {serverError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</div>
        )}

        {!isAdmin && (
          <div className="rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Uživatel bude přidán do vašeho aktivního klubu.
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

        {/* Club selection — Admin only */}
        {isAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Klub</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={selectedClubId ?? ''}
              onChange={(e) => setSelectedClubId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">-- Bez klubu --</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
                  <role.icon
                    className={`h-4 w-4 ${selectedRole === role.value ? 'text-sky-600' : 'text-gray-400'}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:border-gray-300">
            <input
              type="checkbox"
              checked={sendCredentialsEmail}
              onChange={(e) => setSendCredentialsEmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-sky-500 focus:ring-sky-500/20"
            />
            <div className="flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                Odeslat uvítací email s přihlašovacími údaji
              </p>
              <p className="text-xs text-gray-500">
                Uživateli přijde email s přihlašovacím jménem, heslem a postupem pro změnu hesla v
                profilu.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            onClick={() =>
              onSave({
                email,
                password,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                clubId: isAdmin ? (selectedClubId ?? undefined) : undefined,
                role: selectedRole,
                sendCredentialsEmail,
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
