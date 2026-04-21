import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Plus, Clock, Users, Pencil, RefreshCw, Search, X, ChevronDown, Eye, User, FileDown, LayoutGrid, List, ArrowUpDown, GripVertical, Check, ArrowRight, Tags } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { PdfOptionsModal } from '../../components/shared/PdfOptionsModal'
import type { PdfOptions } from '../../components/shared/PdfOptionsModal'
import { activitiesApi } from '../../api/activities.api'
import { tagsApi, ageGroupsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useActivitySelectionStore } from '../../store/activitySelectionStore'
import type { ActivityDto, TagDto } from '../../types/domain.types'
import { ActivityDetailModal, getDisplaySrc } from './ActivityDetailModal'

// ── Draggable activity card (grid view) ──────────────────────────────────────

function DraggableActivityCard({
  activity,
  isSelected,
  onToggleSelect,
  onDetail,
  onEdit,
  onPdf,
  canEdit,
  downloadingPdfId,
  instanceKey = '',
}: {
  activity: ActivityDto
  isSelected: boolean
  onToggleSelect: () => void
  onDetail: () => void
  onEdit: () => void
  onPdf: () => void
  canEdit: boolean
  downloadingPdfId: number | null
  instanceKey?: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `activity-card-${instanceKey}${activity.id}`,
    data: { type: 'activity-card', activity },
  })

  const thumbnail = activity.activityMedium?.find((m) => m.isThumbnail) ?? activity.activityMedium?.[0]
  const thumbnailSrc = thumbnail ? getDisplaySrc(thumbnail) : null
  const isSvg = thumbnailSrc != null && (thumbnailSrc.includes('image/svg+xml') || thumbnail?.name?.endsWith('.svg'))

  return (
    <div ref={setNodeRef} className={`relative ${isDragging ? 'opacity-40' : ''}`}>
    <Card
      className={`hover:shadow-md transition-shadow overflow-hidden cursor-pointer flex flex-col ${isSelected ? 'ring-2 ring-sky-400' : ''}`}
      onClick={onDetail}
    >
      {/* Drag handle + select button overlay */}
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        <button
          type="button"
          className="rounded bg-white/80 p-1 text-gray-400 hover:bg-white hover:text-gray-600 shadow-sm cursor-grab touch-none"
          title="Přetáhnout do výběru"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`rounded p-1 shadow-sm ${isSelected ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-white/80 text-gray-400 hover:bg-white hover:text-sky-600'}`}
          title={isSelected ? 'Odebrat z výběru' : 'Přidat do výběru'}
          onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
        >
          {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <div className="h-40 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={activity.name}
            className={`h-full w-full ${isSvg ? 'object-contain p-2' : 'object-cover'}`}
          />
        ) : (
          <svg className="h-16 w-16 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <path d="M7 17l3-3 2 2 4-4 3 3" />
          </svg>
        )}
      </div>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 truncate">{activity.name}</h3>
          <span
            title={activity.isDraft !== false ? 'Rozpracovaná' : 'Kompletní'}
            className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${activity.isDraft !== false ? 'bg-yellow-400' : 'bg-green-400'}`}
          />
        </div>

        {activity.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{activity.description}</p>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          {(activity.durationMin || activity.durationMax) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {activity.durationMin}–{activity.durationMax} min
            </span>
          )}
          {activity.personsMin != null && activity.personsMin > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {activity.personsMin}{activity.personsMax ? `–${activity.personsMax}` : '+'} hráčů
            </span>
          )}
          {activity.createdByUserName && (
            <span className="flex items-center gap-1 ml-auto">
              <User className="h-3 w-3" />
              {activity.createdByUserName}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onDetail() }}
          >
            <Eye className="h-3.5 w-3.5" />
            Detail
          </Button>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Upravit
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            loading={downloadingPdfId === activity.id}
            onClick={(e) => { e.stopPropagation(); onPdf() }}
          >
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

// ── Draggable activity row (list view) ───────────────────────────────────────

function DraggableActivityRow({
  activity,
  isSelected,
  onToggleSelect,
  onDetail,
  onEdit,
  onPdf,
  canEdit,
  instanceKey = '',
}: {
  activity: ActivityDto
  isSelected: boolean
  onToggleSelect: () => void
  onDetail: () => void
  onEdit: () => void
  onPdf: () => void
  canEdit: boolean
  instanceKey?: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `activity-row-${instanceKey}${activity.id}`,
    data: { type: 'activity-card', activity },
  })

  return (
    <tr ref={setNodeRef} className={`hover:bg-gray-50 cursor-pointer ${isDragging ? 'opacity-40' : ''} ${isSelected ? 'bg-sky-50' : ''}`} onClick={onDetail}>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="text-gray-300 hover:text-gray-500 cursor-grab touch-none"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`rounded p-0.5 ${isSelected ? 'text-sky-500 hover:text-sky-600' : 'text-gray-300 hover:text-sky-500'}`}
            title={isSelected ? 'Odebrat z výběru' : 'Přidat do výběru'}
            onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
          >
            {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </td>
      <td className="px-3 py-2">
        <span
          title={activity.isDraft !== false ? 'Rozpracovaná' : 'Kompletní'}
          className={`inline-block h-2.5 w-2.5 rounded-full ${activity.isDraft !== false ? 'bg-yellow-400' : 'bg-green-400'}`}
        />
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-gray-900">{activity.name}</div>
        {activity.description && (
          <div className="text-xs text-gray-400 line-clamp-1">{activity.description}</div>
        )}
      </td>
      <td className="px-3 py-2 text-gray-600 hidden sm:table-cell">
        {activity.durationMin || activity.durationMax ? `${activity.durationMin}–${activity.durationMax} min` : '–'}
      </td>
      <td className="px-3 py-2 text-gray-600 hidden md:table-cell">
        {activity.personsMin ? `${activity.personsMin}${activity.personsMax ? `–${activity.personsMax}` : '+'}` : '–'}
      </td>
      <td className="px-3 py-2 text-gray-500 hidden lg:table-cell">{activity.createdByUserName || '–'}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="rounded p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-600" title="Upravit">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onPdf() }} className="rounded p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-600" title="PDF">
            <FileDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Selected activities panel (sticky bottom) ────────────────────────────────

function SelectedActivitiesPanel() {
  const { selectedActivities, removeActivity, clearAll } = useActivitySelectionStore()
  const { isOver, setNodeRef } = useDroppable({ id: 'selected-activities-drop' })
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)

  if (selectedActivities.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={`fixed bottom-0 left-0 right-0 z-30 border-t-2 border-dashed transition-colors ${
          isOver ? 'border-sky-400 bg-sky-50/95' : 'border-gray-300 bg-gray-50/95'
        } backdrop-blur-sm px-4 py-3 text-center text-sm text-gray-400`}
      >
        {isOver ? 'Pusťte pro přidání do výběru' : 'Přetáhněte aktivitu sem nebo klikněte + pro výběr'}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-0 left-0 right-0 z-30 border-t-2 transition-colors ${
        isOver ? 'border-sky-400 bg-sky-50/95' : 'border-sky-300 bg-white/95'
      } backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.1)]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? '' : 'rotate-180'}`} />
          Vybrané aktivity ({selectedActivities.length})
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Odebrat vše
          </button>
          <Button
            size="sm"
            onClick={() => navigate('/trainings/new')}
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Použít v tréninku
          </Button>
        </div>
      </div>

      {/* List */}
      {expanded && (
        <div className="max-h-48 overflow-y-auto px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {selectedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-800"
              >
                <span className="truncate max-w-[200px]">{activity.name}</span>
                {(activity.durationMin || activity.durationMax) && (
                  <span className="text-xs text-sky-500">
                    {activity.durationMin}–{activity.durationMax}′
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeActivity(activity.id)}
                  className="ml-0.5 rounded-full p-0.5 text-sky-400 hover:bg-sky-100 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Drag overlay (ghost shown while dragging) ────────────────────────────────

function ActivityDragOverlay({ activity }: { activity: ActivityDto }) {
  return (
    <div className="rounded-lg border border-sky-300 bg-white px-3 py-2 shadow-lg text-sm font-medium text-gray-900 max-w-[250px] truncate">
      {activity.name}
    </div>
  )
}

// ── Sort options ──────────────────────────────────────────────────────────────

type SortKey = 'name-asc' | 'name-desc' | 'duration-asc' | 'duration-desc'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'name-asc', label: 'Název A→Z' },
  { value: 'name-desc', label: 'Název Z→A' },
  { value: 'duration-asc', label: 'Délka (nejkratší)' },
  { value: 'duration-desc', label: 'Délka (nejdelší)' },
]

function sortActivities(list: ActivityDto[], key: SortKey): ActivityDto[] {
  const sorted = [...list]
  switch (key) {
    case 'name-asc': return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'))
    case 'name-desc': return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'cs'))
    case 'duration-asc': return sorted.sort((a, b) => (a.durationMin || 0) - (b.durationMin || 0))
    case 'duration-desc': return sorted.sort((a, b) => (b.durationMin || 0) - (a.durationMin || 0))
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'draft' | 'complete'

export function ActivitiesPage() {
  const { isAdmin, user } = useAuthStore()
  const { selectedActivities, addActivity, removeActivity } = useActivitySelectionStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [validateAllResult, setValidateAllResult] = useState<{ total: number; validCount: number; draftCount: number } | null>(null)
  const [searchText, setSearchText] = useState('')

  // Status filter from URL
  const statusFilter = (searchParams.get('status') as StatusFilter) || 'all'
  const setStatusFilter = (value: StatusFilter) => {
    if (value === 'all') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', value)
    }
    setSearchParams(searchParams, { replace: true })
  }
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<number[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name-asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const groupByTag = searchParams.get('group') === 'tag'
  const setGroupByTag = (value: boolean) => {
    if (value) searchParams.set('group', 'tag')
    else searchParams.delete('group')
    setSearchParams(searchParams, { replace: true })
  }
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [ageGroupDropdownOpen, setAgeGroupDropdownOpen] = useState(false)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const ageGroupDropdownRef = useRef<HTMLDivElement>(null)
  const [detailActivityId, setDetailActivityId] = useState<number | null>(null)
  const [pdfTarget, setPdfTarget] = useState<ActivityDto | null>(null)
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null)
  const [draggingActivity, setDraggingActivity] = useState<ActivityDto | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  })

  const { data: allAgeGroups } = useQuery({
    queryKey: ['ageGroups'],
    queryFn: () => ageGroupsApi.getAll(),
  })

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) setTagDropdownOpen(false)
      if (ageGroupDropdownRef.current && !ageGroupDropdownRef.current.contains(e.target as Node)) setAgeGroupDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Unique authors for filter
  const authors = useMemo(() => {
    if (!activities) return []
    const names = activities.map((a) => a.createdByUserName).filter(Boolean) as string[]
    return [...new Set(names)].sort()
  }, [activities])

  const filteredActivities = useMemo(() => {
    if (!activities) return []
    const q = searchText.toLowerCase().trim()
    const filtered = activities.filter((a) => {
      if (q) {
        const nameMatch = a.name?.toLowerCase().includes(q)
        const descMatch = a.description?.toLowerCase().includes(q)
        const authorMatch = a.createdByUserName?.toLowerCase().includes(q)
        if (!nameMatch && !descMatch && !authorMatch) return false
      }
      if (!groupByTag && selectedTagIds.length > 0) {
        const activityTagIds = a.activityTags?.map((at) => at.tag?.id ?? at.tagId).filter(Boolean) as number[] ?? []
        if (!selectedTagIds.every((id) => activityTagIds.includes(id))) return false
      }
      if (selectedAgeGroupIds.length > 0) {
        const actAgIds = a.activityAgeGroups?.map((ag) => ag.ageGroup?.id ?? ag.ageGroupId).filter(Boolean) as number[] ?? []
        if (!selectedAgeGroupIds.some((id) => actAgIds.includes(id))) return false
      }
      if (selectedAuthor && a.createdByUserName !== selectedAuthor) return false
      if (statusFilter === 'draft' && a.isDraft === false) return false
      if (statusFilter === 'complete' && a.isDraft !== false) return false
      return true
    })
    return sortActivities(filtered, sortKey)
  }, [activities, searchText, selectedTagIds, selectedAgeGroupIds, selectedAuthor, sortKey, statusFilter, groupByTag])

  const sortedTags = useMemo(
    () => tags ? [...tags].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs')) : [],
    [tags]
  )

  const tagSections = useMemo(() => {
    if (!groupByTag || !sortedTags.length) return [] as { tag: TagDto | null; activities: ActivityDto[] }[]
    const hasSelection = selectedTagIds.length > 0
    const visibleTags = hasSelection
      ? sortedTags.filter((t) => selectedTagIds.includes(t.id))
      : sortedTags
    const rawSections = visibleTags.map((tag) => ({
      tag: tag as TagDto | null,
      activities: filteredActivities.filter((a) => {
        const ids = a.activityTags?.map((at) => at.tag?.id ?? at.tagId).filter(Boolean) as number[] ?? []
        return ids.includes(tag!.id)
      }),
    }))
    const sections = hasSelection ? rawSections : rawSections.filter((s) => s.activities.length > 0)
    if (!hasSelection) {
      const noTagActivities = filteredActivities.filter((a) => {
        const ids = a.activityTags?.map((at) => at.tag?.id ?? at.tagId).filter(Boolean) as number[] ?? []
        return ids.length === 0
      })
      if (noTagActivities.length > 0) {
        sections.push({ tag: null, activities: noTagActivities })
      }
    }
    return sections
  }, [groupByTag, sortedTags, selectedTagIds, filteredActivities])

  const validateAllMutation = useMutation({
    mutationFn: () => activitiesApi.validateAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setValidateAllResult(data)
    },
  })

  const handleDownloadPdf = useCallback(async (activity: ActivityDto, options: PdfOptions) => {
    setDownloadingPdfId(activity.id)
    setPdfTarget(null)
    try {
      await activitiesApi.downloadPdf(activity.id, activity.name, options)
    } finally {
      setDownloadingPdfId(null)
    }
  }, [])

  const canEdit = (a: ActivityDto) => isAdmin || (user && a.createdByUserId === user.id)
  const hasFilters = searchText || selectedTagIds.length > 0 || selectedAgeGroupIds.length > 0 || selectedAuthor || statusFilter !== 'all'
  const clearFilters = () => { setSearchText(''); setSelectedTagIds([]); setSelectedAgeGroupIds([]); setSelectedAuthor(''); setStatusFilter('all') }

  const selectedIds = useMemo(() => new Set(selectedActivities.map((a) => a.id)), [selectedActivities])

  const toggleSelect = useCallback((activity: ActivityDto) => {
    if (selectedIds.has(activity.id)) {
      removeActivity(activity.id)
    } else {
      addActivity(activity)
    }
  }, [selectedIds, addActivity, removeActivity])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activity = event.active.data.current?.activity as ActivityDto | undefined
    if (activity) setDraggingActivity(activity)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggingActivity(null)
    const { active, over } = event
    if (over?.id === 'selected-activities-drop' && active.data.current?.type === 'activity-card') {
      const activity = active.data.current.activity as ActivityDto
      addActivity(activity)
    }
  }, [addActivity])

  if (isLoading) return <LoadingSpinner />

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="pb-20">
        <PageHeader
          title="Aktivity"
          description="Knihovna florbalových aktivit a cvičení"
          action={
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={validateAllMutation.isPending}
                  onClick={() => validateAllMutation.mutate()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Zkontrolovat vše
                </Button>
              )}
              <Button size="sm" onClick={() => navigate('/activities/new')}>
                <Plus className="h-4 w-4" />
                Nová aktivita
              </Button>
            </div>
          }
        />

        {/* Filters row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Hledat (název, popis, autor)…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tag multiselect */}
          <div ref={tagDropdownRef} className="relative min-w-[180px]">
            <button
              onClick={() => { setTagDropdownOpen(!tagDropdownOpen); setAgeGroupDropdownOpen(false) }}
              className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="truncate">
                {selectedTagIds.length === 0
                  ? 'Filtrovat podle tagů'
                  : `${selectedTagIds.length} ${selectedTagIds.length === 1 ? 'tag' : selectedTagIds.length < 5 ? 'tagy' : 'tagů'}`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
            </button>
            {tagDropdownOpen && tags && tags.length > 0 && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {selectedTagIds.length > 0 && (
                  <button
                    onClick={() => setSelectedTagIds([])}
                    className="w-full border-b border-gray-100 px-3 py-1.5 text-left text-xs text-sky-600 hover:bg-sky-50"
                  >
                    Zrušit výběr
                  </button>
                )}
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <label key={tag.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setSelectedTagIds((prev) =>
                            selected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                          )
                        }
                        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm">
                        {tag.color && (
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        )}
                        {tag.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Age group filter */}
          {allAgeGroups && allAgeGroups.length > 0 && (
            <div ref={ageGroupDropdownRef} className="relative min-w-[180px]">
              <button
                onClick={() => { setAgeGroupDropdownOpen(!ageGroupDropdownOpen); setTagDropdownOpen(false) }}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="truncate">
                  {selectedAgeGroupIds.length === 0 ? 'Věk. kategorie' : `Věk. kat. (${selectedAgeGroupIds.length})`}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
              </button>
              {ageGroupDropdownOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {selectedAgeGroupIds.length > 0 && (
                    <button onClick={() => setSelectedAgeGroupIds([])} className="w-full border-b border-gray-100 px-3 py-1.5 text-left text-xs text-sky-600 hover:bg-sky-50">
                      Zrušit výběr
                    </button>
                  )}
                  {allAgeGroups.map((ag) => {
                    const selected = selectedAgeGroupIds.includes(ag.id)
                    return (
                      <label key={ag.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                        <input type="checkbox" checked={selected} onChange={() => setSelectedAgeGroupIds((prev) => selected ? prev.filter((id) => id !== ag.id) : [...prev, ag.id])} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                        <span className="text-sm">{ag.name}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Author filter */}
          {authors.length > 0 && (
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="">Všichni autoři</option>
              {authors.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            <option value="all">Všechny stavy</option>
            <option value="complete">Kompletní</option>
            <option value="draft">Rozpracované</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* View toggle + clear */}
          <div className="flex items-center gap-1 ml-auto">
            {hasFilters && (
              <button onClick={clearFilters} className="mr-2 text-xs text-sky-600 hover:text-sky-800">Zrušit filtry</button>
            )}
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 ${viewMode === 'grid' ? 'bg-sky-100 text-sky-700' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Karty"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-sky-100 text-sky-700' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Seznam"
            >
              <List className="h-4 w-4" />
            </button>
            <span className="mx-1 h-4 w-px bg-gray-300" />
            <button
              onClick={() => setGroupByTag(!groupByTag)}
              className={`rounded p-1.5 ${groupByTag ? 'bg-sky-100 text-sky-700' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Seskupit podle tagů"
            >
              <Tags className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tag switches (by-tag view) */}
        {groupByTag && sortedTags.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <span className="mr-1 text-xs font-medium text-gray-500">Tagy:</span>
            {sortedTags.map((tag) => {
              const active = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTagIds((prev) =>
                      active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    )
                  }
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                    active
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300 hover:bg-sky-50'
                  }`}
                >
                  {tag.color && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: active ? 'white' : tag.color }}
                    />
                  )}
                  {tag.name}
                </button>
              )
            })}
            {selectedTagIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTagIds([])}
                className="ml-auto text-xs text-sky-600 hover:text-sky-800"
              >
                Zrušit výběr
              </button>
            )}
          </div>
        )}

        {groupByTag ? (
          tagSections.length === 0 ? (
            <EmptyState
              title={hasFilters ? 'Žádné výsledky' : 'Žádné aktivity'}
              description={hasFilters ? 'Zkuste změnit kritéria vyhledávání.' : 'Zatím nebyla vytvořena žádná aktivita.'}
              action={
                hasFilters ? (
                  <Button size="sm" variant="outline" onClick={clearFilters}>Zrušit filtry</Button>
                ) : (
                  <Button size="sm" onClick={() => navigate('/activities/new')}>
                    <Plus className="h-4 w-4" />
                    Vytvořit první aktivitu
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-8">
              {tagSections.map((section) => {
                const { tag, activities: sectionActivities } = section
                const sectionKey = tag?.id ?? 'no-tag'
                const instanceKey = `tag-${sectionKey}-`
                return (
                  <section key={sectionKey}>
                    <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                      {tag?.color && (
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      <h2 className="text-base font-semibold text-gray-800">
                        {tag?.name ?? 'Bez tagu'}
                      </h2>
                      <span className="text-sm text-gray-400">({sectionActivities.length})</span>
                    </div>
                    {sectionActivities.length === 0 ? (
                      <div className="text-sm italic text-gray-400">Žádné aktivity</div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {sectionActivities.map((activity) => (
                          <DraggableActivityCard
                            key={activity.id}
                            instanceKey={instanceKey}
                            activity={activity}
                            isSelected={selectedIds.has(activity.id)}
                            onToggleSelect={() => toggleSelect(activity)}
                            onDetail={() => setDetailActivityId(activity.id)}
                            onEdit={() => navigate(`/activities/${activity.id}/edit`)}
                            onPdf={() => setPdfTarget(activity)}
                            canEdit={!!canEdit(activity)}
                            downloadingPdfId={downloadingPdfId}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left font-medium text-gray-600 w-16"></th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 w-5"></th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Název</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Délka</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 hidden md:table-cell">Hráči</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 hidden lg:table-cell">Autor</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">Akce</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sectionActivities.map((activity) => (
                              <DraggableActivityRow
                                key={activity.id}
                                instanceKey={instanceKey}
                                activity={activity}
                                isSelected={selectedIds.has(activity.id)}
                                onToggleSelect={() => toggleSelect(activity)}
                                onDetail={() => setDetailActivityId(activity.id)}
                                onEdit={() => navigate(`/activities/${activity.id}/edit`)}
                                onPdf={() => setPdfTarget(activity)}
                                canEdit={!!canEdit(activity)}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )
        ) : !filteredActivities.length ? (
          <EmptyState
            title={hasFilters ? 'Žádné výsledky' : 'Žádné aktivity'}
            description={hasFilters ? 'Zkuste změnit kritéria vyhledávání.' : 'Zatím nebyla vytvořena žádná aktivita.'}
            action={
              hasFilters ? (
                <Button size="sm" variant="outline" onClick={clearFilters}>Zrušit filtry</Button>
              ) : (
                <Button size="sm" onClick={() => navigate('/activities/new')}>
                  <Plus className="h-4 w-4" />
                  Vytvořit první aktivitu
                </Button>
              )
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((activity) => (
              <DraggableActivityCard
                key={activity.id}
                activity={activity}
                isSelected={selectedIds.has(activity.id)}
                onToggleSelect={() => toggleSelect(activity)}
                onDetail={() => setDetailActivityId(activity.id)}
                onEdit={() => navigate(`/activities/${activity.id}/edit`)}
                onPdf={() => setPdfTarget(activity)}
                canEdit={!!canEdit(activity)}
                downloadingPdfId={downloadingPdfId}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 w-16"></th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-5"></th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Název</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Délka</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 hidden md:table-cell">Hráči</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 hidden lg:table-cell">Autor</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActivities.map((activity) => (
                  <DraggableActivityRow
                    key={activity.id}
                    activity={activity}
                    isSelected={selectedIds.has(activity.id)}
                    onToggleSelect={() => toggleSelect(activity)}
                    onDetail={() => setDetailActivityId(activity.id)}
                    onEdit={() => navigate(`/activities/${activity.id}/edit`)}
                    onPdf={() => setPdfTarget(activity)}
                    canEdit={!!canEdit(activity)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ActivityDetailModal activityId={detailActivityId} onClose={() => setDetailActivityId(null)} />

        {validateAllResult && (
          <Modal isOpen={true} onClose={() => setValidateAllResult(null)} title="Výsledek kontroly všech aktivit" maxWidth="sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Celkem aktivit:</span><strong>{validateAllResult.total}</strong></div>
              <div className="flex justify-between"><span className="text-green-600">Kompletní:</span><strong className="text-green-700">{validateAllResult.validCount}</strong></div>
              <div className="flex justify-between"><span className="text-yellow-600">Rozpracované:</span><strong className="text-yellow-700">{validateAllResult.draftCount}</strong></div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => setValidateAllResult(null)}>Zavřít</Button>
            </div>
          </Modal>
        )}

        {pdfTarget && (
          <PdfOptionsModal
            isOpen={true}
            onClose={() => setPdfTarget(null)}
            onConfirm={(options) => handleDownloadPdf(pdfTarget, options)}
            loading={downloadingPdfId === pdfTarget.id}
            type="activity"
          />
        )}
      </div>

      <SelectedActivitiesPanel />

      <DragOverlay>
        {draggingActivity && <ActivityDragOverlay activity={draggingActivity} />}
      </DragOverlay>
    </DndContext>
  )
}
