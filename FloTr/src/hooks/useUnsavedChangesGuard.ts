import { useEffect, useCallback, useState, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Blocks navigation and browser close/refresh when there are unsaved changes.
 * Uses manual dirty tracking for reliability with complex forms.
 */
export function useUnsavedChangesGuard() {
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)

  const markDirty = useCallback(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true
      setDirty(true)
    }
  }, [])

  const markClean = useCallback(() => {
    dirtyRef.current = false
    setDirty(false)
  }, [])

  // Block in-app navigation via React Router
  const blocker = useBlocker(dirty)

  // Block browser close / refresh / back
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const confirm = useCallback(() => {
    if (blocker.state === 'blocked') blocker.proceed()
  }, [blocker])

  const cancel = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  return {
    isBlocked: blocker.state === 'blocked',
    confirm,
    cancel,
    markDirty,
    markClean,
  }
}
