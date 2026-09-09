import type { BadgeStatusDto } from '../types/domain.types'

// Pure diff logic for the login celebration (see components/CelebrationOverlay). Kept free of any
// react-native / expo import so it stays in the node-only vitest suite; the SecureStore/localStorage
// persistence lives in ./celebrationStore.

// A tiny snapshot of what the player has already been congratulated for — one timestamp + two ints,
// no badge-code list, so it never nears SecureStore's value-size limit.
export interface CelebrationState {
  /** Newest MemberBadge.EarnedAt already celebrated (ISO/UTC). Later `earnedAt` ⇒ a new badge. */
  badgesSeenAt: string
  rankIndex: number
  level: number
}

export type Celebration =
  | { kind: 'rank'; rankIndex: number; level: number }
  | { kind: 'level'; rankIndex: number; level: number }
  | { kind: 'badge'; badge: BadgeStatusDto }

// `earnedAt` from the API is `DateTime` read back from SQL Server as Kind=Unspecified → serialized
// with NO 'Z' and 7 fractional digits; the stored baseline may be a Date.toISOString() with 'Z' and
// ms. Compare only the "YYYY-MM-DDTHH:MM:SS" prefix so the two formats sort chronologically.
const sec = (iso: string): string => iso.slice(0, 19)
const isAfter = (a: string, b: string): boolean => sec(a) > sec(b)

type EarnedBadge = BadgeStatusDto & { earnedAt: string }
const earnedNewestFirst = (badges: BadgeStatusDto[]): EarnedBadge[] =>
  badges
    .filter((b): b is EarnedBadge => b.earned && !!b.earnedAt)
    .sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1))

const maxEarnedAt = (badges: BadgeStatusDto[], floor: string): string =>
  earnedNewestFirst(badges).reduce((m, b) => (isAfter(b.earnedAt, m) ? b.earnedAt : m), floor)

/** First run only: how far back / how many badges we replay so a fresh install (or a player who
 *  cleared app data) still sees their recent achievements without a wall of a whole career. */
export const FIRST_RUN_WINDOW_DAYS = 14
export const FIRST_RUN_MAX_BADGES = 3

/**
 * What to congratulate the player for since `prev`. `prev == null` (first run after this feature
 * ships, or after the player cleared app data) → the newest few badges from the last couple of
 * weeks, or failing that just the single newest badge — never a full career, never a level card.
 * Otherwise: a rank promotion or a plain level-up (mutually exclusive — level resets to 1 on
 * promotion; several level-ups from one recompute collapse to one card), then each new badge.
 */
export const buildCelebrationQueue = (
  prev: CelebrationState | null,
  career: { rankIndex: number; level: number },
  badges: BadgeStatusDto[],
  now: string,
): Celebration[] => {
  const earned = earnedNewestFirst(badges)

  if (!prev) {
    const cutoff = new Date(Date.parse(now) - FIRST_RUN_WINDOW_DAYS * 86_400_000).toISOString()
    const recent = earned.filter((b) => isAfter(b.earnedAt, cutoff)).slice(0, FIRST_RUN_MAX_BADGES)
    const pick = recent.length > 0 ? recent : earned.slice(0, 1)
    return pick.map((badge) => ({ kind: 'badge', badge }))
  }

  const queue: Celebration[] = []
  if (career.rankIndex > prev.rankIndex) {
    queue.push({ kind: 'rank', rankIndex: career.rankIndex, level: career.level })
  } else if (career.rankIndex === prev.rankIndex && career.level > prev.level) {
    queue.push({ kind: 'level', rankIndex: career.rankIndex, level: career.level })
  }
  for (const b of earned.slice().reverse()) {
    if (isAfter(b.earnedAt, prev.badgesSeenAt)) queue.push({ kind: 'badge', badge: b })
  }
  return queue
}

/** The state to persist once every pending celebration has been shown (or to seed on first run). */
export const nextCelebrationState = (
  prev: CelebrationState | null,
  career: { rankIndex: number; level: number },
  badges: BadgeStatusDto[],
  now: string,
): CelebrationState => ({
  badgesSeenAt: maxEarnedAt(badges, prev?.badgesSeenAt ?? now),
  rankIndex: career.rankIndex,
  level: career.level,
})
