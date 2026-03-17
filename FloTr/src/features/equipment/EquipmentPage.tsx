import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { equipmentApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { EquipmentDto } from '../../types/domain.types'

export function EquipmentPage() {
  const { isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: equipment, isLoading } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.getAll })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EquipmentDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<EquipmentDto | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Partial<EquipmentDto>) => equipmentApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['equipment'] }); setModalOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EquipmentDto> }) => equipmentApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['equipment'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => equipmentApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['equipment'] }); setDeleteConfirm(null) },
  })

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (item: EquipmentDto) => { setEditing(item); setModalOpen(true) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Vybavení"
        action={
          isAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />Přidat
            </Button>
          ) : undefined
        }
      />
      {!equipment?.length ? (
        <EmptyState
          title="Žádné vybavení"
          action={
            isAdmin ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />Přidat vybavení
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Název</th>
                {isAdmin && <th className="px-4 py-3 text-right w-24">Akce</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipment.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(e)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Upravit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(e)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="Smazat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <>
          <EquipmentFormModal
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setEditing(null) }}
            item={editing}
            onSave={(data) => {
              if (editing) {
                updateMutation.mutate({ id: editing.id, data })
              } else {
                createMutation.mutate(data)
              }
            }}
            saving={createMutation.isPending || updateMutation.isPending}
          />

          <Modal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            title="Smazat vybavení"
            maxWidth="sm"
          >
            <p className="text-sm text-gray-600 mb-4">
              Opravdu chcete smazat <strong>{deleteConfirm?.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Zrušit</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
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

function EquipmentFormModal({
  isOpen,
  onClose,
  item,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  item: EquipmentDto | null
  onSave: (data: Partial<EquipmentDto>) => void
  saving: boolean
}) {
  const [name, setName] = useState('')

  useResetOnOpen(isOpen, useCallback(() => setName(item?.name ?? ''), [item]))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Upravit vybavení' : 'Nové vybavení'} maxWidth="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ name })
        }}
      >
        <Input
          label="Název"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Zrušit</Button>
          <Button type="submit" size="sm" disabled={!name.trim() || saving}>
            {saving ? 'Ukládání…' : item ? 'Uložit' : 'Vytvořit'}
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
