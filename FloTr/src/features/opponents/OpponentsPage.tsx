import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { opponentsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { OpponentDto } from '../../types/domain.types'

export function OpponentsPage() {
  const { t } = useTranslation()
  const { activeClubId } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: opponents, isLoading } = useQuery({
    queryKey: ['opponents', activeClubId],
    queryFn: () => opponentsApi.getAll(activeClubId),
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OpponentDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<OpponentDto | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['opponents'] })

  const createMutation = useMutation({
    mutationFn: (name: string) => opponentsApi.create({ name, clubId: activeClubId ?? undefined }),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => opponentsApi.update(id, name),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => opponentsApi.delete(id),
    onSuccess: () => {
      invalidate()
      setDeleteConfirm(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (item: OpponentDto) => {
    setEditing(item)
    setModalOpen(true)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title={t('opponents.title')}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('opponents.newOpponent')}
          </Button>
        }
      />
      {!opponents?.length ? (
        <EmptyState
          title={t('opponents.emptyTitle')}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('opponents.newOpponent')}
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">{t('opponents.colName')}</th>
                <th className="px-4 py-3 text-right w-24">{t('places.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opponents.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(o)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title={t('common.edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(o)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OpponentFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        item={editing}
        onSave={(name) => {
          if (editing) updateMutation.mutate({ id: editing.id, name })
          else createMutation.mutate(name)
        }}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('opponents.deleteConfirm')}
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          {t('opponents.deleteConfirm')} <strong>{deleteConfirm?.name}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            disabled={deleteMutation.isPending}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function OpponentFormModal({
  isOpen,
  onClose,
  item,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  item: OpponentDto | null
  onSave: (name: string) => void
  saving: boolean
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')

  useResetOnOpen(
    isOpen,
    useCallback(() => setName(item?.name ?? ''), [item])
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? t('opponents.editOpponent') : t('opponents.newOpponent')}
      maxWidth="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onSave(name.trim())
        }}
      >
        <Input
          label={t('opponents.formName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" size="sm" disabled={!name.trim() || saving}>
            {saving ? t('common.saving') : item ? t('common.save') : t('common.create')}
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
