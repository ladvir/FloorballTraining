import { useCallback, useState } from 'react'
import type { AnnotationState } from '../annotationTypes'

/** Undo/redo over the annotation state — trimmed copy of drawing/hooks/useUndoRedo for just {lines, freehandLines}. */
export function useAnnotationHistory() {
  const [past, setPast] = useState<AnnotationState[]>([])
  const [future, setFuture] = useState<AnnotationState[]>([])

  const record = useCallback((state: AnnotationState) => {
    setPast((p) => [...p, state])
    setFuture([])
  }, [])

  const undo = useCallback(
    (current: AnnotationState): AnnotationState | null => {
      if (past.length === 0) return null
      const prev = past[past.length - 1]
      setPast((p) => p.slice(0, -1))
      setFuture((f) => [...f, current])
      return prev
    },
    [past]
  )

  const redo = useCallback(
    (current: AnnotationState): AnnotationState | null => {
      if (future.length === 0) return null
      const next = future[future.length - 1]
      setFuture((f) => f.slice(0, -1))
      setPast((p) => [...p, current])
      return next
    },
    [future]
  )

  const clear = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return { record, undo, redo, clear, canUndo: past.length > 0, canRedo: future.length > 0 }
}
