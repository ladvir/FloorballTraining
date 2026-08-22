import { describe, it, expect } from 'vitest'
import { clampTrim } from './trim'

describe('clampTrim', () => {
  it('keeps a range that already fits within the video', () => {
    expect(clampTrim(1000, 4000, 10000)).toEqual({ startMs: 1000, endMs: 4000 })
  })

  it('clamps values beyond the video duration', () => {
    expect(clampTrim(-500, 20000, 10000)).toEqual({ startMs: 0, endMs: 10000 })
  })

  it('pushes end up to start when the handles cross', () => {
    expect(clampTrim(5000, 2000, 10000)).toEqual({ startMs: 5000, endMs: 5000 })
  })

  it('always rounds to whole milliseconds (backend rejects a fractional int)', () => {
    // video.duration is a float in seconds — *1000 routinely yields a fractional ms value.
    expect(clampTrim(0, 4033.3329999999996, 4033.3329999999996)).toEqual({
      startMs: 0,
      endMs: 4033,
    })
    expect(Number.isInteger(clampTrim(1000.6, 2000.4, 10000).startMs)).toBe(true)
    expect(Number.isInteger(clampTrim(1000.6, 2000.4, 10000).endMs)).toBe(true)
  })
})
