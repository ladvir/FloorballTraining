import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { X, Search, Loader2, Plus, AlertTriangle } from 'lucide-react'
import { activitiesApi } from '../../../api/activities.api'
import type { ActivityDto } from '../../../types/domain.types'

export interface DrawingData {
  stateJson: string
  svgString: string
}

interface ActivitySearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (activity: ActivityDto) => void
  saving?: boolean
  /** When provided, enables "create new activity" with the drawing attached */
  drawingData?: DrawingData
  /** Called after a new activity is created (instead of onSelect) */
  onCreated?: (activity: ActivityDto) => void
}

function matchesSearch(activity: ActivityDto, query: string): boolean {
  const q = query.toLowerCase()
  if (activity.name?.toLowerCase().includes(q)) return true
  if (activity.description?.toLowerCase().includes(q)) return true
  if (activity.createdByUserName?.toLowerCase().includes(q)) return true
  if (activity.activityTags?.some(at => at.tag?.name?.toLowerCase().includes(q))) return true
  return false
}

export function ActivitySearchModal({ isOpen, onClose, onSelect, saving, drawingData, onCreated }: ActivitySearchModalProps) {
  const [search, setSearch] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: activitiesApi.getAll,
    enabled: isOpen,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return activities
    return activities.filter(a => matchesSearch(a, search.trim()))
  }, [activities, search])

  const trimmedNew = newName.trim()
  const duplicate = trimmedNew.length > 0
    ? activities.find((a) => a.name.toLowerCase() === trimmedNew.toLowerCase())
    : undefined

  const handleCreate = async () => {
    if (!trimmedNew || duplicate || !drawingData) return
    setCreating(true)
    setCreateError(null)
    try {
      const newActivity = await activitiesApi.create({ name: trimmedNew })
      await activitiesApi.addImage(newActivity.id, {
        name: 'kresba.svg',
        data: drawingData.stateJson,
        preview: drawingData.svgString,
        isThumbnail: true,
      })
      await queryClient.invalidateQueries({ queryKey: ['activities'] })
      setCreateMode(false)
      setNewName('')
      if (onCreated) {
        onCreated(newActivity)
      } else {
        onSelect(newActivity)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Nepodařilo se vytvořit aktivitu.'
      setCreateError(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleStartCreate = () => {
    setNewName(search.trim())
    setCreateMode(true)
    setCreateError(null)
  }

  const handleCancelCreate = () => {
    setCreateMode(false)
    setNewName('')
    setCreateError(null)
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-lg flex max-h-[calc(100vh-2rem)] flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {createMode ? 'Vytvořit novou aktivitu' : 'Přidat kresbu k aktivitě'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {createMode ? (
          /* ── Create new activity mode ── */
          <div className="px-5 py-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Název aktivity</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setCreateError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
                  placeholder="Zadejte název nové aktivity"
                  className={`w-full rounded-lg border py-2 px-3 text-sm focus:outline-none focus:ring-1 ${
                    duplicate
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
                  }`}
                  autoFocus
                />
                {duplicate && (
                  <p className="mt-1 text-xs text-red-600">
                    Aktivita „{duplicate.name}" již existuje.
                  </p>
                )}
              </div>
              {createError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancelCreate}
                disabled={creating}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Zpět
              </button>
              <button
                onClick={handleCreate}
                disabled={!trimmedNew || !!duplicate || creating}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Vytvořit aktivitu
              </button>
            </div>
          </div>
        ) : (
          /* ── Search mode ── */
          <>
            {/* Search input */}
            <div className="border-b border-gray-100 px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hledat podle názvu, popisu, autora nebo tagu..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto px-5 py-3" style={{ maxHeight: '400px' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Načítání aktivit...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">
                    {search.trim() ? 'Žádné aktivity neodpovídají hledání.' : 'Žádné aktivity.'}
                  </p>
                  {drawingData && (
                    <button
                      onClick={handleStartCreate}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
                    >
                      <Plus className="h-4 w-4" />
                      Vytvořit novou aktivitu{search.trim() ? ` „${search.trim()}"` : ''}
                    </button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filtered.map((activity) => (
                    <li key={activity.id}>
                      <button
                        onClick={() => onSelect(activity)}
                        disabled={saving}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        {activity.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 px-5 py-2">
              <span className="text-xs text-gray-400">
                {!isLoading && `${filtered.length} z ${activities.length} aktivit`}
              </span>
              {drawingData && filtered.length > 0 && (
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1 text-xs font-medium text-sky-500 hover:text-sky-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Vytvořit novou aktivitu
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
