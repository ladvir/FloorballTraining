import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isAfter, addMonths, subMonths,
} from 'date-fns'
import { cs } from 'date-fns/locale'
import { Plus, Calendar, List, ChevronLeft, ChevronRight, Clock, MapPin, ArrowUpDown, Repeat, FileSpreadsheet, Trash2, Download } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { appointmentsApi, teamsApi, seasonsApi, placesApi } from '../../api/index'
import { AppointmentFormModal } from './AppointmentFormModal'
import { AppointmentDetailModal } from './AppointmentDetailModal'
import { ExportWorkTimeModal } from './ExportWorkTimeModal'
import { ICalImportModal } from './ICalImportModal'
import type { AppointmentDto, SeasonDto } from '../../types/domain.types'
import { useAuthStore } from '../../store/authStore'

const typeLabels: Record<number, string> = {
  0: 'Trénink',
  1: 'Soustředění',
  2: 'Propagace',
  3: 'Zápas',
  4: 'Ostatní',
  5: 'Školení',
  6: 'Pořádání akce',
}

const typeBadgeVariant: Record<number, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  0: 'info',
  1: 'success',
  2: 'warning',
  3: 'danger',
  4: 'default',
  5: 'info',
  6: 'success',
}

type ViewMode = 'list' | 'calendar'
type SortField = 'date' | 'name' | 'type'
type SortDir = 'asc' | 'desc'

const TEAM_KEY = 'flotr_current_team'
const SEASON_KEY = 'flotr_current_season'

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

export function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [showPast, setShowPast] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentDto | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [currentTeamId, setCurrentTeamId] = useState<number>(loadFromStorage(TEAM_KEY))
  const [currentSeasonId, setCurrentSeasonId] = useState<number>(loadFromStorage(SEASON_KEY))
  const [seasonInitialized, setSeasonInitialized] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [detailAppointmentId, setDetailAppointmentId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [icalImportOpen, setIcalImportOpen] = useState(false)
  const [currentLocationId, setCurrentLocationId] = useState<number>(0)
  const { isAdmin } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })
  const { data: places } = useQuery({ queryKey: ['places'], queryFn: placesApi.getAll })
  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => appointmentsApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setDeleteConfirmOpen(false)
    },
  })

  // Auto-select current season on first load (if none stored)
  const selectedSeason = useMemo(() => {
    if (!seasons?.length) return undefined
    if (!seasonInitialized) {
      const stored = loadFromStorage(SEASON_KEY)
      const fromStorage = stored ? seasons.find((s) => s.id === stored) : undefined
      const auto = fromStorage ?? findCurrentSeason(seasons)
      if (auto && auto.id !== currentSeasonId) {
        setCurrentSeasonId(auto.id)
        localStorage.setItem(SEASON_KEY, String(auto.id))
      }
      setSeasonInitialized(true)
      return auto
    }
    if (!currentSeasonId) return undefined
    return seasons.find((s) => s.id === currentSeasonId)
  }, [seasons, currentSeasonId, seasonInitialized])

  // Build query params for the API - use season dates for server-side filtering
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

  // All appointments come as real DB rows (including recurring occurrences)
  const allAppointments = appointments ?? []

  const handleTeamChange = (teamId: number) => {
    setCurrentTeamId(teamId)
    if (teamId) localStorage.setItem(TEAM_KEY, String(teamId))
    else localStorage.removeItem(TEAM_KEY)
  }

  const handleSeasonChange = (seasonId: number) => {
    setCurrentSeasonId(seasonId)
    if (seasonId) localStorage.setItem(SEASON_KEY, String(seasonId))
    else localStorage.removeItem(SEASON_KEY)
  }

  const now = new Date()

  // Filter by team and location (client-side)
  const teamFiltered = useMemo(() => {
    let items = allAppointments
    if (currentTeamId) {
      items = items.filter((a) => !a.teamId || a.teamId === currentTeamId)
    }
    if (currentLocationId) {
      items = items.filter((a) => a.locationId === currentLocationId)
    }
    return items
  }, [allAppointments, currentTeamId, currentLocationId])

  // Sort + filter past for list view
  const listAppointments = useMemo(() => {
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

  // Calendar data
  const calendarAppointments = useMemo(() => {
    return [...teamFiltered].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [teamFiltered])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { locale: cs })
  const calendarEnd = endOfWeek(monthEnd, { locale: cs })
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

  const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

  return (
    <div>
      <PageHeader
        title="Události"
        description="Plánované tréninky a akce"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <List className="h-3.5 w-3.5" />
                Seznam
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Kalendář
              </button>
            </div>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIcalImportOpen(true)}>
                  <Download className="h-4 w-4" />Import iCal
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4" />Smazat vše
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />Výkaz
            </Button>
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="h-4 w-4" />Nová událost
            </Button>
          </div>
        }
      />

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sezóna:</label>
          <select
            value={currentSeasonId}
            onChange={(e) => handleSeasonChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value={0}>Všechny sezóny</option>
            {seasons?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {selectedSeason && (
            <span className="text-xs text-gray-400">
              {format(parseISO(selectedSeason.startDate), 'd.M.yyyy')} – {format(parseISO(selectedSeason.endDate), 'd.M.yyyy')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <label className="text-sm font-medium text-gray-700">Tým:</label>
          <select
            value={currentTeamId}
            onChange={(e) => handleTeamChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value={0}>Všechny týmy</option>
            {teams?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <label className="text-sm font-medium text-gray-700">Místo:</label>
          <select
            value={currentLocationId}
            onChange={(e) => setCurrentLocationId(Number(e.target.value))}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value={0}>Všechna místa</option>
            {places?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
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

      <ExportWorkTimeModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      <ICalImportModal
        isOpen={icalImportOpen}
        onClose={() => setIcalImportOpen(false)}
      />

      {/* Delete all confirmation dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Smazat všechny události?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tato akce je nevratná. Budou smazány všechny události ({allAppointments.length} zobrazených).
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
                Zrušit
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                loading={deleteAllMutation.isPending}
                onClick={() => deleteAllMutation.mutate()}
              >
                Smazat vše
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── List View ────────────────────────────────────────────────────────────────

function SortButton({ active, dir, onClick, children }: { active: boolean; dir: SortDir; onClick: () => void; children: React.ReactNode }) {
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
}: {
  appointments: AppointmentDto[]
  showPast: boolean
  onTogglePast: () => void
  onClick: (apt: AppointmentDto) => void
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
}) {
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
          Zobrazit i ukončené
        </label>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <span className="text-xs text-gray-500">Řadit:</span>
          <SortButton active={sortField === 'date'} dir={sortDir} onClick={() => onSort('date')}>Datum</SortButton>
          <SortButton active={sortField === 'name'} dir={sortDir} onClick={() => onSort('name')}>Název</SortButton>
          <SortButton active={sortField === 'type'} dir={sortDir} onClick={() => onSort('type')}>Typ</SortButton>
        </div>
      </div>

      {!appointments.length ? (
        <EmptyState title="Žádné události" description={showPast ? 'Zatím nejsou žádné události.' : 'Žádné nadcházející události.'} />
      ) : (
        <div className="space-y-2">
          {appointments.map((apt, idx) => {
            const start = parseISO(apt.start)
            const end = parseISO(apt.end)
            const isPast = isAfter(new Date(), end)
            const isVirtual = isRecurringOccurrence(apt)
            return (
              <Card
                key={`${apt.id}-${idx}`}
                className={`cursor-pointer hover:border-sky-200 hover:shadow-md transition-all ${isPast ? 'opacity-60' : ''}`}
                onClick={() => onClick(apt)}
              >
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <span className="text-lg font-bold leading-none">{format(start, 'd')}</span>
                    <span className="text-[10px] uppercase leading-none">{format(start, 'MMM yyyy', { locale: cs })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {apt.name || format(start, 'EEEE d. M. yyyy', { locale: cs })}
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
                        <span title="Opakující se událost"><Repeat className="h-3 w-3 text-gray-400" /></span>
                      )}
                      {!apt.teamId && (
                        <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1">osobní</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                      </span>
                      {apt.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {apt.locationName}
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
function aptDisplayName(apt: AppointmentDto) {
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
}) {
  const today = new Date()

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
            {format(currentMonth, 'LLLL yyyy', { locale: cs })}
          </h2>
          <button
            onClick={onNextMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={onToday}>
          Dnes
        </Button>
      </div>

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

            return (
              <div
                key={i}
                className={`min-h-[90px] border-b border-r border-gray-100 p-1 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
                } cursor-pointer hover:bg-sky-50/30`}
                onClick={() => onDayClick(day)}
              >
                <div className={`mb-0.5 text-right text-xs ${
                  isToday
                    ? 'inline-flex h-5 w-5 float-right items-center justify-center rounded-full bg-sky-500 font-bold text-white'
                    : isCurrentMonth
                      ? 'font-medium text-gray-700'
                      : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="clear-both space-y-0.5">
                  {dayAppointments.slice(0, 3).map((apt, j) => {
                    const isVirtual = isRecurringOccurrence(apt)
                    return (
                      <button
                        key={`${apt.id}-${j}`}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt) }}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors ${
                          apt.appointmentType === 0
                            ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                            : apt.appointmentType === 3
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : apt.appointmentType === 1
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : apt.appointmentType === 5
                                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                  : apt.appointmentType === 6
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${isVirtual ? 'border-l-2 border-current' : ''}`}
                        title={`${aptDisplayName(apt)} ${format(parseISO(apt.start), 'HH:mm')}${apt.locationName ? ` – ${apt.locationName}` : ''}${isVirtual ? ' (opakování)' : ''}`}
                      >
                        {format(parseISO(apt.start), 'HH:mm')}{' '}
                        {aptDisplayName(apt)}
                      </button>
                    )
                  })}
                  {dayAppointments.length > 3 && (
                    <div className="px-1 text-[10px] text-gray-400">
                      +{dayAppointments.length - 3} další
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
