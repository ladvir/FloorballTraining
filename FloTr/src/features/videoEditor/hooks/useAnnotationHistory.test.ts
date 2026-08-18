import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAnnotationHistory } from './useAnnotationHistory'
import type { AnnotationState } from '../annotationTypes'

const empty: AnnotationState = { lines: [], freehandLines: [] }
const withOneLine: AnnotationState = {
  lines: [
    {
      id: 'a',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      color: '#000',
      type: 'line',
      strokeWidth: 2,
      startMs: 0,
      endMs: 2000,
    },
  ],
  freehandLines: [],
}

describe('useAnnotationHistory', () => {
  it('starts with nothing to undo/redo', () => {
    const { result } = renderHook(() => useAnnotationHistory())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('undo returns the recorded prior state and enables redo', () => {
    const { result } = renderHook(() => useAnnotationHistory())

    act(() => result.current.record(empty))
    expect(result.current.canUndo).toBe(true)

    let prev: AnnotationState | null = null
    act(() => {
      prev = result.current.undo(withOneLine)
    })
    expect(prev).toEqual(empty)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('redo replays the state that was undone', () => {
    const { result } = renderHook(() => useAnnotationHistory())

    act(() => result.current.record(empty))
    act(() => {
      result.current.undo(withOneLine)
    })

    let next: AnnotationState | null = null
    act(() => {
      next = result.current.redo(empty)
    })
    expect(next).toEqual(withOneLine)
    expect(result.current.canRedo).toBe(false)
  })

  it('a new record clears the redo stack', () => {
    const { result } = renderHook(() => useAnnotationHistory())

    act(() => result.current.record(empty))
    act(() => {
      result.current.undo(withOneLine)
    })
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.record(empty))
    expect(result.current.canRedo).toBe(false)
  })
})
