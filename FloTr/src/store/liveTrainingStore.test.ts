import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveTrainingStore } from './liveTrainingStore'

const store = () => useLiveTrainingStore.getState()

describe('liveTrainingStore pause / resume', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    store().close()
    store().start({ trainingId: 1, trainingName: 'T' })
  })
  afterEach(() => {
    store().close()
    vi.useRealTimers()
  })

  it('freezes the clock on pause and continues from the same elapsed on resume', () => {
    vi.setSystemTime(10_000) // 10 s into the part
    store().pause()
    expect(store().session!.pausedAtMs).toBe(10_000)

    vi.setSystemTime(15_000) // paused for 5 s
    store().resume()
    const s = store().session!

    expect(s.pausedAtMs).toBeUndefined()
    // Clock base moved forward by the 5 s pause → elapsed at "now" (15 s) is still exactly 10 s.
    expect(15_000 - s.partStartedMs).toBe(10_000)
    expect(15_000 - s.sessionStartMs).toBe(10_000)

    // …and it keeps ticking from there.
    vi.setSystemTime(18_000)
    expect(18_000 - store().session!.partStartedMs).toBe(13_000)
  })

  it('a second pause/resume adds to the shift, not replaces it', () => {
    vi.setSystemTime(5_000)
    store().pause()
    vi.setSystemTime(9_000) // +4 s paused
    store().resume()
    vi.setSystemTime(12_000)
    store().pause()
    vi.setSystemTime(20_000) // +8 s paused
    store().resume()

    // 12 s wall elapsed minus 4 + 8 s paused = 8 s of real training at wall-time 20 s.
    expect(20_000 - store().session!.partStartedMs).toBe(8_000)
  })

  it('nextPart is a no-op while paused', () => {
    store().pause()
    store().nextPart()
    expect(store().session!.currentPartIndex).toBe(0)
    store().resume()
    store().nextPart()
    expect(store().session!.currentPartIndex).toBe(1)
  })
})
