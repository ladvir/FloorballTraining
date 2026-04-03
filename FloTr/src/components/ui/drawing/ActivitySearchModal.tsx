import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { X, Search, Loader2 } from 'lucide-react'
import { activitiesApi } from '../../../api/activities.api'
import type { ActivityDto } from '../../../types/domain.types'

interface ActivitySearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (activity: ActivityDto) => void
  saving?: boolean
}

function matchesSearch(activity: ActivityDto, query: string): boolean {
  const q = query.toLowerCase()
  if (activity.name?.toLowerCase().includes(q)) return true
  if (activity.description?.toLowerCase().includes(q)) return true
  if (activity.createdByUserName?.toLowerCase().includes(q)) return true
  if (activity.activityTags?.some(at => at.tag?.name?.toLowerCase().includes(q))) return true
  return false
}

export function ActivitySearchModal({ isOpen, onClose, onSelect, saving }: ActivitySearchModalProps) {
  const [search, setSearch] = useState('')

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: activitiesApi.getAll,
    enabled: isOpen,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return activities
    return activities.filter(a => matchesSearch(a, search.trim()))
  }, [activities, search])

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
          <h2 className="text-base font-semibold text-gray-900">Přidat kresbu k aktivitě</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

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
            <div className="py-8 text-center text-sm text-gray-500">
              {search.trim() ? 'Žádné aktivity neodpovídají hledání.' : 'Žádné aktivity.'}
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

        {/* Footer with count */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-2 text-xs text-gray-400">
          {!isLoading && `${filtered.length} z ${activities.length} aktivit`}
        </div>
      </div>
    </div>,
    document.body
  )
}
