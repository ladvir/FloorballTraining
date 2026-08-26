import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Plus, X } from 'lucide-react'
import { tagsApi } from '../../api/index'
import type { TagDto } from '../../types/domain.types'

interface Props {
  tags: TagDto[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

/** Multi-select tag picker: search/filter an existing tag list, or create a new one if no match — mirrors ActivityPicker's search-or-create pattern. */
export function TagMultiPicker({ tags, selectedIds, onChange }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      onChange([...selectedIds, created.id])
      setSearch('')
    },
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id))
  const filtered = tags
    .filter((tag) => !selectedIds.includes(tag.id))
    .filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
  const trimmed = search.trim()
  const canCreate =
    trimmed.length > 0 && !tags.some((tag) => tag.name.toLowerCase() === trimmed.toLowerCase())

  const toggle = (id: number) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full border border-sky-500 bg-sky-500 py-1 pl-3 pr-1 text-sm text-white"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => toggle(tag.id)}
              className="rounded-full p-0.5 hover:bg-sky-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {selectedTags.length === 0 && (
          <p className="text-sm text-gray-400">{t('tags.noneSelected')}</p>
        )}
      </div>

      <div ref={ref} className="relative mt-2 max-w-xs">
        <button
          type="button"
          onClick={() => {
            setOpen(!open)
            setSearch('')
          }}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 hover:border-sky-300 focus:border-sky-400 focus:outline-none"
        >
          <span className="truncate">{t('tags.addTag')}</span>
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 p-2">
              <input
                autoFocus
                type="text"
                placeholder={t('tags.searchOrCreatePlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    toggle(tag.id)
                    setSearch('')
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-sky-50"
                >
                  {tag.name}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-400">
                  {trimmed ? t('tags.noneFound') : t('tags.allSelected')}
                </p>
              )}
              {canCreate && (
                <button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={() => createMutation.mutate(trimmed)}
                  className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-sky-600 hover:bg-sky-50 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                  {createMutation.isPending
                    ? t('common.saving')
                    : t('tags.createNew', { name: trimmed })}
                </button>
              )}
              {createMutation.isError && (
                <p className="px-3 pb-2 text-xs text-red-500">{t('tags.saveFailed')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
