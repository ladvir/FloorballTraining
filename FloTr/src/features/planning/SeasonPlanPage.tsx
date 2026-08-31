import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Maximize2,
  Pencil,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { seasonsApi, teamsApi, appointmentsApi } from '../../api/index'
import { trainingsApi } from '../../api/trainings.api'
import { planningApi } from '../../api/planning.api'
import { useAuthStore } from '../../store/authStore'
import { useConfirm } from '../../store/confirmStore'
import { toast } from '../../utils/toast'
import { dfLocale } from '../../utils/dateLocale'
import { cn } from '../../utils/cn'
import { skillPalette } from '../../utils/skillColors'
import type {
  AppointmentDto,
  MesocycleDto,
  MicrocycleDto,
  SeasonDto,
  SkillDto,
} from '../../types/domain.types'
import { AppointmentFormModal } from '../appointments/AppointmentFormModal'
import { refreshAppointments } from '../appointments/refreshAppointments'
import { PlanTimeline } from './PlanTimeline'
import { MesocycleModal } from './MesocycleModal'
import { MicrocycleModal } from './MicrocycleModal'
import { GenerateWeeksModal } from './GenerateWeeksModal'
import { EvaluationPanel } from './EvaluationPanel'
import { SeasonGoalsCard } from './SeasonGoalsCard'
import { TrainingDetailModal } from '../trainings/TrainingDetailModal'
import { daySpan, phaseBlockClass, typeBlockClass, isOutsideRange } from './planningUtils'
import { refreshPlan } from './refreshPlan'

const TEAM_KEY = 'flotr_current_team'
const SEASON_KEY = 'flotr_current_season'
const PLAN_VIEW_KEY = 'flotr_plan_view'
const PLAN_ZOOM_KEY = 'flotr_plan_zoom'

type PlanView = 'season' | 'month' | 'week' | 'custom'

// Timeline density (px per day) presets; null = stretch to container width
const ZOOM_STEPS = [3, 4, 6, 9, 14, 20, 30, 45]

// Appointment type → i18n key (same mapping as TeamDetailPage)
const APPT_TYPE_KEY: Record<number, string> = {
  0: 'appointments.typeTraining',
  1: 'appointments.typeCamp',
  2: 'appointments.typePromotion',
  3: 'appointments.typeMatch',
  4: 'appointments.typeOther',
  5: 'appointments.typeWorkshop',
  6: 'appointments.typeOrganizing',
  7: 'appointments.typePreperation',
  8: 'appointments.typeTesting',
}
const apptTypeKey = (type?: number) => APPT_TYPE_KEY[type ?? 4] ?? 'appointments.typeOther'
const apptTypeVariant = (type?: number): 'success' | 'info' | 'warning' | 'default' =>
  type === 0 ? 'success' : type === 3 ? 'info' : type === 8 ? 'warning' : 'default'

function loadFromStorage(key: string): number {
  try {
    const v = localStorage.getItem(key)
    return v ? Number(v) : 0
  } catch {
    return 0
  }
}

function findCurrentSeason(seasons: SeasonDto[]): SeasonDto | undefined {
  const now = new Date()
  return seasons.find((s) => now >= new Date(s.startDate) && now <= new Date(s.endDate))
}

function fmtRange(startDate: string, endDate: string): string {
  return `${format(parseISO(startDate), 'd.M.yyyy', { locale: dfLocale() })} – ${format(
    parseISO(endDate),
    'd.M.yyyy',
    { locale: dfLocale() }
  )}`
}

function SkillChips({ skills }: { skills: SkillDto[] }) {
  if (!skills.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((skill) => (
        <span
          key={skill.id}
          className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
          style={{ backgroundColor: skillPalette(skill.skillCategoryId).activeBg }}
        >
          {skill.name}
        </span>
      ))}
    </div>
  )
}

function PlanTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        '-mb-px whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium',
        active
          ? 'border-sky-500 text-sky-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      )}
    >
      {children}
    </button>
  )
}

export function SeasonPlanPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const { isCoach, activeClubId } = useAuthStore()

  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(() => {
    const stored = loadFromStorage(SEASON_KEY)
    return stored || null
  })
  const [currentTeamId, setCurrentTeamId] = useState<number>(loadFromStorage(TEAM_KEY))
  const [activeTab, setActiveTab] = useState<'cycles' | 'goals'>('cycles')
  const [selectedMesoId, setSelectedMesoId] = useState<number | null>(null)
  const [selectedMicroId, setSelectedMicroId] = useState<number | null>(null)
  const [mesoModalOpen, setMesoModalOpen] = useState(false)
  const [editingMeso, setEditingMeso] = useState<MesocycleDto | null>(null)
  const [microModalOpen, setMicroModalOpen] = useState(false)
  const [editingMicro, setEditingMicro] = useState<MicrocycleDto | null>(null)
  const [microParent, setMicroParent] = useState<MesocycleDto | null>(null)
  const [generateWeeksFor, setGenerateWeeksFor] = useState<MesocycleDto | null>(null)
  const [eventModal, setEventModal] = useState<{ appointment: AppointmentDto | null } | null>(null)
  const [previewTrainingId, setPreviewTrainingId] = useState<number | null>(null)

  // Timeline view window + zoom
  const [planView, setPlanView] = useState<PlanView>(() => {
    try {
      const v = localStorage.getItem(PLAN_VIEW_KEY)
      return v === 'month' || v === 'week' || v === 'custom' ? v : 'season'
    } catch {
      return 'season'
    }
  })
  const [pxPerDay, setPxPerDay] = useState<number | null>(() => {
    const n = loadFromStorage(PLAN_ZOOM_KEY)
    return n > 0 ? n : null
  })
  const [anchor, setAnchor] = useState<Date>(new Date())
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_VIEW_KEY, planView)
    } catch {
      /* ignore */
    }
  }, [planView])
  useEffect(() => {
    try {
      if (pxPerDay) localStorage.setItem(PLAN_ZOOM_KEY, String(pxPerDay))
      else localStorage.removeItem(PLAN_ZOOM_KEY)
    } catch {
      /* ignore */
    }
  }, [pxPerDay])

  const zoomIn = () =>
    setPxPerDay((p) => ZOOM_STEPS.find((s) => s > (p ?? 6)) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1])
  const zoomOut = () =>
    setPxPerDay((p) => [...ZOOM_STEPS].reverse().find((s) => s < (p ?? 6)) ?? ZOOM_STEPS[0])

  const { data: seasons } = useQuery({
    queryKey: ['seasons', activeClubId],
    queryFn: () => seasonsApi.getAll(activeClubId),
  })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })

  const effectiveSeasonId = currentSeasonId ?? findCurrentSeason(seasons ?? [])?.id ?? 0
  const seasonTeams = useMemo(
    () => (teams ?? []).filter((team) => !effectiveSeasonId || team.seasonId === effectiveSeasonId),
    [teams, effectiveSeasonId]
  )
  // Keep a stored team that no longer matches the season filter out of the selector
  const effectiveTeamId = seasonTeams.some((team) => team.id === currentTeamId) ? currentTeamId : 0

  const {
    data: plan,
    isLoading,
    error: planError,
  } = useQuery({
    queryKey: ['seasonPlan', effectiveTeamId],
    queryFn: () => planningApi.getPlan(effectiveTeamId),
    enabled: effectiveTeamId > 0,
  })
  const planForbidden =
    (planError as { response?: { status?: number } } | null)?.response?.status === 403

  // Team events + training library — for the "events per week" section and the timeline band
  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    enabled: effectiveTeamId > 0,
  })
  const { data: allTrainings } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => trainingsApi.getAll(),
    enabled: effectiveTeamId > 0,
  })

  const setEventTrainingMutation = useMutation({
    mutationFn: ({ id, trainingId }: { id: number; trainingId: number | null }) =>
      planningApi.setAppointmentTraining(id, trainingId),
    onSuccess: () => {
      void refreshAppointments(queryClient)
      refreshPlan(queryClient) // scheduledCount is derived from appointments
      toast.success(t('planning.saved'))
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? t('planning.saveFailed'))
    },
  })

  const handleSeasonChange = (seasonId: number) => {
    setCurrentSeasonId(seasonId)
    if (seasonId) localStorage.setItem(SEASON_KEY, String(seasonId))
    else localStorage.removeItem(SEASON_KEY)
    handleTeamChange(0)
  }

  const handleTeamChange = (teamId: number) => {
    setCurrentTeamId(teamId)
    setSelectedMesoId(null)
    setSelectedMicroId(null)
    if (teamId) localStorage.setItem(TEAM_KEY, String(teamId))
    else localStorage.removeItem(TEAM_KEY)
  }

  const mesocycles = useMemo(() => plan?.mesocycles ?? [], [plan])
  const selectedMeso = mesocycles.find((m) => m.id === selectedMesoId) ?? null
  const selectedMicro =
    mesocycles.flatMap((m) => m.microcycles).find((mc) => mc.id === selectedMicroId) ?? null
  const selectedMicroMeso = selectedMicro
    ? (mesocycles.find((m) => m.id === selectedMicro.mesocycleId) ?? null)
    : null

  const teamAppointments = useMemo(
    () => (appointments ?? []).filter((a) => a.teamId === effectiveTeamId),
    [appointments, effectiveTeamId]
  )

  // Events (date-only) inside the selected week, oldest first
  const weekEvents = useMemo(() => {
    if (!selectedMicro) return []
    const from = selectedMicro.startDate.slice(0, 10)
    const to = selectedMicro.endDate.slice(0, 10)
    return teamAppointments
      .filter((a) => a.start.slice(0, 10) >= from && a.start.slice(0, 10) <= to)
      .sort((a, b) => (a.start < b.start ? -1 : 1))
  }, [selectedMicro, teamAppointments])

  // Compact markers for the timeline events band
  const timelineEvents = useMemo(
    () =>
      teamAppointments.map((a) => ({
        id: a.id,
        date: a.start.slice(0, 10),
        appointmentType: a.appointmentType,
        name: a.name || '',
        hasTraining: !!a.trainingId,
      })),
    [teamAppointments]
  )

  // Training dropdown for the week's events — limited to trainings whose goal skills match the
  // week's target skills (its own, else the parent mesocycle's); no skills set → whole library.
  const weekSkillIds = useMemo(() => {
    const skills = selectedMicro?.goalSkills.length
      ? selectedMicro.goalSkills
      : (selectedMicroMeso?.goalSkills ?? [])
    return new Set(skills.map((s) => s.id))
  }, [selectedMicro, selectedMicroMeso])

  const weekTrainingOptions = useMemo(
    () =>
      (allTrainings ?? [])
        .filter((tr) => {
          if (weekSkillIds.size === 0) return true
          return [tr.trainingGoalSkill1, tr.trainingGoalSkill2, tr.trainingGoalSkill3].some(
            (s) => s && weekSkillIds.has(s.id)
          )
        })
        .map((tr) => ({ id: tr.id, name: tr.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    [allTrainings, weekSkillIds]
  )

  // Timeline range: union of season dates and all cycle dates
  const timelineRange = useMemo(() => {
    const starts: string[] = []
    const ends: string[] = []
    if (plan?.seasonStart && plan?.seasonEnd) {
      starts.push(plan.seasonStart.slice(0, 10))
      ends.push(plan.seasonEnd.slice(0, 10))
    }
    for (const m of mesocycles) {
      starts.push(m.startDate.slice(0, 10))
      ends.push(m.endDate.slice(0, 10))
    }
    if (!starts.length) return null
    return {
      start: parseISO(starts.reduce((a, b) => (a < b ? a : b))),
      end: parseISO(ends.reduce((a, b) => (a > b ? a : b))),
    }
  }, [plan, mesocycles])

  // Visible timeline window: whole plan, a month, an ISO week, or a custom span
  const displayRange = useMemo(() => {
    if (!timelineRange) return null
    if (planView === 'week')
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      }
    if (planView === 'month') return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
    if (planView === 'custom' && customStart && customEnd && customEnd >= customStart)
      return { start: parseISO(customStart), end: parseISO(customEnd) }
    return timelineRange
  }, [planView, anchor, customStart, customEnd, timelineRange])

  const changeView = (v: PlanView) => {
    setPlanView(v)
    if ((v === 'week' || v === 'month') && timelineRange) {
      const now = new Date()
      setAnchor(now < timelineRange.start || now > timelineRange.end ? timelineRange.start : now)
    }
  }
  const stepPeriod = (dir: -1 | 1) =>
    setAnchor((a) => (planView === 'week' ? addWeeks(a, dir) : addMonths(a, dir)))
  const periodLabel =
    planView === 'week'
      ? fmtRange(
          format(startOfWeek(anchor, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          format(endOfWeek(anchor, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        )
      : format(anchor, 'LLLL yyyy', { locale: dfLocale() })

  const invalidate = () => refreshPlan(queryClient)

  const shiftIso = (iso: string, days: number) =>
    format(addDays(parseISO(iso.slice(0, 10)), days), 'yyyy-MM-dd')

  // Timeline drag-move / edge-resize; the server validates overlaps and containment
  const dragMutation = useMutation({
    mutationFn: ({
      kind,
      dto,
      shiftChildren,
    }: {
      kind: 'meso' | 'micro'
      dto: Partial<MesocycleDto> | Partial<MicrocycleDto>
      shiftChildren?: boolean
    }): Promise<MesocycleDto | MicrocycleDto> =>
      kind === 'meso'
        ? planningApi.updateMesocycle(dto as Partial<MesocycleDto>, { shiftChildren })
        : planningApi.updateMicrocycle(dto as Partial<MicrocycleDto>),
    onSuccess: () => {
      invalidate()
      toast.success(t('planning.saved'))
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? t('planning.saveFailed'))
    },
  })

  const moveMesocycle = (meso: MesocycleDto, days: number) =>
    dragMutation.mutate({
      kind: 'meso',
      shiftChildren: true,
      dto: {
        ...meso,
        startDate: shiftIso(meso.startDate, days),
        endDate: shiftIso(meso.endDate, days),
      },
    })

  const resizeMesocycle = (meso: MesocycleDto, days: number) => {
    const newEnd = shiftIso(meso.endDate, days)
    if (newEnd < meso.startDate.slice(0, 10)) return
    dragMutation.mutate({ kind: 'meso', dto: { ...meso, endDate: newEnd } })
  }

  const moveMicrocycle = (micro: MicrocycleDto, days: number) =>
    dragMutation.mutate({
      kind: 'micro',
      dto: {
        ...micro,
        startDate: shiftIso(micro.startDate, days),
        endDate: shiftIso(micro.endDate, days),
      },
    })

  const resizeMicrocycle = (micro: MicrocycleDto, days: number) => {
    const newEnd = shiftIso(micro.endDate, days)
    if (newEnd < micro.startDate.slice(0, 10)) return
    dragMutation.mutate({ kind: 'micro', dto: { ...micro, endDate: newEnd } })
  }

  const deleteMesoMutation = useMutation({
    mutationFn: (id: number) => planningApi.deleteMesocycle(id),
    onSuccess: () => {
      invalidate()
      setSelectedMesoId(null)
      setSelectedMicroId(null)
      toast.success(t('planning.deleted'))
    },
    onError: () => toast.error(t('planning.deleteFailed')),
  })

  const deleteMicroMutation = useMutation({
    mutationFn: (id: number) => planningApi.deleteMicrocycle(id),
    onSuccess: () => {
      invalidate()
      setSelectedMicroId(null)
      toast.success(t('planning.deleted'))
    },
    onError: () => toast.error(t('planning.deleteFailed')),
  })

  const askDeleteMeso = (meso: MesocycleDto) => {
    confirm(
      t('planning.deleteMesocycleConfirm', {
        name: meso.name,
        microcycles: meso.microcycles.length,
      }),
      () => deleteMesoMutation.mutate(meso.id),
      t('planning.deleteMesocycle')
    )
  }

  const askDeleteMicro = (micro: MicrocycleDto) => {
    confirm(
      t('planning.deleteMicrocycleConfirm', { name: micro.name }),
      () => deleteMicroMutation.mutate(micro.id),
      t('planning.deleteMicrocycle')
    )
  }

  const openNewMeso = () => {
    setEditingMeso(null)
    setMesoModalOpen(true)
  }
  const openEditMeso = (meso: MesocycleDto) => {
    setEditingMeso(meso)
    setMesoModalOpen(true)
  }
  const openNewMicro = (parent: MesocycleDto) => {
    setMicroParent(parent)
    setEditingMicro(null)
    setMicroModalOpen(true)
  }
  const openEditMicro = (micro: MicrocycleDto, parent: MesocycleDto) => {
    setMicroParent(parent)
    setEditingMicro(micro)
    setMicroModalOpen(true)
  }

  const selectMeso = (meso: MesocycleDto) => {
    setSelectedMesoId(meso.id)
    setSelectedMicroId(null)
  }
  const selectMicro = (micro: MicrocycleDto, meso: MesocycleDto) => {
    setSelectedMesoId(meso.id)
    setSelectedMicroId(micro.id)
  }

  const teamWithoutSeason = !!plan && !plan.seasonId

  return (
    <div>
      <PageHeader title={t('planning.title')} description={t('planning.subtitle')} />

      {/* Season + team selectors */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={effectiveSeasonId || ''}
          onChange={(e) => handleSeasonChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none"
        >
          <option value="">{t('planning.selectSeason')}</option>
          {(seasons ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={effectiveTeamId || ''}
          onChange={(e) => handleTeamChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none"
        >
          <option value="">{t('planning.selectTeam')}</option>
          {seasonTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        {plan?.seasonName && (
          <span className="text-sm text-gray-500">
            {plan.seasonName}
            {plan.seasonStart && plan.seasonEnd && (
              <> · {fmtRange(plan.seasonStart, plan.seasonEnd)}</>
            )}
          </span>
        )}
      </div>

      {effectiveTeamId === 0 ? (
        <EmptyState
          title={t('planning.noTeamSelected')}
          description={t('planning.noTeamSelectedHint')}
        />
      ) : planForbidden ? (
        <EmptyState title={t('planning.noAccess')} description={t('planning.noAccessHint')} />
      ) : isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {/* Tabs: cycles (mezo/microcycle plan) + season goals */}
          <div className="flex gap-6 border-b border-gray-200">
            <PlanTabButton active={activeTab === 'cycles'} onClick={() => setActiveTab('cycles')}>
              {t('planning.tabCycles')}
            </PlanTabButton>
            <PlanTabButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')}>
              {t('planning.tabGoals')}
            </PlanTabButton>
          </div>

          {teamWithoutSeason && (
            <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{t('planning.teamHasNoSeason')}</span>
            </div>
          )}

          {activeTab === 'goals' ? (
            <SeasonGoalsCard teamId={effectiveTeamId} />
          ) : !mesocycles.length ? (
            <EmptyState
              title={t('planning.empty')}
              description={isCoach ? t('planning.emptyHint') : t('planning.emptyReadOnly')}
              action={
                isCoach ? (
                  <Button onClick={openNewMeso}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t('planning.addMesocycle')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {isCoach && (
                <div className="flex justify-end">
                  <Button onClick={openNewMeso}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t('planning.addMesocycle')}
                  </Button>
                </div>
              )}
              {/* Timeline */}
              {displayRange && (
                <Card>
                  <CardContent className="space-y-3 py-4">
                    {/* View window + zoom toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={planView}
                        onChange={(e) => changeView(e.target.value as PlanView)}
                        className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none"
                      >
                        <option value="season">{t('planning.viewSeason')}</option>
                        <option value="month">{t('planning.viewMonth')}</option>
                        <option value="week">{t('planning.viewWeek')}</option>
                        <option value="custom">{t('planning.viewCustom')}</option>
                      </select>

                      {(planView === 'week' || planView === 'month') && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => stepPeriod(-1)}
                            aria-label={t('planning.prevPeriod')}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[8rem] text-center text-xs font-medium capitalize text-gray-600">
                            {periodLabel}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => stepPeriod(1)}
                            aria-label={t('planning.nextPeriod')}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {planView === 'custom' && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="date"
                            value={customEnd}
                            min={customStart || undefined}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={zoomOut}
                          aria-label={t('planning.zoomOut')}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={pxPerDay ? 'ghost' : 'outline'}
                          onClick={() => setPxPerDay(null)}
                          aria-label={t('planning.zoomFit')}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={zoomIn}
                          aria-label={t('planning.zoomIn')}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <PlanTimeline
                      rangeStart={displayRange.start}
                      rangeEnd={displayRange.end}
                      pxPerDay={pxPerDay}
                      mesocycles={mesocycles}
                      selectedMesocycleId={selectedMesoId}
                      selectedMicrocycleId={selectedMicroId}
                      onSelectMesocycle={selectMeso}
                      onSelectMicrocycle={selectMicro}
                      editable={isCoach}
                      onMoveMesocycle={moveMesocycle}
                      onResizeMesocycle={resizeMesocycle}
                      onMoveMicrocycle={moveMicrocycle}
                      onResizeMicrocycle={resizeMicrocycle}
                      events={timelineEvents}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Mesocycle detail */}
                {selectedMeso && (
                  <Card>
                    <CardContent className="space-y-3 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-block h-3 w-3 rounded-sm border',
                                phaseBlockClass(selectedMeso.phase)
                              )}
                            />
                            <h3 className="font-semibold text-gray-900">{selectedMeso.name}</h3>
                            <Badge size="sm">{t(`planning.phase${selectedMeso.phase}`)}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {fmtRange(selectedMeso.startDate, selectedMeso.endDate)} ·{' '}
                            {t('planning.days', {
                              count: daySpan(selectedMeso.startDate, selectedMeso.endDate),
                            })}
                          </p>
                        </div>
                        {isCoach && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditMeso(selectedMeso)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => askDeleteMeso(selectedMeso)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {isOutsideRange(selectedMeso, plan?.seasonStart, plan?.seasonEnd) && (
                        <p className="text-xs text-amber-600">{t('planning.outsideSeason')}</p>
                      )}

                      {selectedMeso.goal && (
                        <p className="text-sm text-gray-700">{selectedMeso.goal}</p>
                      )}
                      <SkillChips skills={selectedMeso.goalSkills} />

                      {/* Microcycles list */}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">
                            {t('planning.microcycles')}
                          </p>
                          {isCoach && (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setGenerateWeeksFor(selectedMeso)}
                              >
                                <CalendarDays className="mr-1 h-3.5 w-3.5" />
                                {t('planning.generateWeeks')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openNewMicro(selectedMeso)}
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                {t('planning.addMicrocycle')}
                              </Button>
                            </div>
                          )}
                        </div>
                        {!selectedMeso.microcycles.length ? (
                          <p className="text-sm text-gray-400">{t('planning.noMicrocycles')}</p>
                        ) : (
                          <ul className="space-y-1">
                            {selectedMeso.microcycles.map((mc) => (
                              <li key={mc.id}>
                                <button
                                  type="button"
                                  onClick={() => selectMicro(mc, selectedMeso)}
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-gray-50',
                                    selectedMicroId === mc.id && 'bg-sky-50'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'h-3 w-3 flex-shrink-0 rounded-sm border',
                                      typeBlockClass(mc.type)
                                    )}
                                  />
                                  <span className="font-medium text-gray-800">{mc.name}</span>
                                  <span className="text-xs text-gray-400">
                                    {fmtRange(mc.startDate, mc.endDate)}
                                  </span>
                                  <span className="ml-auto text-xs text-gray-400">
                                    {t(`planning.type${mc.type}`)}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <EvaluationPanel mesocycle={selectedMeso} />
                    </CardContent>
                  </Card>
                )}

                {/* Microcycle detail */}
                {selectedMicro && selectedMicroMeso && (
                  <Card>
                    <CardContent className="space-y-3 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-block h-3 w-3 rounded-sm border',
                                typeBlockClass(selectedMicro.type)
                              )}
                            />
                            <h3 className="font-semibold text-gray-900">{selectedMicro.name}</h3>
                            <Badge size="sm" variant="info">
                              {t(`planning.type${selectedMicro.type}`)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {fmtRange(selectedMicro.startDate, selectedMicro.endDate)} ·{' '}
                            {t('planning.days', {
                              count: daySpan(selectedMicro.startDate, selectedMicro.endDate),
                            })}
                          </p>
                        </div>
                        {isCoach && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditMicro(selectedMicro, selectedMicroMeso)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => askDeleteMicro(selectedMicro)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {selectedMicro.goal && (
                        <p className="text-sm text-gray-700">{selectedMicro.goal}</p>
                      )}
                      <SkillChips skills={selectedMicro.goalSkills} />

                      {/* Team events inside this week — assign a training right here */}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">
                            {t('planning.weekEvents')}
                          </p>
                          {isCoach && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEventModal({ appointment: null })}
                            >
                              <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                              {t('appointments.newEvent')}
                            </Button>
                          )}
                        </div>
                        {isCoach &&
                          weekSkillIds.size > 0 &&
                          weekEvents.some((e) => e.appointmentType === 0) && (
                            <p className="mb-1.5 text-xs text-gray-400">
                              {weekTrainingOptions.length > 0
                                ? t('planning.trainingsFilteredBySkills')
                                : t('planning.noMatchingTrainings')}
                            </p>
                          )}
                        {!weekEvents.length ? (
                          <p className="text-sm text-gray-400">{t('planning.noWeekEvents')}</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {weekEvents.map((ev) => {
                              const opts =
                                ev.trainingId &&
                                !weekTrainingOptions.some((o) => o.id === ev.trainingId)
                                  ? [
                                      {
                                        id: ev.trainingId,
                                        name: ev.trainingName ?? `#${ev.trainingId}`,
                                      },
                                      ...weekTrainingOptions,
                                    ]
                                  : weekTrainingOptions
                              return (
                                <li
                                  key={ev.id}
                                  className="rounded-lg border border-gray-100 px-2 py-1.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEventModal({ appointment: ev })}
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <p className="truncate text-sm font-medium text-gray-800">
                                        {ev.name || t(apptTypeKey(ev.appointmentType))}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {format(parseISO(ev.start), 'EEE d.M. HH:mm', {
                                          locale: dfLocale(),
                                        })}
                                      </p>
                                    </button>
                                    <Badge size="sm" variant={apptTypeVariant(ev.appointmentType)}>
                                      {t(apptTypeKey(ev.appointmentType))}
                                    </Badge>
                                  </div>
                                  {/* Training pick + preview — only for events of type Training */}
                                  {ev.appointmentType === 0 &&
                                    (isCoach ? (
                                      <div className="mt-1.5 flex items-center gap-1.5">
                                        <select
                                          value={ev.trainingId ?? ''}
                                          onChange={(e) =>
                                            setEventTrainingMutation.mutate({
                                              id: ev.id,
                                              trainingId: e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                            })
                                          }
                                          className="h-8 flex-1 rounded-lg border border-gray-300 bg-white px-2 text-xs focus:border-sky-500 focus:outline-none"
                                        >
                                          <option value="">{t('planning.noTrainingOption')}</option>
                                          {opts.map((o) => (
                                            <option key={o.id} value={o.id}>
                                              {o.name}
                                            </option>
                                          ))}
                                        </select>
                                        {ev.trainingId && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewTrainingId(ev.trainingId!)}
                                            title={t('planning.preview')}
                                            aria-label={t('planning.preview')}
                                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      ev.trainingName && (
                                        <p className="mt-1 text-xs text-sky-600">
                                          {ev.trainingName}
                                        </p>
                                      )
                                    ))}
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!selectedMeso && (
                  <p className="text-sm text-gray-400 lg:col-span-2">
                    {t('planning.selectCycleHint')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {effectiveTeamId > 0 && (
        <MesocycleModal
          isOpen={mesoModalOpen}
          onClose={() => setMesoModalOpen(false)}
          teamId={effectiveTeamId}
          existing={editingMeso}
          siblings={mesocycles}
          seasonStart={plan?.seasonStart}
          seasonEnd={plan?.seasonEnd}
        />
      )}
      {microParent && (
        <MicrocycleModal
          isOpen={microModalOpen}
          onClose={() => setMicroModalOpen(false)}
          mesocycle={microParent}
          existing={editingMicro}
        />
      )}
      {generateWeeksFor && (
        <GenerateWeeksModal
          isOpen={!!generateWeeksFor}
          onClose={() => setGenerateWeeksFor(null)}
          mesocycle={generateWeeksFor}
        />
      )}
      {eventModal && (
        <AppointmentFormModal
          isOpen
          onClose={() => setEventModal(null)}
          appointment={eventModal.appointment}
          defaultTeamId={effectiveTeamId}
          defaultDate={
            eventModal.appointment
              ? null
              : selectedMicro
                ? parseISO(selectedMicro.startDate.slice(0, 10))
                : null
          }
          onSaved={() => {
            void refreshAppointments(queryClient)
            refreshPlan(queryClient)
          }}
        />
      )}
      <TrainingDetailModal
        trainingId={previewTrainingId}
        onClose={() => setPreviewTrainingId(null)}
      />
    </div>
  )
}
