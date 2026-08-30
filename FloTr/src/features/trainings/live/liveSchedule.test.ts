import { describe, it, expect } from 'vitest'
import { computeLiveStatus, formatClock, type LivePart } from './liveSchedule'

const PARTS: LivePart[] = [
  { name: 'Rozcvička', durationMin: 10 },
  { name: 'Hlavní část', durationMin: 30 },
  { name: 'Závěr', durationMin: 10 },
]

const T0 = 1_000_000_000_000 // arbitrary epoch ms
const min = (n: number) => n * 60_000

describe('computeLiveStatus', () => {
  it('reports on-schedule when every part started exactly on plan', () => {
    // Part 1 (index 1) entered right after part 0's 10 planned minutes, 5 min into it now.
    const s = computeLiveStatus(PARTS, 1, T0, T0 + min(10), T0 + min(15))
    expect(s.driftSec).toBe(0)
    expect(s.elapsedInPartSec).toBe(min(5) / 1000)
    expect(s.nextDueInSec).toBe(min(25) / 1000) // 30 planned - 5 elapsed
    expect(s.overrunSec).toBeLessThan(0)
    expect(s.nextPart?.name).toBe('Závěr')
    expect(s.isLastPart).toBe(false)
  })

  it('accumulates drift when a part is entered late', () => {
    // Entered part 1 at +13 min instead of +10 → 3 min behind, 1 min into it.
    const s = computeLiveStatus(PARTS, 1, T0, T0 + min(13), T0 + min(14))
    expect(s.driftSec).toBe(min(3) / 1000)
  })

  it('grows drift while the current part runs over its planned length', () => {
    // On-time entry at +10, but now 35 min into a 30-min part → 5 min overrun.
    const s = computeLiveStatus(PARTS, 1, T0, T0 + min(10), T0 + min(45))
    expect(s.overrunSec).toBe(min(5) / 1000)
    expect(s.nextDueInSec).toBe(-min(5) / 1000)
    expect(s.driftSec).toBe(min(5) / 1000)
  })

  it('flags the last part', () => {
    const s = computeLiveStatus(PARTS, 2, T0, T0 + min(40), T0 + min(45))
    expect(s.isLastPart).toBe(true)
    expect(s.nextPart).toBeNull()
  })
})

describe('formatClock', () => {
  it('formats sub-hour as m:ss and over-hour as h:mm:ss', () => {
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(-65)).toBe('1:05')
    expect(formatClock(3725)).toBe('1:02:05')
  })
})
