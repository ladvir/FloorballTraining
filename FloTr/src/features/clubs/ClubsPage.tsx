import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { clubsApi, teamsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { ClubDto, TeamDto } from '../../types/domain.types'

export function ClubsPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: clubs, isLoading } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })
  const { data: allTeams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClubDto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ClubDto | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Partial<ClubDto>) => clubsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clubs'] }); setModalOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ClubDto>) => clubsApi.update(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clubs'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clubsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clubs'] }); setDeleteConfirm(null) },
  })

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (club: ClubDto) => { setEditing(club); setModalOpen(true) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Kluby"
        action={
          isAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />Nový klub
            </Button>
          ) : undefined
        }
      />
      {!clubs?.length ? (
        <EmptyState
          title="Žádné kluby"
          description="Zatím nebyl vytvořen žádný klub."
          action={
            isAdmin ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />Vytvořit první klub
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const clubTeams = allTeams?.filter((t) => t.clubId === club.id) ?? []
            return (
              <Card key={club.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <h3 className="font-medium text-gray-900">{club.name}</h3>
                  {club.description && <p className="mt-1 text-sm text-gray-500">{club.description}</p>}

                  {/* Club teams */}
                  {clubTeams.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Týmy ({clubTeams.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {clubTeams.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => navigate(`/teams/${t.id}/edit`)}
                            className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                          >
                            {t.name}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-3 flex gap-1">
                      <button
                        onClick={() => openEdit(club)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Upravit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(club)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Smazat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {isAdmin && (
        <>
          <ClubFormModal
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setEditing(null) }}
            club={editing}
            clubTeams={editing ? (allTeams?.filter((t) => t.clubId === editing.id) ?? []) : []}
            onNavigateTeam={(path) => { setModalOpen(false); setEditing(null); navigate(path) }}
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
            title="Smazat klub"
            maxWidth="sm"
          >
            <p className="text-sm text-gray-600 mb-4">
              Opravdu chcete smazat klub <strong>{deleteConfirm?.name}</strong>?
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

function ClubFormModal({
  isOpen,
  onClose,
  club,
  clubTeams,
  onNavigateTeam,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  club: ClubDto | null
  clubTeams: TeamDto[]
  onNavigateTeam: (path: string) => void
  onSave: (data: Partial<ClubDto>) => void
  saving: boolean
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useResetOnOpen(isOpen, useCallback(() => { setName(club?.name ?? ''); setDescription(club?.description ?? '') }, [club]))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={club ? 'Upravit klub' : 'Nový klub'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ name, description: description || undefined })
        }}
      >
        <div className="space-y-4">
          <Input label="Název" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Popis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Teams section — only when editing */}
          {club && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Týmy ({clubTeams.length})</label>
                <Button type="button" size="sm" variant="outline" onClick={() => onNavigateTeam('/teams/new')}>
                  <Plus className="h-3.5 w-3.5" />Nový tým
                </Button>
              </div>
              {clubTeams.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">Klub zatím nemá žádné týmy.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Název</th>
                        <th className="px-3 py-2 text-left">Věková skupina</th>
                        <th className="px-3 py-2 text-right w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clubTeams.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{t.name}</td>
                          <td className="px-3 py-2 text-gray-600">{t.ageGroup?.name ?? '–'}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => onNavigateTeam(`/teams/${t.id}/edit`)}
                              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Upravit tým"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Zrušit</Button>
          <Button type="submit" size="sm" disabled={!name.trim() || saving}>
            {saving ? 'Ukládání…' : club ? 'Uložit' : 'Vytvořit'}
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
