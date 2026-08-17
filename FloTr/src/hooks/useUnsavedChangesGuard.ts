import { useEffect, useCallback, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Blocks navigation and browser close/refresh when there are unsaved changes.
 * Uses manual dirty tracking for reliability with complex forms.
 */
export function useUnsavedChangesGuard() {
  const dirtyRef = useRef(false)

  const markDirty = useCallback(() => {
    dirtyRef.current = true
  }, [])

  const markClean = useCallback(() => {
    dirtyRef.current = false
  }, [])

  // Read the dirty flag lazily at navigation time (via the ref) instead of from React
  // state. This way calling markClean() immediately before navigate() — e.g. right after
  // a successful save — is honoured at once, without waiting for a re-render. Otherwise
  // the very navigation that follows a save would be wrongly blocked.
  const blocker = useBlocker(useCallback(() => dirtyRef.current, []))

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
