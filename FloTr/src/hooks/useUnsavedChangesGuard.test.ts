import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

// Controllable stand-in for react-router's useBlocker.
const blocker: {
  state: string
  proceed: ReturnType<typeof vi.fn>
  reset: ReturnType<typeof vi.fn>
} = {
  state: 'unblocked',
  proceed: vi.fn(),
  reset: vi.fn(),
}
let blockerCondition: (() => boolean) | undefined

vi.mock('react-router-dom', () => ({
  useBlocker: (condition: () => boolean) => {
    blockerCondition = condition
    return blocker
  },
}))

import { useUnsavedChangesGuard } from './useUnsavedChangesGuard'

beforeEach(() => {
  blocker.state = 'unblocked'
  blocker.proceed.mockClear()
  blocker.reset.mockClear()
  blockerCondition = undefined
})

describe('useUnsavedChangesGuard', () => {
  it('starts clean and unblocked', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard())
    expect(result.current.isBlocked).toBe(false)
    expect(blockerCondition?.()).toBe(false)
  })

  it('markDirty/markClean toggle the navigation-block condition', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard())

    act(() => result.current.markDirty())
    expect(blockerCondition?.()).toBe(true)

    act(() => result.current.markClean())
    expect(blockerCondition?.()).toBe(false)
  })

  it('reports blocked state and proceeds on confirm', () => {
    blocker.state = 'blocked'
    const { result } = renderHook(() => useUnsavedChangesGuard())

    expect(result.current.isBlocked).toBe(true)
    act(() => result.current.confirm())
    expect(blocker.proceed).toHaveBeenCalledTimes(1)
  })

  it('resets the blocker on cancel', () => {
    blocker.state = 'blocked'
    const { result } = renderHook(() => useUnsavedChangesGuard())

    act(() => result.current.cancel())
    expect(blocker.reset).toHaveBeenCalledTimes(1)
  })
})
