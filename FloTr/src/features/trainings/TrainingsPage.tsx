import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Clock, Users, Pencil, CalendarPlus, FileDown, RefreshCw, User, Eye, Dumbbell, Target, Search, X, ChevronDown, LayoutGrid, List, ArrowUpDown, Copy, Tags } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { PdfOptionsModal } from '../../components/shared/PdfOptionsModal'
import type { PdfOptions } from '../../components/shared/PdfOptionsModal'
import { ScheduleTrainingModal } from './ScheduleTrainingModal'
import { trainingsApi } from '../../api/trainings.api'
import { tagsApi, ageGroupsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { TrainingDto, TagDto } from '../../types/domain.types'

// ── Detail Modal ──────────────────────────────────────────────────────────────

function TrainingDetailModal({ trainingId, onClose, onCopy, copying }: {
  trainingId: number | null
  onClose: () => void
  onCopy?: (training: TrainingDto) => void
  copying?: boolean
}) {
  const { data: training, isLoading } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: () => trainingsApi.getById(trainingId!),
    enabled: trainingId != null,
  })

  if (!trainingId) return null

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Načítání…" maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  }

  if (!training) return null

  const envLabels: Record<number, string> = { 0: 'Kdekoliv', 1: 'Hala', 2: 'Venku' }
  const difficultyLabels = ['', 'Začátečník', 'Mírně pokročilý', 'Pokročilý', 'Expert']
  const intensityLabels = ['', 'Nízká', 'Střední', 'Vysoká', 'Maximální']

  const goals = [training.trainingGoal1, training.trainingGoal2, training.trainingGoal3].filter(Boolean)
  const ageGroups = training.trainingAgeGroups?.map((ag) => ag.name ?? ag.description).filter(Boolean) ?? []
  const parts = training.trainingParts ?? []

  return (
    <Modal isOpen={true} onClose={onClose} title={training.name} maxWidth="lg">
      <div className="space-y-4">
        {/* Status + author */}
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`} />
          <span className="text-sm text-gray-600">{training.isDraft ? 'Rozpracovaný' : 'Kompletní'}</span>
          {training.createdByUserName && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3 w-3" />
              {training.createdByUserName}
            </span>
          )}
        </div>

        {/* Description */}
        {training.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Popis</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.description}</p>
          </div>
        )}

        {/* Properties */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {training.duration > 0 && (
            <div>
              <p className="text-xs text-gray-400">Trvání</p>
              <p className="text-sm font-medium">{training.duration} min</p>
            </div>
          )}
          {training.personsMin != null && training.personsMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">Hráči</p>
              <p className="text-sm font-medium">{training.personsMin}{training.personsMax ? `–${training.personsMax}` : '+'}</p>
            </div>
          )}
          {(training.goaliesMin != null && training.goaliesMin > 0) && (
            <div>
              <p className="text-xs text-gray-400">Brankáři</p>
              <p className="text-sm font-medium">{training.goaliesMin}{training.goaliesMax ? `–${training.goaliesMax}` : '+'}</p>
            </div>
          )}
          {training.difficulty != null && training.difficulty > 0 && (
            <div>
              <p className="text-xs text-gray-400">Obtížnost</p>
              <p className="text-sm font-medium">{difficultyLabels[training.difficulty] || training.difficulty}</p>
            </div>
          )}
          {training.intensity != null && training.intensity > 0 && (
            <div>
              <p className="text-xs text-gray-400">Intenzita</p>
              <p className="text-sm font-medium">{intensityLabels[training.intensity] || training.intensity}</p>
            </div>
          )}
          {training.environment != null && (
            <div>
              <p className="text-xs text-gray-400">Prostředí</p>
              <p className="text-sm font-medium">{envLabels[training.environment] ?? training.environment}</p>
            </div>
          )}
        </div>

        {/* Training goals */}
        {goals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Cíle tréninku</h4>
            <div className="flex flex-wrap gap-1">
              {goals.map((g) => (
                <span key={g!.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700">
                  <Target className="h-3 w-3" />
                  {g!.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Age groups */}
        {ageGroups.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Věkové kategorie</h4>
            <div className="flex flex-wrap gap-1">
              {ageGroups.map((name, i) => (
                <Badge key={i} variant="default">{name}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {training.commentBefore && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Poznámka před tréninkem</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.commentBefore}</p>
          </div>
        )}
        {training.commentAfter && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Poznámka po tréninku</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{training.commentAfter}</p>
          </div>
        )}

        {/* Training parts */}
        {parts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Části tréninku</h4>
            <div className="space-y-2">
              {parts.map((part, idx) => (
                <div key={part.id || idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {part.name || `Část ${idx + 1}`}
                    </span>
                    <span className="text-xs text-gray-400">{part.duration} min</span>
                  </div>
                  {part.description && (
                    <p className="text-xs text-gray-500 mb-2">{part.description}</p>
                  )}
                  {part.trainingGroups && part.trainingGroups.length > 0 && (
                    <div className="space-y-1">
                      {part.trainingGroups.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-2 text-xs text-gray-600">
                          <Dumbbell className="h-3 w-3 text-gray-400" />
                          <span>{group.activity?.name || '(bez aktivity)'}</span>
                          {(group.personsMin != null && group.personsMin > 0) && (
                            <span className="text-gray-400">
                              ({group.personsMin}{group.personsMax ? `–${group.personsMax}` : '+'} hráčů)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {training.validationErrors && training.validationErrors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">Chyby validace</h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {training.validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {onCopy && (
          <Button
            size="sm"
            variant="outline"
            loading={copying}
            onClick={() => onCopy(training)}
            title="Vytvořit kopii tohoto tréninku"
          >
            <Copy className="h-3.5 w-3.5" />
            Kopírovat
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
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

function sortTrainings(list: TrainingDto[], key: SortKey): TrainingDto[] {
  const sorted = [...list]
  switch (key) {
    case 'name-asc': return sorted.sort((a, b) => a.name.localeCompare(b.name, 'cs'))
    case 'name-desc': return sorted.sort((a, b) => b.name.localeCompare(a.name, 'cs'))
    case 'duration-asc': return sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0))
    case 'duration-desc': return sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0))
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'draft' | 'complete'

export function TrainingsPage() {
  const { isAdmin, isCoach, user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [scheduleTarget, setScheduleTarget] = useState<TrainingDto | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [pdfTarget, setPdfTarget] = useState<TrainingDto | null>(null)
  const [validateAllResult, setValidateAllResult] = useState<{ total: number; validCount: number; draftCount: number } | null>(null)
  const [detailTrainingId, setDetailTrainingId] = useState<number | null>(null)

  // Filters & view
  const [searchText, setSearchText] = useState('')
  const [selectedGoalIds, setSelectedGoalIds] = useState<number[]>([])
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
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false)
  const [ageGroupDropdownOpen, setAgeGroupDropdownOpen] = useState(false)
  const goalDropdownRef = useRef<HTMLDivElement>(null)
  const ageGroupDropdownRef = useRef<HTMLDivElement>(null)

  const { data: trainings, isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => trainingsApi.getAll(),
  })

  const copyMutation = useMutation({
    mutationFn: (training: TrainingDto) => {
      const clone: Partial<TrainingDto> = {
        ...training,
        id: 0,
        name: `${training.name} - kopie`,
        isDraft: true,
        validationErrors: undefined,
        createdByUserId: undefined,
        createdByUserName: undefined,
        trainingParts: (training.trainingParts ?? []).map((p) => ({
          ...p,
          id: 0,
          trainingGroups: (p.trainingGroups ?? []).map((g) => ({ ...g, id: 0 })),
        })),
      }
      return trainingsApi.create(clone)
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      setDetailTrainingId(null)
      if (created?.id) navigate(`/trainings/${created.id}/edit`)
    },
  })

  const { data: goalTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
    select: (tags) => tags.filter((t) => t.isTrainingGoal),
  })

  const { data: allAgeGroups } = useQuery({
    queryKey: ['ageGroups'],
    queryFn: () => ageGroupsApi.getAll(),
  })

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (goalDropdownRef.current && !goalDropdownRef.current.contains(e.target as Node)) setGoalDropdownOpen(false)
      if (ageGroupDropdownRef.current && !ageGroupDropdownRef.current.contains(e.target as Node)) setAgeGroupDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Unique authors
  const authors = useMemo(() => {
    if (!trainings) return []
    const names = trainings.map((t) => t.createdByUserName).filter(Boolean) as string[]
    return [...new Set(names)].sort()
  }, [trainings])

  // Filtering + sorting
  const filteredTrainings = useMemo(() => {
    if (!trainings) return []
    const q = searchText.toLowerCase().trim()
    const filtered = trainings.filter((t) => {
      if (q) {
        const nameMatch = t.name?.toLowerCase().includes(q)
        const descMatch = t.description?.toLowerCase().includes(q)
        const authorMatch = t.createdByUserName?.toLowerCase().includes(q)
        const activityMatch = t.trainingParts?.some((p) =>
          p.trainingGroups?.some((g) => g.activity?.name?.toLowerCase().includes(q))
        )
        if (!nameMatch && !descMatch && !authorMatch && !activityMatch) return false
      }
      if (!groupByTag && selectedGoalIds.length > 0) {
        const trainingGoalIds = [t.trainingGoal1?.id, t.trainingGoal2?.id, t.trainingGoal3?.id].filter(Boolean) as number[]
        if (!selectedGoalIds.some((id) => trainingGoalIds.includes(id))) return false
      }
      if (selectedAgeGroupIds.length > 0) {
        const trainingAgIds = t.trainingAgeGroups?.map((ag) => ag.id) ?? []
        if (!selectedAgeGroupIds.some((id) => trainingAgIds.includes(id))) return false
      }
      if (selectedAuthor && t.createdByUserName !== selectedAuthor) return false
      if (statusFilter === 'draft' && !t.isDraft) return false
      if (statusFilter === 'complete' && t.isDraft) return false
      return true
    })
    return sortTrainings(filtered, sortKey)
  }, [trainings, searchText, selectedGoalIds, selectedAgeGroupIds, selectedAuthor, sortKey, statusFilter, groupByTag])

  const sortedGoalTags = useMemo(
    () => goalTags ? [...goalTags].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs')) : [],
    [goalTags]
  )

  const tagSections = useMemo(() => {
    if (!groupByTag || !sortedGoalTags.length) return [] as { tag: TagDto | null; trainings: TrainingDto[] }[]
    const hasSelection = selectedGoalIds.length > 0
    const visibleTags = hasSelection
      ? sortedGoalTags.filter((t) => selectedGoalIds.includes(t.id))
      : sortedGoalTags
    const rawSections = visibleTags.map((tag) => ({
      tag: tag as TagDto | null,
      trainings: filteredTrainings.filter((t) => {
        const ids = [t.trainingGoal1?.id, t.trainingGoal2?.id, t.trainingGoal3?.id].filter(Boolean) as number[]
        return ids.includes(tag!.id)
      }),
    }))
    const sections = hasSelection ? rawSections : rawSections.filter((s) => s.trainings.length > 0)
    if (!hasSelection) {
      const noTagTrainings = filteredTrainings.filter((t) => {
        const ids = [t.trainingGoal1?.id, t.trainingGoal2?.id, t.trainingGoal3?.id].filter(Boolean)
        return ids.length === 0
      })
      if (noTagTrainings.length > 0) {
        sections.push({ tag: null, trainings: noTagTrainings })
      }
    }
    return sections
  }, [groupByTag, sortedGoalTags, selectedGoalIds, filteredTrainings])

  const validateAllMutation = useMutation({
    mutationFn: () => trainingsApi.validateAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setValidateAllResult(data)
    },
  })

  const handleDownloadPdf = useCallback(async (training: TrainingDto, options: PdfOptions) => {
    setDownloadingId(training.id)
    setPdfTarget(null)
    try {
      await trainingsApi.downloadPdf(training.id, training.name, options)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  if (isLoading) return <LoadingSpinner />

  const canEdit = (t: TrainingDto) => isAdmin || (user && t.createdByUserId === user.id)
  const hasFilters = searchText || selectedGoalIds.length > 0 || selectedAgeGroupIds.length > 0 || selectedAuthor || statusFilter !== 'all'
  const clearFilters = () => { setSearchText(''); setSelectedGoalIds([]); setSelectedAgeGroupIds([]); setSelectedAuthor(''); setStatusFilter('all') }

  const renderCard = (training: TrainingDto, keyPrefix: string) => (
    <Card
      key={`${keyPrefix}${training.id}`}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setDetailTrainingId(training.id)}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 truncate">{training.name}</h3>
          <span
            title={training.isDraft ? 'Rozpracovaný' : 'Kompletní'}
            className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`}
          />
        </div>

        {training.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{training.description}</p>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          {training.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {training.duration} min
            </span>
          )}
          {training.personsMin != null && training.personsMin > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {training.personsMin}{training.personsMax ? `–${training.personsMax}` : '+'} hráčů
            </span>
          )}
          {training.createdByUserName && (
            <span className="flex items-center gap-1 ml-auto">
              <User className="h-3 w-3" />
              {training.createdByUserName}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setDetailTrainingId(training.id) }}>
            <Eye className="h-3.5 w-3.5" /> Detail
          </Button>
          {canEdit(training) && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/trainings/${training.id}/edit`) }}>
              <Pencil className="h-3.5 w-3.5" /> Upravit
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setScheduleTarget(training) }}>
            <CalendarPlus className="h-3.5 w-3.5" /> Naplánovat
          </Button>
          <Button size="sm" variant="ghost" loading={downloadingId === training.id} onClick={(e) => { e.stopPropagation(); setPdfTarget(training) }}>
            <FileDown className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderListRow = (training: TrainingDto, keyPrefix: string) => (
    <tr key={`${keyPrefix}${training.id}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailTrainingId(training.id)}>
      <td className="px-3 py-2">
        <span
          title={training.isDraft ? 'Rozpracovaný' : 'Kompletní'}
          className={`inline-block h-2.5 w-2.5 rounded-full ${training.isDraft ? 'bg-yellow-400' : 'bg-green-400'}`}
        />
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-gray-900">{training.name}</div>
        {training.description && (
          <div className="text-xs text-gray-400 line-clamp-1">{training.description}</div>
        )}
      </td>
      <td className="px-3 py-2 text-gray-600 hidden sm:table-cell">{training.duration > 0 ? `${training.duration} min` : '–'}</td>
      <td className="px-3 py-2 text-gray-600 hidden md:table-cell">
        {training.personsMin ? `${training.personsMin}${training.personsMax ? `–${training.personsMax}` : '+'}` : '–'}
      </td>
      <td className="px-3 py-2 text-gray-500 hidden lg:table-cell">{training.createdByUserName || '–'}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          {canEdit(training) && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/trainings/${training.id}/edit`) }} className="rounded p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-600" title="Upravit">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setScheduleTarget(training) }} className="rounded p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-600" title="Naplánovat">
            <CalendarPlus className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setPdfTarget(training) }} className="rounded p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-600" title="PDF">
            <FileDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )

  const listTableHeader = (
    <thead className="border-b border-gray-200 bg-gray-50">
      <tr>
        <th className="px-3 py-2 text-left font-medium text-gray-600 w-5"></th>
        <th className="px-3 py-2 text-left font-medium text-gray-600">Název</th>
        <th className="px-3 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Délka</th>
        <th className="px-3 py-2 text-left font-medium text-gray-600 hidden md:table-cell">Hráči</th>
        <th className="px-3 py-2 text-left font-medium text-gray-600 hidden lg:table-cell">Autor</th>
        <th className="px-3 py-2 text-right font-medium text-gray-600">Akce</th>
      </tr>
    </thead>
  )

  return (
    <div>
      <PageHeader
        title="Tréninky"
        description="Plány tréninků a jejich části"
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
            {isCoach && (
              <Button size="sm" onClick={() => navigate('/trainings/new')}>
                <Plus className="h-4 w-4" />
                Nový trénink
              </Button>
            )}
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
            placeholder="Hledat (název, popis, autor, aktivita)…"
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

        {/* Goal filter */}
        {goalTags && goalTags.length > 0 && (
          <div ref={goalDropdownRef} className="relative min-w-[180px]">
            <button
              onClick={() => { setGoalDropdownOpen(!goalDropdownOpen); setAgeGroupDropdownOpen(false) }}
              className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="truncate">
                {selectedGoalIds.length === 0 ? 'Zaměření' : `Zaměření (${selectedGoalIds.length})`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
            </button>
            {goalDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {selectedGoalIds.length > 0 && (
                  <button onClick={() => setSelectedGoalIds([])} className="w-full border-b border-gray-100 px-3 py-1.5 text-left text-xs text-sky-600 hover:bg-sky-50">
                    Zrušit výběr
                  </button>
                )}
                {goalTags.map((tag) => {
                  const selected = selectedGoalIds.includes(tag.id)
                  return (
                    <label key={tag.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                      <input type="checkbox" checked={selected} onChange={() => setSelectedGoalIds((prev) => selected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id])} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Age group filter */}
        {allAgeGroups && allAgeGroups.length > 0 && (
          <div ref={ageGroupDropdownRef} className="relative min-w-[180px]">
            <button
              onClick={() => { setAgeGroupDropdownOpen(!ageGroupDropdownOpen); setGoalDropdownOpen(false) }}
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
            title="Seskupit podle zaměření"
          >
            <Tags className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tag switches (by-tag view) */}
      {groupByTag && sortedGoalTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="mr-1 text-xs font-medium text-gray-500">Zaměření:</span>
          {sortedGoalTags.map((tag) => {
            const active = selectedGoalIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setSelectedGoalIds((prev) =>
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
          {selectedGoalIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedGoalIds([])}
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
            title={hasFilters ? 'Žádné výsledky' : 'Žádné tréninky'}
            description={hasFilters ? 'Zkuste změnit kritéria vyhledávání.' : 'Zatím nebyl vytvořen žádný trénink.'}
            action={
              hasFilters ? (
                <Button size="sm" variant="outline" onClick={clearFilters}>Zrušit filtry</Button>
              ) : isCoach ? (
                <Button size="sm" onClick={() => navigate('/trainings/new')}>
                  <Plus className="h-4 w-4" />
                  Vytvořit první trénink
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-8">
            {tagSections.map((section) => {
              const { tag, trainings: sectionTrainings } = section
              const sectionKey = tag?.id ?? 'no-tag'
              const keyPrefix = `tag-${sectionKey}-`
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
                      {tag?.name ?? 'Bez zaměření'}
                    </h2>
                    <span className="text-sm text-gray-400">({sectionTrainings.length})</span>
                  </div>
                  {sectionTrainings.length === 0 ? (
                    <div className="text-sm italic text-gray-400">Žádné tréninky</div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {sectionTrainings.map((training) => renderCard(training, keyPrefix))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        {listTableHeader}
                        <tbody className="divide-y divide-gray-100">
                          {sectionTrainings.map((training) => renderListRow(training, keyPrefix))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )
      ) : !filteredTrainings.length ? (
        <EmptyState
          title={hasFilters ? 'Žádné výsledky' : 'Žádné tréninky'}
          description={hasFilters ? 'Zkuste změnit kritéria vyhledávání.' : 'Zatím nebyl vytvořen žádný trénink.'}
          action={
            hasFilters ? (
              <Button size="sm" variant="outline" onClick={clearFilters}>Zrušit filtry</Button>
            ) : isCoach ? (
              <Button size="sm" onClick={() => navigate('/trainings/new')}>
                <Plus className="h-4 w-4" />
                Vytvořit první trénink
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrainings.map((training) => renderCard(training, ''))}
        </div>
      ) : (
        /* List view */
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            {listTableHeader}
            <tbody className="divide-y divide-gray-100">
              {filteredTrainings.map((training) => renderListRow(training, ''))}
            </tbody>
          </table>
        </div>
      )}

      <TrainingDetailModal
        trainingId={detailTrainingId}
        onClose={() => setDetailTrainingId(null)}
        onCopy={isCoach ? (training) => copyMutation.mutate(training) : undefined}
        copying={copyMutation.isPending}
      />

      {validateAllResult && (
        <Modal isOpen={true} onClose={() => setValidateAllResult(null)} title="Výsledek kontroly všech tréninků" maxWidth="sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Celkem tréninků:</span><strong>{validateAllResult.total}</strong></div>
            <div className="flex justify-between"><span className="text-green-600">Kompletní:</span><strong className="text-green-700">{validateAllResult.validCount}</strong></div>
            <div className="flex justify-between"><span className="text-yellow-600">Rozpracované:</span><strong className="text-yellow-700">{validateAllResult.draftCount}</strong></div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => setValidateAllResult(null)}>Zavřít</Button>
          </div>
        </Modal>
      )}

      {scheduleTarget && (
        <ScheduleTrainingModal
          training={scheduleTarget}
          isOpen={true}
          onClose={() => setScheduleTarget(null)}
        />
      )}

      {pdfTarget && (
        <PdfOptionsModal
          isOpen={true}
          onClose={() => setPdfTarget(null)}
          onConfirm={(options) => handleDownloadPdf(pdfTarget, options)}
          loading={downloadingId === pdfTarget.id}
        />
      )}

    </div>
  )
}
