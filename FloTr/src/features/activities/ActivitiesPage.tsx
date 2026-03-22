import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, Users, Pencil, RefreshCw, Search, X, ChevronDown, Eye, User, FileDown } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { PdfOptionsModal } from '../../components/shared/PdfOptionsModal'
import type { PdfOptions } from '../../components/shared/PdfOptionsModal'
import { Badge } from '../../components/ui/Badge'
import { activitiesApi } from '../../api/activities.api'
import { tagsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { ActivityDto, ActivityMediaDto } from '../../types/domain.types'

function isDrawingImage(img: ActivityMediaDto): boolean {
  if (img.name.endsWith('.svg')) return true
  try {
    if (img.data?.startsWith('{')) {
      const parsed = JSON.parse(img.data)
      if (parsed && 'fieldId' in parsed) return true
    }
  } catch { /* not JSON */ }
  return img.data?.startsWith('<?xml') || img.data?.includes('src="flotr"') || false
}

function getDisplaySrc(img: ActivityMediaDto): string {
  if (isDrawingImage(img) && img.preview) {
    if (img.preview.startsWith('<?xml') || img.preview.startsWith('<svg')) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(img.preview)
    }
    return img.preview
  }
  return img.data
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function ActivityDetailModal({ activityId, onClose }: { activityId: number | null; onClose: () => void }) {
  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => activitiesApi.getById(activityId!),
    enabled: activityId != null,
  })

  if (!activityId) return null

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Načítání…" maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    )
  }

  if (!activity) return null

  const images = activity.activityMedium?.filter((m) => m.mediaType === 0) ?? []
  const tagNames = activity.activityTags?.map((at) => at.tag?.name).filter(Boolean) ?? []
  const ageGroups = activity.activityAgeGroups?.map((ag) => ag.ageGroup?.name ?? ag.ageGroup?.description).filter(Boolean) ?? []

  const envLabels: Record<string, string> = {
    Indoor: 'Hala',
    Outdoor: 'Venku',
    Anywhere: 'Kdekoliv',
  }

  const difficultyLabels = ['', 'Začátečník', 'Mírně pokročilý', 'Pokročilý', 'Expert']
  const intensityLabels = ['', 'Nízká', 'Střední', 'Vysoká', 'Maximální']

  return (
    <Modal isOpen={true} onClose={onClose} title={activity.name} maxWidth="lg">
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${activity.isDraft !== false ? 'bg-yellow-400' : 'bg-green-400'}`} />
          <span className="text-sm text-gray-600">{activity.isDraft !== false ? 'Rozpracovaná' : 'Kompletní'}</span>
          {activity.createdByUserName && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3 w-3" />
              {activity.createdByUserName}
            </span>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Popis</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
          </div>
        )}

        {/* Properties grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(activity.durationMin || activity.durationMax) && (
            <div>
              <p className="text-xs text-gray-400">Trvání</p>
              <p className="text-sm font-medium">{activity.durationMin}–{activity.durationMax} min</p>
            </div>
          )}
          {activity.personsMin != null && activity.personsMin > 0 && (
            <div>
              <p className="text-xs text-gray-400">Hráči</p>
              <p className="text-sm font-medium">{activity.personsMin}{activity.personsMax ? `–${activity.personsMax}` : '+'}</p>
            </div>
          )}
          {activity.difficulty != null && activity.difficulty > 0 && (
            <div>
              <p className="text-xs text-gray-400">Obtížnost</p>
              <p className="text-sm font-medium">{difficultyLabels[activity.difficulty] || activity.difficulty}</p>
            </div>
          )}
          {activity.intensity != null && activity.intensity > 0 && (
            <div>
              <p className="text-xs text-gray-400">Intenzita</p>
              <p className="text-sm font-medium">{intensityLabels[activity.intensity] || activity.intensity}</p>
            </div>
          )}
          {activity.environment && (
            <div>
              <p className="text-xs text-gray-400">Prostředí</p>
              <p className="text-sm font-medium">{envLabels[activity.environment] || activity.environment}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {tagNames.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Tagy</h4>
            <div className="flex flex-wrap gap-1">
              {activity.activityTags?.map((at) => at.tag).filter(Boolean).map((tag) => (
                <span
                  key={tag!.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tag!.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag!.color }} />}
                  {tag!.name}
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

        {/* Images */}
        {images.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Obrázky</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={getDisplaySrc(img)}
                    alt={img.name}
                    className="w-full object-contain max-h-64"
                  />
                  {img.name && <p className="px-2 py-1 text-xs text-gray-500 truncate">{img.name}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {activity.validationErrors && activity.validationErrors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">Chyby validace</h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {activity.validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ActivitiesPage() {
  const { isAdmin, user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [validateAllResult, setValidateAllResult] = useState<{ total: number; validCount: number; draftCount: number } | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const [detailActivityId, setDetailActivityId] = useState<number | null>(null)
  const [pdfTarget, setPdfTarget] = useState<ActivityDto | null>(null)
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null)

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  })

  // Close tag dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false)
      }
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
    return activities.filter((a) => {
      if (q) {
        const nameMatch = a.name?.toLowerCase().includes(q)
        const descMatch = a.description?.toLowerCase().includes(q)
        if (!nameMatch && !descMatch) return false
      }
      if (selectedTagIds.length > 0) {
        const activityTagIds = a.activityTags?.map((at) => at.tag?.id ?? at.tagId).filter(Boolean) as number[] ?? []
        if (!selectedTagIds.every((id) => activityTagIds.includes(id))) return false
      }
      if (selectedAuthor && a.createdByUserName !== selectedAuthor) return false
      return true
    })
  }, [activities, searchText, selectedTagIds, selectedAuthor])

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

  const hasFilters = searchText || selectedTagIds.length > 0 || selectedAuthor

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
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

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Hledat podle názvu nebo popisu…"
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
        <div ref={tagDropdownRef} className="relative min-w-[200px]">
          <button
            onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
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
      </div>

      {!filteredActivities.length ? (
        <EmptyState
          title={hasFilters ? 'Žádné výsledky' : 'Žádné aktivity'}
          description={hasFilters ? 'Zkuste změnit kritéria vyhledávání.' : 'Zatím nebyla vytvořena žádná aktivita.'}
          action={
            hasFilters ? (
              <Button size="sm" variant="outline" onClick={() => { setSearchText(''); setSelectedTagIds([]); setSelectedAuthor('') }}>
                Zrušit filtry
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/activities/new')}>
                <Plus className="h-4 w-4" />
                Vytvořit první aktivitu
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity) => {
            const thumbnail = activity.activityMedium?.find((m) => m.isThumbnail) ?? activity.activityMedium?.[0]
            return (
            <Card
              key={activity.id}
              className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
              onClick={() => setDetailActivityId(activity.id)}
            >
              {thumbnail && (
                <div className="h-36 w-full overflow-hidden bg-gray-100">
                  <img src={getDisplaySrc(thumbnail)} alt={activity.name} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="py-4">
                {/* Status dot + name */}
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
                    onClick={(e) => { e.stopPropagation(); setDetailActivityId(activity.id) }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                  </Button>
                  {(isAdmin || (user && activity.createdByUserId === user.id)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/activities/${activity.id}/edit`) }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Upravit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={downloadingPdfId === activity.id}
                    onClick={(e) => { e.stopPropagation(); setPdfTarget(activity) }}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
            )
          })}
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
  )
}
