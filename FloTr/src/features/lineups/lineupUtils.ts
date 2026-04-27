import type { FormationColorKey, LineupRosterDto, MatchLineupDto } from '../../types/domain.types'

export const COLOR_CLASSES: Record<FormationColorKey, {
  bg: string
  bgSoft: string
  border: string
  text: string
  ring: string
  dot: string
}> = {
  blue: {
    bg: 'bg-blue-500',
    bgSoft: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    ring: 'ring-blue-500',
    dot: 'bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-500',
    bgSoft: 'bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500',
    bgSoft: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-700',
    ring: 'ring-amber-500',
    dot: 'bg-amber-500',
  },
  violet: {
    bg: 'bg-violet-500',
    bgSoft: 'bg-violet-50',
    border: 'border-violet-500',
    text: 'text-violet-700',
    ring: 'ring-violet-500',
    dot: 'bg-violet-500',
  },
  pink: {
    bg: 'bg-pink-500',
    bgSoft: 'bg-pink-50',
    border: 'border-pink-500',
    text: 'text-pink-700',
    ring: 'ring-pink-500',
    dot: 'bg-pink-500',
  },
}

export function colorClasses(key: string) {
  return COLOR_CLASSES[(key as FormationColorKey)] ?? COLOR_CLASSES.blue
}

export function rosterDisplayName(r: LineupRosterDto): string {
  if (r.memberLastName || r.memberFirstName) {
    const last = r.memberLastName ?? ''
    const first = r.memberFirstName ?? ''
    return `${last}${last && first ? ' ' : ''}${first}`.trim()
  }
  return r.manualName ?? 'Hráč'
}

export function rosterShortName(r: LineupRosterDto): string {
  if (r.memberLastName) return r.memberLastName
  if (r.manualName) return r.manualName
  return 'Hráč'
}

export function rosterInitials(r: LineupRosterDto): string {
  const last = r.memberLastName ?? ''
  const first = r.memberFirstName ?? ''
  if (last || first) {
    return `${(first[0] ?? '').toUpperCase()}${(last[0] ?? '').toUpperCase()}` || '?'
  }
  if (r.manualName) {
    const parts = r.manualName.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return '?'
}

/** Returns formation indices (1-based) where this roster id is used. */
export function findFormationsForRoster(lineup: MatchLineupDto, rosterId: number): number[] {
  return lineup.formations
    .filter((f) => f.slots.some((s) => s.rosterId === rosterId))
    .map((f) => f.index)
    .sort((a, b) => a - b)
}

let tempCounter = -1
export function nextTempId(): number {
  return tempCounter--
}
