import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { tagsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TagDto } from '../../types/domain.types'

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#6b7280',
]

export function TagsPage() {
  const { isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: tags, isLoading } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TagDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<TagDto | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Partial<TagDto>) => tagsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tags'] }); setModalOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TagDto> }) => tagsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tags'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      // Check if the tag was actually deleted (backend silently ignores if in use)
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setDeleteConfirm(null)
      setDeleteError(null)
    },
  })

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (tag: TagDto) => { setEditing(tag); setModalOpen(true) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Tagy"
        action={
          isAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />Nový tag
            </Button>
          ) : undefined
        }
      />
      {!tags?.length ? (
        <EmptyState
          title="Žádné tagy"
          action={
            isAdmin ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />Vytvořit první tag
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Barva</th>
                <th className="px-4 py-3 text-left">Název</th>
                <th className="px-4 py-3 text-left">Tréninkový cíl</th>
                {isAdmin && <th className="px-4 py-3 text-right w-24">Akce</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: tag.color ?? '#6b7280' }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{tag.name}</td>
                  <td className="px-4 py-3 text-gray-600">{tag.isTrainingGoal ? 'Ano' : '–'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(tag)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Upravit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeleteError(null); setDeleteConfirm(tag) }}
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
          <TagFormModal
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setEditing(null) }}
            tag={editing}
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
            onClose={() => { setDeleteConfirm(null); setDeleteError(null) }}
            title="Smazat tag"
            maxWidth="sm"
          >
            <p className="text-sm text-gray-600 mb-2">
              Opravdu chcete smazat tag <strong>{deleteConfirm?.name}</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Tag nelze smazat, pokud je používán v trénincích, aktivitách nebo jako nadřazený tag.
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 mb-4">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setDeleteConfirm(null); setDeleteError(null) }}>Zrušit</Button>
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

function TagFormModal({
  isOpen,
  onClose,
  tag,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  tag: TagDto | null
  onSave: (data: Partial<TagDto>) => void
  saving: boolean
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [isTrainingGoal, setIsTrainingGoal] = useState(false)
  const [parentTagId, setParentTagId] = useState<number | undefined>(undefined)

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })

  useResetOnOpen(isOpen, useCallback(() => {
    if (tag) {
      setName(tag.name)
      setColor(tag.color ?? '#6b7280')
      setIsTrainingGoal(tag.isTrainingGoal ?? false)
      setParentTagId(tag.parentTagId)
    } else {
      setName('')
      setColor('#3b82f6')
      setIsTrainingGoal(false)
      setParentTagId(undefined)
    }
  }, [tag]))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tag ? 'Upravit tag' : 'Nový tag'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ name, color, isTrainingGoal, parentTagId: parentTagId || undefined })
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Barva</label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border-0 p-0"
                title="Vlastní barva"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nadřazený tag</label>
            <select
              value={parentTagId ?? ''}
              onChange={(e) => setParentTagId(e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">Žádný</option>
              {allTags?.filter((t) => t.id !== tag?.id).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTrainingGoal}
              onChange={(e) => setIsTrainingGoal(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
            />
            <span className="text-sm text-gray-700">Tréninkový cíl</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Náhled:</span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {name || 'Tag'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Zrušit</Button>
          <Button type="submit" size="sm" disabled={!name.trim() || saving}>
            {saving ? 'Ukládání…' : tag ? 'Uložit' : 'Vytvořit'}
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
