import type { Frame, FramePositions } from '../DrawingTypes'

export const DEFAULT_FRAME_DURATION_MS = 2000

export function emptyFramePositions(): FramePositions {
  return {
    players: [],
    equipment: [],
    lines: [],
    freehandLines: [],
    texts: [],
    numbers: [],
    shapes: [],
  }
}

/** Seeds the storyboard from a restored save: existing `frames` win, else the flat single-frame fields become frame 1. */
export function createInitialFrames(
  restoredFrames: Frame[] | undefined,
  flatPositions: FramePositions
): Frame[] {
  if (restoredFrames && restoredFrames.length > 0) return restoredFrames
  return [{ positions: flatPositions, durationMs: DEFAULT_FRAME_DURATION_MS }]
}

export function commitFramePositions(
  frames: Frame[],
  activeIndex: number,
  positions: FramePositions
): Frame[] {
  return frames.map((f, i) => (i === activeIndex ? { ...f, positions } : f))
}

/** Inserts a new frame right after activeIndex, seeded with a deep copy of that frame's positions. */
export function addFrameAfter(frames: Frame[], activeIndex: number): Frame[] {
  const newFrame: Frame = {
    positions: structuredClone(frames[activeIndex].positions),
    durationMs: DEFAULT_FRAME_DURATION_MS,
  }
  const result = [...frames]
  result.splice(activeIndex + 1, 0, newFrame)
  return result
}

/** No-ops if only one frame remains — a storyboard always keeps at least one frame. */
export function deleteFrame(frames: Frame[], index: number): Frame[] {
  if (frames.length <= 1) return frames
  return frames.filter((_, i) => i !== index)
}

/** No-ops at either boundary. */
export function moveFrame(frames: Frame[], index: number, direction: -1 | 1): Frame[] {
  const target = index + direction
  if (target < 0 || target >= frames.length) return frames
  const result = [...frames]
  ;[result[index], result[target]] = [result[target], result[index]]
  return result
}

export function updateFrameDuration(frames: Frame[], index: number, durationMs: number): Frame[] {
  return frames.map((f, i) => (i === index ? { ...f, durationMs } : f))
}

/** Backward-compatible save shape: `frames` is only emitted once there's an actual storyboard. */
export function framesToSaveState(frames: Frame[]): {
  frames: Frame[] | undefined
  flat: FramePositions
} {
  return { frames: frames.length > 1 ? frames : undefined, flat: frames[0].positions }
}
