import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { membersApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { MemberDto } from '../../types/domain.types'

export function MembersPage() {
  const { isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: members, isLoading } = useQuery({ queryKey: ['members'], queryFn: membersApi.getAll })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MemberDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<MemberDto | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Partial<MemberDto>) => membersApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); setModalOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<MemberDto>) => membersApi.update(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (member: Partial<MemberDto>) => membersApi.delete(member),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); setDeleteConfirm(null) },
  })

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (member: MemberDto) => { setEditing(member); setModalOpen(true) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Členové"
        action={
          isAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />Nový člen
            </Button>
          ) : undefined
        }
      />
      {!members?.length ? (
        <EmptyState
          title="Žádní členové"
          description="Zatím nebyl přidán žádný člen."
          action={
            isAdmin ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />Přidat prvního člena
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Jméno</th>
                <th className="px-4 py-3 text-left">Příjmení</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                {isAdmin && <th className="px-4 py-3 text-right w-24">Akce</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => {
                const roles = [
                  m.hasClubRoleManager && 'Manažer',
                  m.hasClubRoleSecretary && 'Sekretář',
                  m.hasClubRoleMainCoach && 'Hlavní trenér',
                ].filter(Boolean)
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.firstName}</td>
                    <td className="px-4 py-3 text-gray-600">{m.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{m.email || '–'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{roles.length ? roles.join(', ') : '–'}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Upravit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(m)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            title="Smazat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <>
          <MemberFormModal
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setEditing(null) }}
            member={editing}
            onSave={(data) => {
              if (editing) {
                updateMutation.mutate({ ...data, id: editing.id })
              } else {
                createMutation.mutate(data)
              }
            }}
            saving={createMutation.isPending || updateMutation.isPending}
          />

          <Modal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            title="Smazat člena"
            maxWidth="sm"
          >
            <p className="text-sm text-gray-600 mb-4">
              Opravdu chcete smazat člena <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Zrušit</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
              >
                Smazat
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}

function MemberFormModal({
  isOpen,
  onClose,
  member,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  member: MemberDto | null
  onSave: (data: Partial<MemberDto>) => void
  saving: boolean
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [hasClubRoleManager, setHasClubRoleManager] = useState(false)
  const [hasClubRoleSecretary, setHasClubRoleSecretary] = useState(false)
  const [hasClubRoleMainCoach, setHasClubRoleMainCoach] = useState(false)

  useResetOnOpen(isOpen, useCallback(() => {
    setFirstName(member?.firstName ?? '')
    setLastName(member?.lastName ?? '')
    setEmail(member?.email ?? '')
    setHasClubRoleManager(member?.hasClubRoleManager ?? false)
    setHasClubRoleSecretary(member?.hasClubRoleSecretary ?? false)
    setHasClubRoleMainCoach(member?.hasClubRoleMainCoach ?? false)
  }, [member]))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={member ? 'Upravit člena' : 'Nový člen'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ firstName, lastName, email: email || undefined, hasClubRoleManager, hasClubRoleSecretary, hasClubRoleMainCoach })
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Jméno" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
            <Input label="Příjmení" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Klubové role</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasClubRoleManager}
                  onChange={(e) => setHasClubRoleManager(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                />
                <span className="text-sm text-gray-700">Manažer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasClubRoleSecretary}
                  onChange={(e) => setHasClubRoleSecretary(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                />
                <span className="text-sm text-gray-700">Sekretář</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasClubRoleMainCoach}
                  onChange={(e) => setHasClubRoleMainCoach(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
                />
                <span className="text-sm text-gray-700">Hlavní trenér</span>
              </label>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Zrušit</Button>
          <Button type="submit" size="sm" disabled={!firstName.trim() || !lastName.trim() || saving}>
            {saving ? 'Ukládání…' : member ? 'Uložit' : 'Vytvořit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function useResetOnOpen(isOpen: boolean, onReset: () => void) {
  const prevRef = useRef(false)
  useEffect(() => {
    if (isOpen && !prevRef.current) onReset()
    prevRef.current = isOpen
  }, [isOpen, onReset])
}
