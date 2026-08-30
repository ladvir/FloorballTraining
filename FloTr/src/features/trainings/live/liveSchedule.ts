// Pure timing math for the live training runner. No React, no clock — the caller passes `nowMs`
// so it stays trivially testable. All durations in whole minutes (as stored on TrainingPart).

export interface LivePart {
  name: string
  durationMin: number
}

export interface LiveStatus {
  /** Seconds elapsed inside the current part (wall clock since it was started manually). */
  elapsedInPartSec: number
  /** Planned length of the current part, in seconds. */
  plannedPartSec: number
  /** > 0 = current part has already run over its planned length by this many seconds. */
  overrunSec: number
  /** Seconds until the next part is *due* per plan (negative = you should already have moved on). */
  nextDueInSec: number
  /** Whole-session drift: + = behind schedule by this many seconds, - = ahead. */
  driftSec: number
  /** The upcoming part, or null if the current one is the last. */
  nextPart: LivePart | null
  isLastPart: boolean
}

/**
 * @param parts           all parts, already ordered
 * @param currentIndex    index of the part currently running
 * @param sessionStartMs  epoch ms the runner was started
 * @param partStartedMs   epoch ms the current part was entered (manually)
 * @param nowMs           epoch ms "now"
 */
export function computeLiveStatus(
  parts: LivePart[],
  currentIndex: number,
  sessionStartMs: number,
  partStartedMs: number,
  nowMs: number
): LiveStatus {
  const current = parts[currentIndex]
  const plannedPartSec = Math.max(0, (current?.durationMin ?? 0) * 60)
  const elapsedInPartSec = Math.max(0, Math.round((nowMs - partStartedMs) / 1000))
  const overrunSec = elapsedInPartSec - plannedPartSec
  const nextDueInSec = plannedPartSec - elapsedInPartSec

  // Where the current part *should* have started (seconds after session start) vs. where it
  // actually started — that gap is the accumulated drift the coach carried into this part.
  const plannedStartSec = parts
    .slice(0, currentIndex)
    .reduce((sum, p) => sum + Math.max(0, p.durationMin) * 60, 0)
  const actualStartSec = Math.round((partStartedMs - sessionStartMs) / 1000)
  const carriedDriftSec = actualStartSec - plannedStartSec

  // Live drift also grows while the current part runs long.
  const driftSec = carriedDriftSec + Math.max(0, overrunSec)

  return {
    elapsedInPartSec,
    plannedPartSec,
    overrunSec,
    nextDueInSec,
    driftSec,
    nextPart: parts[currentIndex + 1] ?? null,
    isLastPart: currentIndex >= parts.length - 1,
  }
}

/** m:ss for short spans, h:mm:ss past an hour. Always non-negative — caller decides the sign/label. */
export function formatClock(totalSec: number): string {
  const s = Math.abs(Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(r).padStart(2, '0')}`
}
