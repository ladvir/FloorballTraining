import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { placesApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { PlaceDto } from '../../types/domain.types'

const environmentLabels: Record<string, string> = {
  'Indoor': 'Vnitřní',
  'Outdoor': 'Venkovní',
}

export function PlacesPage() {
  const { isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: places, isLoading } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PlaceDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<PlaceDto | null>(null)
  const [deleteUnusedConfirm, setDeleteUnusedConfirm] = useState(false)

  const createMutation = useMutation({
    mutationFn: (data: Partial<PlaceDto>) => placesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['places'] }); setModalOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlaceDto> }) => placesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['places'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => placesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['places'] }); setDeleteConfirm(null) },
  })

  const deleteUnusedMutation = useMutation({
    mutationFn: () => placesApi.deleteUnused(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['places'] }); setDeleteUnusedConfirm(false) },
  })

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (item: PlaceDto) => { setEditing(item); setModalOpen(true) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Místa"
        action={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteUnusedConfirm(true)}>
                <Trash2 className="h-4 w-4" />Smazat nepoužívaná
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />Nové místo
              </Button>
            </div>
          ) : undefined
        }
      />
      {!places?.length ? (
        <EmptyState
          title="Žádná místa"
          action={
            isAdmin ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />Přidat místo
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
                <th className="px-4 py-3 text-left">Rozměry</th>
                <th className="px-4 py-3 text-left">Prostředí</th>
                {isAdmin && <th className="px-4 py-3 text-right w-24">Akce</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {places.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.width && p.length ? `${p.width} × ${p.length} m` : '–'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.environment ? (environmentLabels[p.environment] ?? p.environment) : '–'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Upravit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p)}
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
          <PlaceFormModal
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
            title="Smazat místo"
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

          <Modal
            isOpen={deleteUnusedConfirm}
            onClose={() => setDeleteUnusedConfirm(false)}
            title="Smazat nepoužívaná místa"
            maxWidth="sm"
          >
            <p className="text-sm text-gray-600 mb-4">
              Budou smazána všechna místa, ke kterým neexistuje žádná událost. Tato akce je nevratná.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteUnusedConfirm(false)}>Zrušit</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteUnusedMutation.mutate()}
                disabled={deleteUnusedMutation.isPending}
              >
                Smazat nepoužívaná
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}

function PlaceFormModal({
  isOpen,
  onClose,
  item,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  item: PlaceDto | null
  onSave: (data: Partial<PlaceDto>) => void
  saving: boolean
}) {
  const [name, setName] = useState('')
  const [width, setWidth] = useState<number | ''>('')
  const [length, setLength] = useState<number | ''>('')
  const [environment, setEnvironment] = useState('')

  useResetOnOpen(isOpen, useCallback(() => {
    setName(item?.name ?? '')
    setWidth(item?.width ?? '')
    setLength(item?.length ?? '')
    setEnvironment(item?.environment ?? '')
  }, [item]))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Upravit místo' : 'Nové místo'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            name,
            width: width || undefined,
            length: length || undefined,
            environment: environment || undefined,
          })
        }}
      >
        <div className="space-y-4">
          <Input
            label="Název"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Šířka (m)"
              type="number"
              min={0}
              value={width}
              onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : '')}
            />
            <Input
              label="Délka (m)"
              type="number"
              min={0}
              value={length}
              onChange={(e) => setLength(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Prostředí</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">Neuvedeno</option>
              <option value="Indoor">Vnitřní</option>
              <option value="Outdoor">Venkovní</option>
            </select>
          </div>
        </div>
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
