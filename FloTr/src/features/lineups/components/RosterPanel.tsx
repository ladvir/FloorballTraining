import { useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Plus, UserPlus, X, EyeOff, Eye } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import type { LineupRosterDto, MatchLineupDto, MemberDto, TeamDto } from '../../../types/domain.types'
import type { LineupAction } from '../lineupActions'
import { findFormationsForRoster, nextTempId, rosterDisplayName, colorClasses } from '../lineupUtils'
import { AddClubMemberModal } from './AddClubMemberModal'
import { AddManualPlayerModal } from './AddManualPlayerModal'

interface Props {
  lineup: MatchLineupDto
  team?: TeamDto
  clubMembers: MemberDto[]
  dispatch: React.Dispatch<LineupAction>
}

function PoolCard({ roster, lineup, onRemove, onToggle }: {
  roster: LineupRosterDto
  lineup: MatchLineupDto
  onRemove: () => void
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `roster-${roster.id}`,
    data: { source: 'bench', rosterId: roster.id },
    disabled: !roster.isAvailable,
  })

  const usedIn = findFormationsForRoster(lineup, roster.id)

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-sm ${
        roster.isAvailable ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'
      } ${isDragging ? 'opacity-30' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={`cursor-grab touch-none rounded p-0.5 text-gray-400 hover:text-gray-600 ${
          !roster.isAvailable ? 'cursor-not-allowed' : ''
        }`}
        disabled={!roster.isAvailable}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate text-gray-900">{rosterDisplayName(roster)}</span>
      {usedIn.length > 0 && (
        <div className="flex items-center gap-0.5">
          {usedIn.map((idx) => {
            const f = lineup.formations.find((x) => x.index === idx)
            const c = colorClasses(f?.colorKey ?? 'blue')
            return <span key={idx} className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
          })}
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        title={roster.isAvailable ? 'Označit jako nedostupný' : 'Vrátit mezi dostupné'}
      >
        {roster.isAvailable ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        title="Odebrat ze sestavy"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function RosterPanel({ lineup, team, clubMembers, dispatch }: Props) {
  const [showClubModal, setShowClubModal] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)

  const teamPlayers = useMemo(
    () => (team?.teamMembers ?? [])
      .filter((tm) => tm.isPlayer && tm.member)
      .map((tm) => tm.member!),
    [team]
  )

  const rosterMemberIds = useMemo(
    () => new Set(lineup.roster.map((r) => r.memberId).filter((x): x is number => !!x)),
    [lineup.roster]
  )

  function addMember(m: { id: number; firstName: string; lastName: string }) {
    if (rosterMemberIds.has(m.id)) return
    dispatch({
      type: 'addRoster',
      roster: {
        id: nextTempId(),
        memberId: m.id,
        memberFirstName: m.firstName,
        memberLastName: m.lastName,
        manualName: null,
        isAvailable: true,
        sortOrder: lineup.roster.length,
      },
    })
  }

  function addAllTeamPlayers() {
    teamPlayers
      .filter((m) => !rosterMemberIds.has(m.id))
      .forEach((m) => addMember(m))
  }

  function addManual(name: string) {
    dispatch({
      type: 'addRoster',
      roster: {
        id: nextTempId(),
        memberId: null,
        memberFirstName: null,
        memberLastName: null,
        manualName: name,
        isAvailable: true,
        sortOrder: lineup.roster.length,
      },
    })
    setShowManualModal(false)
  }

  function handleRemove(roster: LineupRosterDto) {
    const usedIn = findFormationsForRoster(lineup, roster.id)
    if (usedIn.length > 0) {
      const ok = confirm(`${rosterDisplayName(roster)} je nasazen v ${usedIn.length} formaci(ích). Opravdu odebrat ze sestavy?`)
      if (!ok) return
    }
    dispatch({ type: 'removeRoster', rosterId: roster.id })
  }

  const cadreNotInRoster = teamPlayers.filter((m) => !rosterMemberIds.has(m.id))

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 py-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Soupiska zápasu ({lineup.roster.length})
            </p>
          </div>
          <div className="space-y-1">
            {lineup.roster.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">
                Přidej hráče z kádru, klubu nebo ručně.
              </p>
            ) : (
              lineup.roster
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((r) => (
                  <PoolCard
                    key={r.id}
                    roster={r}
                    lineup={lineup}
                    onRemove={() => handleRemove(r)}
                    onToggle={() => dispatch({ type: 'toggleAvailable', rosterId: r.id })}
                  />
                ))
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          <Button size="sm" variant="outline" onClick={() => setShowClubModal(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Z klubu
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowManualModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Hráč navíc
          </Button>
        </div>
        <p className="-mt-1 text-[11px] text-gray-400">
          Hráči, kteří nejsou v žádné formaci, čekají na lavičce a nasadíš je dle potřeby.
        </p>

        {cadreNotInRoster.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Zbytek kádru ({cadreNotInRoster.length})
              </p>
              <button
                type="button"
                onClick={addAllTeamPlayers}
                className="text-xs font-medium text-sky-600 hover:underline"
              >
                Přidat všechny
              </button>
            </div>
            <div className="space-y-1">
              {cadreNotInRoster.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => addMember(m)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-200 px-2 py-1.5 text-left text-sm text-gray-600 hover:border-sky-300 hover:bg-sky-50/30"
                >
                  <span className="flex-1">
                    <strong className="text-gray-900">{m.lastName}</strong> {m.firstName}
                  </span>
                  <Plus className="h-3.5 w-3.5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <AddClubMemberModal
        open={showClubModal}
        onClose={() => setShowClubModal(false)}
        members={clubMembers}
        excludeMemberIds={rosterMemberIds}
        onConfirm={(m) => { addMember(m); setShowClubModal(false) }}
      />
      <AddManualPlayerModal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        onConfirm={addManual}
      />
    </Card>
  )
}
