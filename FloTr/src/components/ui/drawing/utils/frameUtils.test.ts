import { describe, it, expect } from 'vitest'
import {
  DEFAULT_FRAME_DURATION_MS,
  emptyFramePositions,
  createInitialFrames,
  commitFramePositions,
  addFrameAfter,
  deleteFrame,
  moveFrame,
  updateFrameDuration,
  framesToSaveState,
} from './frameUtils'
import type { Frame, FramePositions } from '../DrawingTypes'

function positionsWithPlayerAt(x: number, y: number): FramePositions {
  const positions = emptyFramePositions()
  positions.players = [{ tool: {} as never, x, y }]
  return positions
}

function frames(...xs: number[]): Frame[] {
  return xs.map((x) => ({
    positions: positionsWithPlayerAt(x, 0),
    durationMs: DEFAULT_FRAME_DURATION_MS,
  }))
}

describe('createInitialFrames', () => {
  it('wraps the flat positions as a single frame when nothing was restored', () => {
    const flat = positionsWithPlayerAt(1, 2)
    const result = createInitialFrames(undefined, flat)
    expect(result).toEqual([{ positions: flat, durationMs: DEFAULT_FRAME_DURATION_MS }])
  })

  it('wraps the flat positions when the restored frames array is empty', () => {
    const flat = positionsWithPlayerAt(1, 2)
    expect(createInitialFrames([], flat)).toEqual([
      { positions: flat, durationMs: DEFAULT_FRAME_DURATION_MS },
    ])
  })

  it('uses the restored frames as-is when present', () => {
    const restored = frames(1, 2, 3)
    expect(createInitialFrames(restored, emptyFramePositions())).toBe(restored)
  })
})

describe('commitFramePositions', () => {
  it('replaces only the active frame positions, leaving others untouched', () => {
    const original = frames(1, 2, 3)
    const newPositions = positionsWithPlayerAt(99, 99)
    const result = commitFramePositions(original, 1, newPositions)
    expect(result[0]).toBe(original[0])
    expect(result[1].positions).toBe(newPositions)
    expect(result[2]).toBe(original[2])
  })
})

describe('addFrameAfter', () => {
  it('inserts a deep-cloned copy right after the active index', () => {
    const original = frames(1, 2)
    const result = addFrameAfter(original, 0)
    expect(result).toHaveLength(3)
    expect(result[0]).toBe(original[0])
    expect(result[1].positions).toEqual(original[0].positions)
    expect(result[1].positions).not.toBe(original[0].positions)
    expect(result[2]).toBe(original[1])
  })

  it('mutating the new frame does not affect the source frame', () => {
    const original = frames(1)
    const result = addFrameAfter(original, 0)
    result[1].positions.players[0].x = 999
    expect(original[0].positions.players[0].x).toBe(1)
  })
})

describe('deleteFrame', () => {
  it('removes the frame at the given index', () => {
    const original = frames(1, 2, 3)
    const result = deleteFrame(original, 1)
    expect(result.map((f) => f.positions.players[0].x)).toEqual([1, 3])
  })

  it('refuses to delete the last remaining frame', () => {
    const original = frames(1)
    expect(deleteFrame(original, 0)).toBe(original)
  })
})

describe('moveFrame', () => {
  it('swaps with the neighbor in the given direction', () => {
    const original = frames(1, 2, 3)
    const result = moveFrame(original, 0, 1)
    expect(result.map((f) => f.positions.players[0].x)).toEqual([2, 1, 3])
  })

  it('no-ops past the left boundary', () => {
    const original = frames(1, 2)
    expect(moveFrame(original, 0, -1)).toBe(original)
  })

  it('no-ops past the right boundary', () => {
    const original = frames(1, 2)
    expect(moveFrame(original, 1, 1)).toBe(original)
  })
})

describe('updateFrameDuration', () => {
  it('only changes the targeted frame', () => {
    const original = frames(1, 2)
    const result = updateFrameDuration(original, 0, 500)
    expect(result[0].durationMs).toBe(500)
    expect(result[1]).toBe(original[1])
  })
})

describe('framesToSaveState', () => {
  it('omits frames for a single-frame storyboard', () => {
    const only = frames(1)
    const result = framesToSaveState(only)
    expect(result.frames).toBeUndefined()
    expect(result.flat).toBe(only[0].positions)
  })

  it('includes frames once there are 2 or more', () => {
    const multi = frames(1, 2)
    const result = framesToSaveState(multi)
    expect(result.frames).toBe(multi)
    expect(result.flat).toBe(multi[0].positions)
  })
})
