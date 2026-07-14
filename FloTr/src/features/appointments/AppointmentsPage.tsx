import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  addMonths,
  subMonths,
} from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import {
  Plus,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowUpDown,
  Repeat,
  FileSpreadsheet,
  Trash2,
  Download,
  Star,
  HelpCircle,
  UserCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { appointmentsApi, teamsApi, seasonsApi, placesApi, ratingsApi } from '../../api/index'
import { planningApi } from '../../api/planning.api'
import {
  buildDayCycleMap,
  typeTintClass,
  typeSwatchClass,
  phaseBorderClass,
  phaseBlockClass,
  type DayCycleInfo,
} from '../planning/planningUtils'
import { AppointmentFormModal } from './AppointmentFormModal'
import { AppointmentDetailModal } from './AppointmentDetailModal'
import { ExportWorkTimeModal } from './ExportWorkTimeModal'
import { ICalImportModal } from './ICalImportModal'
import { AppointmentsHelpModal } from './AppointmentsHelpModal'
import type { AppointmentDto, SeasonDto } from '../../types/domain.types'
import { useAuthStore } from '../../store/authStore'
import { getEventScope, scopeDateBg, type EventScope } from './appointmentUtils'

const typeBadgeVariant: Record<
  number,
  'info' | 'success' | 'warning' | 'danger' | 'default' | 'violet'
> = {
  0: 'info',
  1: 'success',
  2: 'warning',
  3: 'danger',
  4: 'default',
  5: 'info',
  6: 'success',
  7: 'default',
  8: 'violet',
}

type ViewMode = 'list' | 'calendar'
type SortField = 'date' | 'name' | 'type'
type SortDir = 'asc' | 'desc'

const TEAM_KEY = 'flotr_current_team'
const SEASON_KEY = 'flotr_current_season'
const PLAN_OVERLAY_KEY = 'flotr_show_plan_overlay'

function loadFromStorage(key: string): number {
  try {
    const v = localStorage.getItem(key)
    return v ? Number(v) : 0
  } catch {
    return 0
  }
}

/** Find the season whose date range contains today */
function findCurrentSeason(seasons: SeasonDto[]): SeasonDto | undefined {
  const now = new Date()
  return seasons.find((s) => {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    return now >= start && now <= end
  })
}

/** Check if appointment is part of a recurring series */
function isRecurringOccurrence(apt: AppointmentDto) {
  return !!(apt.parentAppointment || apt.repeatingPattern?.repeatingFrequency)
}

// ── Event scope helpers ───────────────────────────────────────────────────────

function typeColorClass(type: number | undefined): string {
  switch (type) {
    case 0:
      return 'bg-sky-100 text-sky-700 hover:bg-sky-200'
    case 1:
      return 'bg-green-100 text-green-700 hover:bg-green-200'
    case 3:
      return 'bg-red-100 text-red-700 hover:bg-red-200'
    case 5:
      return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
    case 6:
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
    case 8:
      return 'bg-violet-100 text-violet-700 hover:bg-violet-200'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }
}

/** Calendar pill background/text color by scope (scope overrides type for personal/assigned) */
function scopeColorClass(scope: EventScope, appointmentType: number | undefined): string {
  if (scope === 'assigned') return 'bg-purple-100 text-purple-700 hover:bg-purple-200'
  if (scope === 'assigned-done') return 'bg-green-100 text-green-700 hover:bg-green-200'
  if (scope === 'personal') return 'bg-amber-100 text-amber-700 hover:bg-amber-200'
  return typeColorClass(appointmentType)
}

export function AppointmentsPage() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [showPast, setShowPast] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentDto | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [currentTeamId, setCurrentTeamId] = useState<number>(loadFromStorage(TEAM_KEY))
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(() => {
    const stored = loadFromStorage(SEASON_KEY)
    return stored || null
  })
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [detailAppointmentId, setDetailAppointmentId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [icalImportOpen, setIcalImportOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [currentLocationId, setCurrentLocationId] = useState<number>(0)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false)
  const [showPlanOverlay, setShowPlanOverlay] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(PLAN_OVERLAY_KEY)
      return stored === null ? true : stored === '1'
    } catch {
      return true
    }
  })
  const { user, isAdmin, isHeadCoach, isCoach, activeClubId } = useAuthStore()
  const queryClient = useQueryClient()

  const typeLabels: Record<number, string> = {
    0: t('appointments.typeTraining'),
    1: t('appointments.typeCamp'),
    2: t('appointments.typePromotion'),
    3: t('appointments.typeMatch'),
    4: t('appointments.typeOther'),
    5: t('appointments.typeWorkshop'),
    6: t('appointments.typeOrganizing'),
    7: t('appointments.typePreperation'),
    8: t('appointments.typeTesting'),
  }

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const { data: places } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  const { data: seasons } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => appointmentsApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setDeleteConfirmOpen(false)
    },
  })

  // Ctrl+drag a calendar event onto another day to copy it there (only the date changes;
  // time of day and duration are preserved; the copy is a standalone, non-repeating event).
  const copyMutation = useMutation({
    mutationFn: ({ apt, targetDate }: { apt: AppointmentDto; targetDate: Date }) => {
      const srcStart = parseISO(apt.start)
      const srcEnd = parseISO(apt.end)
      const durationMs = Math.max(0, srcEnd.getTime() - srcStart.getTime())
      const newStart = new Date(targetDate)
      newStart.setHours(srcStart.getHours(), srcStart.getMinutes(), 0, 0)
      const newEnd = new Date(newStart.getTime() + durationMs)
      return appointmentsApi.create({
        name: apt.name,
        description: apt.description,
        start: format(newStart, "yyyy-MM-dd'T'HH:mm"),
        end: format(newEnd, "yyyy-MM-dd'T'HH:mm"),
        appointmentType: apt.appointmentType ?? 0,
        locationId: apt.locationId,
        teamId: apt.teamId,
        trainingId: apt.appointmentType === 0 ? apt.trainingId : undefined,
        testDefinitionIds: apt.testDefinitionIds ?? [],
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })

  // When currentSeasonId is null (nothing stored), auto-select the season whose dates contain today.
  const autoSelectedSeasonId = useMemo(() => {
    if (currentSeasonId !== null) return null
    return findCurrentSeason(seasons ?? [])?.id ?? null
  }, [currentSeasonId, seasons])

  const effectiveSeasonId = currentSeasonId ?? autoSelectedSeasonId ?? 0

  useEffect(() => {
    if (autoSelectedSeasonId) {
      localStorage.setItem(SEASON_KEY, String(autoSelectedSeasonId))
    }
  }, [autoSelectedSeasonId])

  useEffect(() => {
    if (!deleteConfirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteConfirmOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [deleteConfirmOpen])

  const selectedSeason = useMemo(() => {
    if (!seasons?.length || !effectiveSeasonId) return undefined
    return seasons.find((s) => s.id === effectiveSeasonId)
  }, [seasons, effectiveSeasonId])

  const queryParams = useMemo(() => {
    const params: { start?: string; end?: string; pageSize: number } = { pageSize: 500 }
    if (selectedSeason) {
      params.start = new Date(selectedSeason.startDate).toISOString()
      params.end = new Date(selectedSeason.endDate).toISOString()
    }
    return params
  }, [selectedSeason])

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', queryParams],
    queryFn: () => appointmentsApi.getAll(queryParams),
  })

  const { data: ratingAverages } = useQuery({
    queryKey: ['ratings', isCoach ? 'averages' : 'my-grades'],
    queryFn: isCoach ? ratingsApi.getAverages : ratingsApi.getMyGrades,
  })

  const allAppointments = useMemo(() => appointments ?? [], [appointments])

  const handleTeamChange = (teamId: number) => {
    setCurrentTeamId(teamId)
    if (teamId) localStorage.setItem(TEAM_KEY, String(teamId))
    else localStorage.removeItem(TEAM_KEY)
  }

  const handleSeasonChange = (seasonId: number) => {
    setCurrentSeasonId(seasonId)
    if (seasonId) localStorage.setItem(SEASON_KEY, String(seasonId))
    else localStorage.removeItem(SEASON_KEY)
    handleTeamChange(0)
  }

  const teamFiltered = useMemo(() => {
    let items = allAppointments
    if (currentTeamId) {
      items = items.filter((a) => !a.teamId || a.teamId === currentTeamId)
    }
    if (currentLocationId) {
      items = items.filter((a) => a.locationId === currentLocationId)
    }
    if (filterFrom) {
      const from = new Date(filterFrom)
      items = items.filter((a) => new Date(a.start) >= from)
    }
    if (filterTo) {
      const to = new Date(filterTo + 'T23:59:59')
      items = items.filter((a) => new Date(a.start) <= to)
    }
    if (filterAssignedToMe) {
      items = items.filter((a) => a.isAssignedToMe)
    }
    return items
  }, [allAppointments, currentTeamId, currentLocationId, filterFrom, filterTo, filterAssignedToMe])

  const listAppointments = useMemo(() => {
    const now = new Date()
    let items = [...teamFiltered]
    if (!showPast) {
      items = items.filter((a) => isAfter(parseISO(a.end), now))
    }
    items.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'date':
          cmp = new Date(a.start).getTime() - new Date(b.start).getTime()
          break
        case 'name':
          cmp = (a.name ?? '').localeCompare(b.name ?? '', 'cs')
          break
        case 'type':
          cmp = (a.appointmentType ?? 0) - (b.appointmentType ?? 0)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return items
  }, [teamFiltered, showPast, sortField, sortDir])

  const calendarAppointments = useMemo(() => {
    return [...teamFiltered].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )
  }, [teamFiltered])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { locale: dfLocale() })
  const calendarEnd = endOfWeek(monthEnd, { locale: dfLocale() })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentDto[]>()
    for (const apt of calendarAppointments) {
      const key = format(parseISO(apt.start), 'yyyy-MM-dd')
      const list = map.get(key) ?? []
      list.push(apt)
      map.set(key, list)
    }
    return map
  }, [calendarAppointments])

  // Season-plan overlay: one small fetch per visible month; skipped when off or no team
  const { data: planCycles } = useQuery({
    queryKey: ['planCalendar', currentTeamId, format(calendarStart, 'yyyy-MM-dd')],
    queryFn: () =>
      planningApi.getCalendarCycles(
        currentTeamId,
        format(calendarStart, 'yyyy-MM-dd'),
        format(calendarEnd, 'yyyy-MM-dd')
      ),
    enabled: viewMode === 'calendar' && currentTeamId > 0 && showPlanOverlay,
  })

  const dayCycleMap = useMemo(
    () => buildDayCycleMap(planCycles ?? [], calendarStart, calendarEnd),
    [planCycles, calendarStart, calendarEnd]
  )

  const togglePlanOverlay = () => {
    setShowPlanOverlay((prev) => {
      const next = !prev
      try {
        localStorage.setItem(PLAN_OVERLAY_KEY, next ? '1' : '0')
      } catch {
        // ignore storage failures
      }
      return next
    })
  }

  const openCreate = (date?: Date) => {
    setEditingAppointment(null)
    setDefaultDate(date ?? null)
    setModalOpen(true)
  }

  const handleAppointmentClick = (apt: AppointmentDto) => {
    setDetailAppointmentId(apt.id)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  if (isLoading) return <LoadingSpinner />

  const dayNames = t('appointments.dayNames', { returnObjects: true }) as string[]

  return (
    <div>
      <PageHeader
        title={t('appointments.title')}
        description={t('appointments.description')}
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <List className="h-3.5 w-3.5" />
                {t('appointments.listView')}
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                {t('appointments.calendarView')}
              </button>
            </div>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIcalImportOpen(true)}>
                  <Download className="h-4 w-4" />
                  {t('appointments.importIcal')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('appointments.deleteAll')}
                </Button>
              </>
            )}
            {isCoach && (
              <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
                <FileSpreadsheet className="h-4 w-4" />
                {t('appointments.exportWorkTime')}
              </Button>
            )}
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="h-4 w-4" />
              {t('appointments.newEvent')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)}>
              <HelpCircle className="h-4 w-4" />
              {t('common.help')}
            </Button>
          </div>
        }
      />

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {t('appointments.filterSeason')}
          </label>
          <select
            value={effectiveSeasonId}
            onChange={(e) => handleSeasonChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value={0}>{t('appointments.allSeasons')}</option>
            {seasons?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {selectedSeason && (
            <span className="text-xs text-gray-400">
              {format(parseISO(selectedSeason.startDate), 'd.M.yyyy')} –{' '}
              {format(parseISO(selectedSeason.endDate), 'd.M.yyyy')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <label className="text-sm font-medium text-gray-700">
            {t('appointments.filterTeam')}
          </label>
          <select
            value={currentTeamId}
            onChange={(e) => handleTeamChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value={0}>{t('appointments.allTeams')}</option>
            {(selectedSeason ? teams?.filter((t) => t.seasonId === selectedSeason.id) : teams)
              ?.filter((t) => isHeadCoach || (user?.coachTeamIds ?? []).includes(t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <label className="text-sm font-medium text-gray-700">
            {t('appointments.filterPlace')}
          </label>
          <select
            value={currentLocationId}
            onChange={(e) => setCurrentLocationId(Number(e.target.value))}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value={0}>{t('appointments.allPlaces')}</option>
            {places?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <label className="text-sm font-medium text-gray-700">
            {t('appointments.filterFrom')}
          </label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          <label className="text-sm font-medium text-gray-700">{t('appointments.filterTo')}</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          {(filterFrom || filterTo) && (
            <button
              onClick={() => {
                setFilterFrom('')
                setFilterTo('')
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
              title={t('appointments.filterClearDate')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="border-l border-gray-200 pl-4">
          <button
            onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterAssignedToMe
                ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-400'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title={t('appointments.filterAssignedToMeTitle')}
          >
            <span>{t('appointments.filterAssignedToMe')}</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ListView
          appointments={listAppointments}
          showPast={showPast}
          onTogglePast={() => setShowPast(!showPast)}
          onClick={handleAppointmentClick}
          sortField={sortField}
          sortDir={sortDir}
          onSort={toggleSort}
          ratingAverages={ratingAverages}
          isCoach={isCoach}
          typeLabels={typeLabels}
        />
      ) : (
        <CalendarView
          days={calendarDays}
          dayNames={dayNames}
          currentMonth={currentMonth}
          appointmentsByDate={appointmentsByDate}
          onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          onToday={() => setCurrentMonth(new Date())}
          onDayClick={(date) => openCreate(date)}
          onAppointmentClick={handleAppointmentClick}
          onCopyAppointment={(apt, targetDate) => copyMutation.mutate({ apt, targetDate })}
          ratingAverages={ratingAverages}
          isCoach={isCoach}
          typeLabels={typeLabels}
          dayCycleMap={dayCycleMap}
          planOverlayOn={showPlanOverlay && currentTeamId > 0}
          showPlanToggle={currentTeamId > 0}
          onTogglePlanOverlay={togglePlanOverlay}
        />
      )}

      <AppointmentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        appointment={editingAppointment}
        defaultDate={defaultDate}
        defaultTeamId={currentTeamId || undefined}
      />

      <AppointmentDetailModal
        appointmentId={detailAppointmentId}
        onClose={() => setDetailAppointmentId(null)}
      />

      <ExportWorkTimeModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />

      <ICalImportModal isOpen={icalImportOpen} onClose={() => setIcalImportOpen(false)} />

      <AppointmentsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Delete all confirmation dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('appointments.deleteAllEvents')}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {t('appointments.deleteAllConfirm', { count: allAppointments.length })}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                loading={deleteAllMutation.isPending}
                onClick={() => deleteAllMutation.mutate()}
              >
                {t('appointments.deleteAll')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Rating badge ─────────────────────────────────────────────────────────────

const gradeColor = (avg: number) =>
  avg <= 1.5
    ? 'bg-green-500'
    : avg <= 2.5
      ? 'bg-lime-500'
      : avg <= 3.5
        ? 'bg-yellow-500'
        : avg <= 4.5
          ? 'bg-orange-500'
          : 'bg-red-500'

function AvgGradeBadge({ avg, label }: { avg: number; label?: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-bold text-white ${gradeColor(avg)}`}
      title={label ?? t('appointments.avgRating', { avg })}
    >
      <Star className="h-2.5 w-2.5" />
      {avg}
    </span>
  )
}

// ── List View ────────────────────────────────────────────────────────────────

function SortButton({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean
  dir: SortDir
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? 'text-sky-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${active ? 'text-sky-600' : 'text-gray-400'}`} />
      {active && <span className="text-[10px]">{dir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  )
}

function ListView({
  appointments,
  showPast,
  onTogglePast,
  onClick,
  sortField,
  sortDir,
  onSort,
  ratingAverages,
  isCoach,
  typeLabels,
}: {
  appointments: AppointmentDto[]
  showPast: boolean
  onTogglePast: () => void
  onClick: (apt: AppointmentDto) => void
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  ratingAverages?: Record<number, number>
  isCoach: boolean
  typeLabels: Record<number, string>
}) {
  const { t } = useTranslation()
  const [ratingFilter, setRatingFilter] = useState<'all' | 'rated' | 'unrated'>('all')

  const filtered = useMemo(() => {
    if (ratingFilter === 'all') return appointments
    return appointments.filter((apt) => {
      const hasRating = ratingAverages?.[apt.id] != null
      return ratingFilter === 'rated' ? hasRating : !hasRating
    })
  }, [appointments, ratingFilter, ratingAverages])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showPast}
            onChange={onTogglePast}
            className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500/20"
          />
          {t('appointments.showPast')}
        </label>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <Star className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as 'all' | 'rated' | 'unrated')}
            className="h-7 rounded-lg border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">{t('appointments.ratingAll')}</option>
            <option value="rated">{t('appointments.ratingRated')}</option>
            <option value="unrated">{t('appointments.ratingUnrated')}</option>
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <span className="text-xs text-gray-500">{t('appointments.sortBy')}</span>
          <SortButton active={sortField === 'date'} dir={sortDir} onClick={() => onSort('date')}>
            {t('appointments.sortDate')}
          </SortButton>
          <SortButton active={sortField === 'name'} dir={sortDir} onClick={() => onSort('name')}>
            {t('appointments.sortName')}
          </SortButton>
          <SortButton active={sortField === 'type'} dir={sortDir} onClick={() => onSort('type')}>
            {t('appointments.sortType')}
          </SortButton>
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState
          title={t('appointments.noEvents')}
          description={
            ratingFilter !== 'all'
              ? t('appointments.noEventsByFilter')
              : showPast
                ? t('appointments.noEventsYet')
                : t('appointments.noFutureEvents')
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((apt) => {
            const start = parseISO(apt.start)
            const end = parseISO(apt.end)
            const isPast = isAfter(new Date(), end)
            const isVirtual = isRecurringOccurrence(apt)
            const scope = getEventScope(apt, isCoach)
            return (
              <Card
                key={apt.id}
                className={`cursor-pointer hover:border-sky-200 hover:shadow-md transition-all ${isPast ? 'opacity-60' : ''}`}
                onClick={() => onClick(apt)}
              >
                <CardContent className="flex items-center gap-4 py-3">
                  <div
                    className={`flex h-12 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg ${scopeDateBg(scope)}`}
                  >
                    <span className="text-lg font-bold leading-none">{format(start, 'd')}</span>
                    <span className="text-[10px] uppercase leading-none">
                      {format(start, 'MMM yyyy', { locale: dfLocale() })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {apt.name || format(start, 'EEEE d. M. yyyy', { locale: dfLocale() })}
                        {apt.name && apt.trainingName && (
                          <span className="font-normal text-sky-600"> – {apt.trainingName}</span>
                        )}
                        {!apt.name && apt.trainingName && (
                          <span className="font-normal text-sky-600"> ({apt.trainingName})</span>
                        )}
                      </p>
                      <Badge variant={typeBadgeVariant[apt.appointmentType ?? 4]}>
                        {typeLabels[apt.appointmentType ?? 4]}
                      </Badge>
                      {isVirtual && (
                        <span title={t('appointments.recurring')}>
                          <Repeat className="h-3 w-3 text-gray-400" />
                        </span>
                      )}
                      {!apt.teamId && (
                        <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1">
                          {t('appointments.personal')}
                        </span>
                      )}
                      {apt.isAssignedToMe && (
                        <span
                          className={`text-[10px] border rounded px-1 ${apt.myAssignmentCompleted ? 'text-green-600 border-green-200 bg-green-50' : 'text-sky-600 border-sky-200 bg-sky-50'}`}
                          title={
                            apt.myAssignmentCompleted
                              ? t('appointments.assignedDone')
                              : t('appointments.assignedToMe')
                          }
                        >
                          {apt.myAssignmentCompleted
                            ? `✓ ${t('appointments.assignedDone').toLowerCase()}`
                            : t('appointments.filterAssignedToMe').toLowerCase()}
                        </span>
                      )}
                      {isPast &&
                        ratingAverages?.[apt.id] != null &&
                        (isCoach ? (
                          <AvgGradeBadge avg={ratingAverages[apt.id]} />
                        ) : (
                          <span
                            className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-700"
                            title={t('appointments.rated')}
                          >
                            <Star className="h-2.5 w-2.5" />
                          </span>
                        ))}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                      </span>
                      {isCoach && apt.memberAssignments && apt.memberAssignments.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-sky-600">
                          <UserCheck className="h-3.5 w-3.5 shrink-0" />
                          {apt.memberAssignments
                            .slice()
                            .sort((a, b) =>
                              (a.memberLastName ?? '').localeCompare(b.memberLastName ?? '', 'cs')
                            )
                            .slice(0, 3)
                            .map((a) => `${a.memberLastName} ${a.memberFirstName ?? ''}`.trim())
                            .join(', ')}
                          {apt.memberAssignments.length > 3 && (
                            <span className="text-gray-400">
                              +{apt.memberAssignments.length - 3}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Format appointment name with training name */
function aptDisplayName(apt: AppointmentDto, typeLabels: Record<number, string>) {
  const base = apt.name || typeLabels[apt.appointmentType ?? 4]
  if (apt.name && apt.trainingName) return `${base} – ${apt.trainingName}`
  if (!apt.name && apt.trainingName) return `${base} (${apt.trainingName})`
  return base
}

// ── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
  days,
  dayNames,
  currentMonth,
  appointmentsByDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDayClick,
  onAppointmentClick,
  onCopyAppointment,
  ratingAverages,
  isCoach,
  typeLabels,
  dayCycleMap,
  planOverlayOn,
  showPlanToggle,
  onTogglePlanOverlay,
}: {
  days: Date[]
  dayNames: string[]
  currentMonth: Date
  appointmentsByDate: Map<string, AppointmentDto[]>
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDayClick: (date: Date) => void
  onAppointmentClick: (apt: AppointmentDto) => void
  onCopyAppointment?: (apt: AppointmentDto, targetDate: Date) => void
  ratingAverages?: Record<number, number>
  isCoach: boolean
  typeLabels: Record<number, string>
  dayCycleMap?: Map<string, DayCycleInfo>
  planOverlayOn?: boolean
  showPlanToggle?: boolean
  onTogglePlanOverlay?: () => void
}) {
  const { t } = useTranslation()
  const today = new Date()
  const draggedAptRef = useRef<AppointmentDto | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const canCopy = isCoach && !!onCopyAppointment

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
            {format(currentMonth, 'LLLL yyyy', { locale: dfLocale() })}
          </h2>
          <button
            onClick={onNextMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {showPlanToggle && onTogglePlanOverlay && (
            <button
              onClick={onTogglePlanOverlay}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                planOverlayOn
                  ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-400'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              title={t('planning.showOverlayTitle')}
            >
              {t('planning.showOverlay')}
            </button>
          )}
          <Button variant="outline" size="sm" onClick={onToday}>
            {t('appointments.calendarToday')}
          </Button>
        </div>
      </div>

      {canCopy && (
        <p className="mb-2 text-xs text-gray-400">
          {t('appointments.calendarTipBeforeCtrl')}{' '}
          <kbd className="rounded border border-gray-300 px-1">Ctrl</kbd>{' '}
          {t('appointments.calendarTipAfterCtrl')}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {dayNames.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayAppointments = appointmentsByDate.get(key) ?? []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, today)
            const cycleInfo = planOverlayOn ? dayCycleMap?.get(key) : undefined
            // Drag highlight wins over the plan tint; outside-month days stay muted
            const cellBg =
              dragOverKey === key
                ? 'bg-sky-100 ring-2 ring-inset ring-sky-400'
                : cycleInfo && isCurrentMonth
                  ? typeTintClass(cycleInfo.type)
                  : isCurrentMonth
                    ? 'bg-white'
                    : 'bg-gray-50/50'

            return (
              <div
                key={i}
                className={`min-h-[90px] border-b border-r border-gray-100 p-1 ${cellBg} cursor-pointer hover:bg-sky-50/30 ${
                  cycleInfo?.isMesoStart ? `border-l-2 ${phaseBorderClass(cycleInfo.phase)}` : ''
                }`}
                title={
                  cycleInfo
                    ? `${cycleInfo.mesocycleName} • ${cycleInfo.microcycleName} • ${t(`planning.type${cycleInfo.type}`)}`
                    : undefined
                }
                onClick={() => onDayClick(day)}
                onDragOver={(e) => {
                  if (draggedAptRef.current && e.ctrlKey) {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'copy'
                    if (dragOverKey !== key) setDragOverKey(key)
                  }
                }}
                onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                onDrop={(e) => {
                  const apt = draggedAptRef.current
                  draggedAptRef.current = null
                  setDragOverKey(null)
                  if (apt && e.ctrlKey) {
                    e.preventDefault()
                    onCopyAppointment?.(apt, day)
                  }
                }}
              >
                {cycleInfo?.isMesoStart && (
                  <div
                    className={`float-left max-w-[70%] truncate rounded px-1 text-[9px] font-semibold ${phaseBlockClass(cycleInfo.phase)}`}
                  >
                    {cycleInfo.mesocycleName}
                  </div>
                )}
                <div
                  className={`mb-0.5 text-right text-xs ${
                    isToday
                      ? 'inline-flex h-5 w-5 float-right items-center justify-center rounded-full bg-sky-500 font-bold text-white'
                      : isCurrentMonth
                        ? 'font-medium text-gray-700'
                        : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="clear-both space-y-0.5">
                  {dayAppointments.slice(0, 3).map((apt, j) => {
                    const isVirtual = isRecurringOccurrence(apt)
                    const hasRating = ratingAverages?.[apt.id] != null
                    const scope = getEventScope(apt, isCoach)
                    const scopeLabel =
                      scope === 'assigned'
                        ? t('appointments.assignedToMe')
                        : scope === 'assigned-done'
                          ? t('appointments.assignedDone')
                          : scope === 'personal'
                            ? t('appointments.personalLabel')
                            : scope === 'has-assignments'
                              ? t('appointments.hasAssignments')
                              : t('appointments.teamLabel')
                    return (
                      <button
                        key={`${apt.id}-${j}`}
                        type="button"
                        draggable={canCopy}
                        onDragStart={(e) => {
                          draggedAptRef.current = apt
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                        onDragEnd={() => {
                          draggedAptRef.current = null
                          setDragOverKey(null)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick(apt)
                        }}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors ${scopeColorClass(scope, apt.appointmentType)} ${isVirtual ? 'border-l-2 border-current' : scope === 'has-assignments' ? 'border-l-2 border-orange-400' : ''} ${hasRating ? 'ring-1 ring-amber-400' : ''}`}
                        title={`[${scopeLabel}] ${aptDisplayName(apt, typeLabels)} ${format(parseISO(apt.start), 'HH:mm')}${isVirtual ? ` (${t('appointments.recurringOccurrence')})` : ''}${hasRating ? (isCoach ? ` ★ ${ratingAverages![apt.id]}` : ` ★ ${t('appointments.rated')}`) : ''}`}
                      >
                        {hasRating && (
                          <Star className="mr-0.5 inline h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                        )}
                        {scope === 'personal' && <span className="mr-0.5 opacity-60">os.</span>}
                        {scope === 'assigned' && <span className="mr-0.5">→</span>}
                        {scope === 'assigned-done' && <span className="mr-0.5">✓</span>}
                        {format(parseISO(apt.start), 'HH:mm')} {aptDisplayName(apt, typeLabels)}
                        {hasRating && isCoach && (
                          <span
                            className={`ml-0.5 inline-flex items-center gap-0.5 rounded-full px-1 text-[9px] font-bold text-white ${gradeColor(ratingAverages![apt.id])}`}
                          >
                            {ratingAverages![apt.id]}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {dayAppointments.length > 3 && (
                    <div className="px-1 text-[10px] text-gray-400">
                      +{dayAppointments.length - 3} {t('common.next').toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Color legend */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-sky-100 ring-1 ring-sky-300" />
          {t('appointments.teamLabel')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-amber-100 ring-1 ring-amber-300" />
          {t('appointments.personalLabel')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-purple-100 ring-1 ring-purple-300" />
          {t('appointments.assignedToMe')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-green-100 ring-1 ring-green-300" />
          {t('appointments.assignedDone')}
        </span>
        {isCoach && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded border-l-2 border-orange-400 bg-sky-100" />
            {t('appointments.hasAssignments')}
          </span>
        )}
      </div>

      {/* Season plan overlay legend */}
      {planOverlayOn && (dayCycleMap?.size ?? 0) > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
          <span className="font-medium text-gray-500">{t('planning.overlayLegend')}:</span>
          {[0, 1, 2, 3, 4].map((type) => (
            <span key={type} className="flex items-center gap-1">
              <span className={`inline-block h-2 w-3 rounded border ${typeSwatchClass(type)}`} />
              {t(`planning.type${type}`)}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded border-l-2 border-rose-400 bg-white" />
            {t('planning.mesoStartLegend')}
          </span>
        </div>
      )}
    </div>
  )
}
