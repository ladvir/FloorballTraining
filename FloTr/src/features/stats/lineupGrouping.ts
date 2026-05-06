import type { MatchLineupDto, FormationColorKey } from '../../types/domain.types'

export interface GroupedMember {
  memberId: number
  firstName: string
  lastName: string
}

export interface GroupedFormation {
  id: number
  index: number
  label?: string | null
  colorKey: FormationColorKey | string
  /** Field players (excluding goalie position) in this formation */
  members: GroupedMember[]
}

export interface LineupGrouping {
  goalies: GroupedMember[]
  formations: GroupedFormation[]
  /** Roster members not in any formation slot */
  bench: GroupedMember[]
  /** All unique members from the lineup (goalies first, then field, then bench) */
  all: { memberId: number; firstName: string; lastName: string; isGoalkeeper: boolean }[]
}

/**
 * Derive structural groups from a lineup:
 *   - goalies (members assigned to a position-0 slot in any formation)
 *   - per-formation field players (members assigned to non-goalie slots)
 *   - bench (roster members not in any formation slot)
 * A member can appear in multiple formations.
 */
export function groupLineup(lineup: MatchLineupDto): LineupGrouping {
  const rosterById = new Map(lineup.roster.map((r) => [r.id, r]))
  const memberLookup = new Map<number, GroupedMember>()
  const goalieMemberIds = new Set<number>()
  const fieldByFormation = new Map<number, GroupedMember[]>()

  // Index roster (memberId-based only; manual entries are skipped)
  for (const r of lineup.roster) {
    if (!r.memberId) continue
    if (!memberLookup.has(r.memberId)) {
      memberLookup.set(r.memberId, {
        memberId: r.memberId,
        firstName: r.memberFirstName ?? '',
        lastName: r.memberLastName ?? '',
      })
    }
  }

  for (const f of lineup.formations) {
    const list: GroupedMember[] = []
    for (const slot of f.slots) {
      if (!slot.rosterId) continue
      const r = rosterById.get(slot.rosterId)
      const memberId = r?.memberId
      if (!memberId) continue
      const m = memberLookup.get(memberId)!
      if (slot.position === 0) {
        goalieMemberIds.add(memberId)
      } else {
        if (!list.some((x) => x.memberId === memberId)) list.push(m)
      }
    }
    fieldByFormation.set(f.id, list)
  }

  const goalies: GroupedMember[] = []
  for (const id of goalieMemberIds) {
    const m = memberLookup.get(id)
    if (m) goalies.push(m)
  }

  const formations: GroupedFormation[] = lineup.formations
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((f) => ({
      id: f.id,
      index: f.index,
      label: f.label,
      colorKey: f.colorKey,
      members: (fieldByFormation.get(f.id) ?? []).filter((m) => !goalieMemberIds.has(m.memberId)),
    }))

  const inFormation = new Set<number>()
  for (const f of formations) for (const m of f.members) inFormation.add(m.memberId)
  for (const id of goalieMemberIds) inFormation.add(id)

  const bench: GroupedMember[] = []
  for (const m of memberLookup.values()) {
    if (!inFormation.has(m.memberId)) bench.push(m)
  }

  const all: LineupGrouping['all'] = []
  // Goalies first, then field (in formation order, deduped), then bench
  const seen = new Set<number>()
  for (const g of goalies) {
    if (seen.has(g.memberId)) continue
    seen.add(g.memberId)
    all.push({ ...g, isGoalkeeper: true })
  }
  for (const f of formations) {
    for (const m of f.members) {
      if (seen.has(m.memberId)) continue
      seen.add(m.memberId)
      all.push({ ...m, isGoalkeeper: false })
    }
  }
  for (const b of bench) {
    if (seen.has(b.memberId)) continue
    seen.add(b.memberId)
    all.push({ ...b, isGoalkeeper: false })
  }

  return { goalies, formations, bench, all }
}
