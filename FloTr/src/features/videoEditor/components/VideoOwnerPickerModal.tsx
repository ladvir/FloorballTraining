import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { X, Search, Loader2 } from 'lucide-react'
import { trainingsApi } from '../../../api/trainings.api'
import { activitiesApi } from '../../../api/activities.api'
import { appointmentsApi } from '../../../api/index'
import { cn } from '../../../utils/cn'
import type { VideoOwnerKind } from '../../../types/domain.types'

interface VideoOwnerPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (ownerKind: VideoOwnerKind, ownerId: number) => void
  saving?: boolean
}

const KINDS: VideoOwnerKind[] = ['trainings', 'activities', 'appointments']

/** Lets a coach pick which Training/Activity/Appointment a locally-selected video should be
 *  uploaded and attached to before its analysis can be saved (#140). */
export function VideoOwnerPickerModal({
  isOpen,
  onClose,
  onSelect,
  saving,
}: VideoOwnerPickerModalProps) {
  const { t } = useTranslation()
  const [kind, setKind] = useState<VideoOwnerKind>('trainings')
  const [search, setSearch] = useState('')

  const trainingsQuery = useQuery({
    queryKey: ['trainings-all'],
    queryFn: trainingsApi.getAll,
    enabled: isOpen && kind === 'trainings',
  })
  const activitiesQuery = useQuery({
    queryKey: ['activities'],
    queryFn: activitiesApi.getAll,
    enabled: isOpen && kind === 'activities',
  })
  const appointmentsQuery = useQuery({
    queryKey: ['appointments-all'],
    queryFn: () => appointmentsApi.getAll(),
    enabled: isOpen && kind === 'appointments',
  })

  const { items, isLoading } = useMemo(() => {
    if (kind === 'trainings') {
      return {
        items: (trainingsQuery.data ?? []).map((tr) => ({ id: tr.id, label: tr.name })),
        isLoading: trainingsQuery.isLoading,
      }
    }
    if (kind === 'activities') {
      return {
        items: (activitiesQuery.data ?? []).map((a) => ({ id: a.id, label: a.name })),
        isLoading: activitiesQuery.isLoading,
      }
    }
    return {
      items: (appointmentsQuery.data ?? []).map((ap) => ({
        id: ap.id,
        label: `${new Date(ap.start).toLocaleDateString()} — ${ap.name || ap.trainingName || t('nav.appointments')}`,
      })),
      isLoading: appointmentsQuery.isLoading,
    }
  }, [
    kind,
    trainingsQuery.data,
    trainingsQuery.isLoading,
    activitiesQuery.data,
    activitiesQuery.isLoading,
    appointmentsQuery.data,
    appointmentsQuery.isLoading,
    t,
  ])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.label.toLowerCase().includes(q))
  }, [items, search])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {t('videoEditor.attachVideoTitle')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-shrink-0 gap-1 border-b border-gray-100 px-5 py-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                kind === k ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {t(`nav.${k}`)}
            </button>
          ))}
        </div>

        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-3" style={{ maxHeight: '360px' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('common.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{t('common.noResults')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onSelect(kind, item.id)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
