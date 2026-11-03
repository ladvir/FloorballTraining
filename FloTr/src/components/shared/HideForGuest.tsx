import type { ReactNode } from 'react'
import { useAuthStore } from '../../store/authStore'

/** Renders nothing for a read-only team guest (PDF export, create/edit actions…). */
export function HideForGuest({ children }: { children: ReactNode }) {
  const isGuest = useAuthStore((s) => s.isGuest)
  return isGuest ? null : <>{children}</>
}
