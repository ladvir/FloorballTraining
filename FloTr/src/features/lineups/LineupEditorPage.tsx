import { useEffect, useMemo, useReducer, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, HelpCircle } from 'lucide-react'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import {
  appointmentsApi,
  formationTemplatesApi,
  lineupsApi,
  membersApi,
  teamsApi,
} from '../../api/index'
import type { LineupFormationDto, LineupRosterDto, MatchLineupDto } from '../../types/domain.types'
import { FORMATION_COLORS } from '../../types/domain.types'
import type { LineupAction } from './lineupActions'
import { nextTempId, colorClasses, rosterDisplayName, rosterShortName } from './lineupUtils'
import { SettingsPanel } from './components/SettingsPanel'
import { RosterPanel } from './components/RosterPanel'
import { FieldPanel, type FieldView } from './components/FieldPanel'
import { LineupHelpModal } from './components/LineupHelpModal'

function reducer(state: MatchLineupDto, action: LineupAction): MatchLineupDto {
  switch (action.type) {
    case 'init':
      return action.lineup
    case 'setName':
      return { ...state, name: action.name }
    case 'setAppointmentId':
      return { ...state, appointmentId: action.id }
    case 'setIsShared':
      return { ...state, isShared: action.value }
    case 'setFormationCount': {
      const count = Math.max(1, Math.min(5, action.count))
      const slotPositions = state.formations[0]?.slots.map((s) => s.position) ?? []
      const formations = [...state.formations]
      while (formations.length < count) {
        const idx = formations.length + 1
        formations.push({
          id: nextTempId(),
          index: idx,
          colorKey: FORMATION_COLORS[(idx - 1) % FORMATION_COLORS.length],
          label: null,
          slots: slotPositions.map((position) => ({
            id: nextTempId(),
            position,
            rosterId: null,
          })),
        })
      }
      while (formations.length > count) formations.pop()
      return { ...state, formationCount: count, formations }
    }
    case 'setTemplate': {
      const formations: LineupFormationDto[] = Array.from({ length: state.formationCount }, (_, i) => ({
        id: nextTempId(),
        index: i + 1,
        colorKey: FORMATION_COLORS[i % FORMATION_COLORS.length],
        label: null,
        slots: action.slots.map((position) => ({
          id: nextTempId(),
          position,
          rosterId: null,
        })),
      }))
      return { ...state, formationTemplateId: action.templateId, formations }
    }
    case 'addRoster': {
      const sortOrder = state.roster.length
      return { ...state, roster: [...state.roster, { ...action.roster, sortOrder }] }
    }
    case 'removeRoster': {
      const formations = state.formations.map((f) => ({
        ...f,
        slots: f.slots.map((s) => (s.rosterId === action.rosterId ? { ...s, rosterId: null } : s)),
      }))
      return {
        ...state,
        roster: state.roster.filter((r) => r.id !== action.rosterId),
        formations,
      }
    }
    case 'toggleAvailable': {
      let formations = state.formations
      const target = state.roster.find((r) => r.id === action.rosterId)
      const willBecomeUnavailable = target?.isAvailable === true
      if (willBecomeUnavailable) {
        // Remove from all field slots when marked unavailable
        formations = state.formations.map((f) => ({
          ...f,
          slots: f.slots.map((s) => (s.rosterId === action.rosterId ? { ...s, rosterId: null } : s)),
        }))
      }
      return {
        ...state,
        formations,
        roster: state.roster.map((r) =>
          r.id === action.rosterId ? { ...r, isAvailable: !r.isAvailable } : r
        ),
      }
    }
    case 'reorderRoster': {
      const map = new Map(state.roster.map((r) => [r.id, r] as const))
      const reordered = action.orderedIds
        .map((id, idx) => {
          const r = map.get(id)
          return r ? { ...r, sortOrder: idx } : null
        })
        .filter((r): r is LineupRosterDto => r !== null)
      return { ...state, roster: reordered }
    }
    case 'assignSlot': {
      const formations = state.formations.map((f) => {
        if (f.index !== action.formationIndex) return f
        return {
          ...f,
          slots: f.slots.map((s) => {
            if (s.id === action.slotId) return { ...s, rosterId: action.rosterId }
            // Remove the same player from another slot in the same formation
            if (action.rosterId !== null && s.rosterId === action.rosterId) {
              return { ...s, rosterId: null }
            }
            return s
          }),
        }
      })
      return { ...state, formations }
    }
    case 'swapSlot': {
      const formations = state.formations.map((f) => {
        if (f.index !== action.formationIndex) return f
        const a = f.slots.find((s) => s.id === action.slotIdA)
        const b = f.slots.find((s) => s.id === action.slotIdB)
        if (!a || !b) return f
        return {
          ...f,
          slots: f.slots.map((s) => {
            if (s.id === action.slotIdA) return { ...s, rosterId: b.rosterId }
            if (s.id === action.slotIdB) return { ...s, rosterId: a.rosterId }
            return s
          }),
        }
      })
      return { ...state, formations }
    }
    case 'setFormationLabel': {
      const formations = state.formations.map((f) =>
        f.index === action.formationIndex ? { ...f, label: action.label } : f
      )
      return { ...state, formations }
    }
    default:
      return state
  }
}

interface DragData {
  source: 'bench' | 'slot'
  rosterId?: number
  slotId?: number
  formationIndex?: number
}

export function LineupEditorPage() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string; teamId?: string }>()
  const isNew = !params.id
  const lineupId = params.id ? Number(params.id) : undefined
  const initialTeamId = params.teamId ? Number(params.teamId) : undefined
  const qc = useQueryClient()
  const { activeClubId, effectiveRole, user } = useAuthStore()
  const coachTeamIds = user?.coachTeamIds ?? []

  const [state, dispatch] = useReducer(reducer, null as unknown as MatchLineupDto)
  const [activeFormation, setActiveFormation] = useState(1)
  const [view, setView] = useState<FieldView>('single')
  const [activeDrag, setActiveDrag] = useState<{ rosterId: number; formationColor?: string } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor))

  const { data: existingLineup, isLoading: lineupLoading } = useQuery({
    queryKey: ['lineup', lineupId],
    queryFn: () => lineupsApi.getById(lineupId!),
    enabled: !!lineupId,
  })

  const { data: templates } = useQuery({
    queryKey: ['formation-templates'],
    queryFn: () => formationTemplatesApi.getAll(),
  })

  const { data: team } = useQuery({
    queryKey: ['team', initialTeamId ?? state?.teamId],
    queryFn: () => teamsApi.getById((initialTeamId ?? state?.teamId)!),
    enabled: !!(initialTeamId ?? state?.teamId),
  })

  const { data: clubMembers } = useQuery({
    queryKey: ['members', activeClubId],
    queryFn: () => membersApi.getAll(),
    enabled: !!activeClubId,
  })

  const { data: appointments } = useQuery({
    queryKey: ['appointments', 'team', team?.id],
    queryFn: () => appointmentsApi.getAll({ pageSize: 200 }),
    enabled: !!team?.id,
  })

  // Initialize state from existing or build new
  useEffect(() => {
    if (state) return // already initialized
    if (existingLineup) {
      dispatch({ type: 'init', lineup: existingLineup })
      return
    }
    if (isNew && templates && templates.length > 0 && initialTeamId) {
      const tpl = templates[0]
      const formations: LineupFormationDto[] = Array.from({ length: 3 }, (_, i) => ({
        id: nextTempId(),
        index: i + 1,
        colorKey: FORMATION_COLORS[i],
        label: null,
        slots: tpl.slots
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((s) => ({ id: nextTempId(), position: s.position, rosterId: null })),
      }))
      const draft: MatchLineupDto = {
        id: 0,
        teamId: initialTeamId,
        teamName: team?.name ?? null,
        appointmentId: null,
        appointmentName: null,
        appointmentStart: null,
        name: 'Nová sestava',
        formationTemplateId: tpl.id,
        formationTemplate: tpl,
        formationCount: 3,
        isShared: false,
        createdByUserId: null,
        createdByUserName: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roster: [],
        formations,
      }
      dispatch({ type: 'init', lineup: draft })
    }
  }, [existingLineup, isNew, templates, initialTeamId, team?.name, state])

  const saveMutation = useMutation({
    mutationFn: async (data: MatchLineupDto) => {
      if (data.id > 0) return lineupsApi.update(data.id, data)
      return lineupsApi.create(data)
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['lineups', 'team', saved.teamId] })
      if (lineupId) {
        qc.invalidateQueries({ queryKey: ['lineup', saved.id] })
        dispatch({ type: 'init', lineup: saved })
      } else {
        navigate(`/lineups/${saved.id}/edit`, { replace: true })
      }
    },
  })

  const currentTemplate = useMemo(
    () => templates?.find((t) => t.id === state?.formationTemplateId),
    [templates, state?.formationTemplateId]
  )

  if (lineupLoading || !state || !templates) return <LoadingSpinner />

  // Permission check
  const canEdit =
    effectiveRole === 'Admin' ||
    effectiveRole === 'ClubAdmin' ||
    effectiveRole === 'HeadCoach' ||
    (effectiveRole === 'Coach' && coachTeamIds.includes(state.teamId))

  if (!canEdit) {
    navigate(`/lineups/${state.id}`, { replace: true })
    return null
  }

  function onDragStart(e: DragStartEvent) {
    const active = e.active.data.current as DragData | undefined
    if (!active) return
    let rosterId: number | undefined = active.rosterId
    if (active.source === 'slot' && active.slotId !== undefined && active.formationIndex !== undefined) {
      const f = state.formations.find((x) => x.index === active.formationIndex)
      const slot = f?.slots.find((s) => s.id === active.slotId)
      rosterId = slot?.rosterId ?? undefined
    }
    if (rosterId !== undefined) {
      const formation = active.source === 'slot'
        ? state.formations.find((f) => f.index === active.formationIndex)
        : undefined
      setActiveDrag({ rosterId, formationColor: formation?.colorKey })
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDrag(null)
    const active = e.active.data.current as DragData | undefined
    const over = e.over?.data.current as { kind: 'slot' | 'bench'; slotId?: number; formationIndex?: number } | undefined
    if (!active || !over) return

    if (over.kind === 'bench') {
      // Drop to bench: clear from slot
      if (active.source === 'slot' && active.slotId && active.formationIndex !== undefined) {
        dispatch({ type: 'assignSlot', formationIndex: active.formationIndex, slotId: active.slotId, rosterId: null })
      }
      return
    }

    if (over.kind === 'slot' && over.slotId !== undefined && over.formationIndex !== undefined) {
      if (active.source === 'bench' && active.rosterId !== undefined) {
        dispatch({ type: 'assignSlot', formationIndex: over.formationIndex, slotId: over.slotId, rosterId: active.rosterId })
      } else if (active.source === 'slot' && active.slotId !== undefined && active.formationIndex !== undefined) {
        if (active.formationIndex === over.formationIndex) {
          dispatch({ type: 'swapSlot', formationIndex: active.formationIndex, slotIdA: active.slotId, slotIdB: over.slotId })
        } else {
          // Move across formations: take roster from source slot, assign to destination
          const sourceFormation = state.formations.find((f) => f.index === active.formationIndex)
          const sourceSlot = sourceFormation?.slots.find((s) => s.id === active.slotId)
          if (sourceSlot?.rosterId) {
            dispatch({ type: 'assignSlot', formationIndex: active.formationIndex, slotId: active.slotId, rosterId: null })
            dispatch({ type: 'assignSlot', formationIndex: over.formationIndex, slotId: over.slotId, rosterId: sourceSlot.rosterId })
          }
        }
      }
    }
  }

  const matchAppointments = (appointments ?? []).filter((a) => a.teamId === state.teamId && a.appointmentType === 3)

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/teams/${state.teamId}/lineups`)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <input
          value={state.name}
          onChange={(e) => dispatch({ type: 'setName', name: e.target.value })}
          className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold text-gray-900 hover:border-gray-200 focus:border-sky-500 focus:bg-white focus:outline-none"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setHelpOpen(true)}
        >
          <HelpCircle className="h-4 w-4" /> Nápověda
        </Button>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate(state)}
          loading={saveMutation.isPending}
        >
          <Save className="h-4 w-4" /> Uložit
        </Button>
      </div>

      <LineupHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveDrag(null)}>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SettingsPanel
              lineup={state}
              templates={templates}
              appointments={matchAppointments}
              teamName={team?.name}
              onChange={dispatch}
            />
          </div>
          <div className="lg:col-span-3">
            <RosterPanel
              lineup={state}
              team={team}
              clubMembers={clubMembers ?? []}
              dispatch={dispatch}
            />
          </div>
          <div className="lg:col-span-6">
            <FieldPanel
              lineup={state}
              template={currentTemplate}
              activeFormation={activeFormation}
              setActiveFormation={setActiveFormation}
              view={view}
              setView={setView}
              dispatch={dispatch}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag ? (() => {
            const r = state.roster.find((x) => x.id === activeDrag.rosterId)
            if (!r) return null
            const c = colorClasses(activeDrag.formationColor ?? 'blue')
            return (
              <div className={`pointer-events-none inline-flex items-center gap-2 rounded-full border-2 border-white px-3 py-1.5 text-sm font-medium shadow-lg ${
                activeDrag.formationColor ? `${c.bg} text-white` : 'bg-gray-700 text-white'
              }`}>
                {rosterDisplayName(r)}
                <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
                  {activeDrag.formationColor ? rosterShortName(r) : 'přesouvám'}
                </span>
              </div>
            )
          })() : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
